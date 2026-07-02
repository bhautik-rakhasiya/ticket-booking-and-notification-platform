# 🎫 Ticket Booking & Notification Platform

A robust, event-driven, and concurrent ticket booking and notification platform built with **Node.js**, **Express**, **React**, **PostgreSQL**, **RabbitMQ**, and **Redis**. Designed to handle high-concurrency ticket sales safely while enforcing idempotency and eventual consistency.

---

## 1. Project Overview

This platform is a distributed ticket booking system engineered to process user bookings concurrently without overselling tickets or processing duplicate payments. By separating the API layer from transactional workers via message queues, the system handles booking submissions asynchronously while maintaining high throughput and transactional safety.

---

## 2. Assignment Overview

The assignment is designed to model a real-world high-traffic ticketing platform (like Ticketmaster or BookMyShow). It demonstrates:
* **Row-Level Locking**: Managing race conditions where thousands of users request tickets for the same event simultaneously.
* **Asynchronous Workers**: Delegating long-running payment simulation and notification delivery tasks to worker processes.
* **Idempotency Guards**: Ensuring API requests are deduplicated and payment operations are not retried or processed twice.
* **Eventual Consistency**: Ensuring that seat inventory and booking statuses remain mathematically aligned across distributed nodes.

---

## 3. Features Implemented

* **Concurrency-Safe Seat Reservation**: Employs row-level locking (`SELECT ... FOR UPDATE`) in Postgres transactions to prevent seat overselling.
* **Redis Idempotency Check**: Uses Redis keys as high-speed idempotency locks, returning immediate `409 Conflict` responses on duplicate requests.
* **Event-Driven Workflows**: Integrates RabbitMQ with dedicated routing keys (`booking.created`, `booking.confirmed`, `booking.failed`) to orchestrate asynchronous microservices.
* **Compensating Actions**: Restores reserved seats atomically if the simulated payment gateway fails the payment.
* **Notification Retry & DLQ System**: Notification worker implements a dead-letter-exchange (DLQ) retry cycle to handle transient failures before moving messages to DLQ.
* **Reactive Frontend Dashboard**: React frontend featuring dynamic booking status polling, responsive status badges, and active notifications.

---

## 4. Architecture Diagram

```mermaid
graph TD
    UI[Frontend: React/Vite] -->|POST /api/bookings| API[Booking API: Express]
    API -->|1. Idempotency Lock| REDIS[(Redis)]
    API -->|2. SELECT ... FOR UPDATE| PG[(PostgreSQL)]
    API -->|3. Publish: booking.created| RMQ[RabbitMQ Exchange]
    
    RMQ -->|Queue: booking.created.queue| PW[Payment Worker]
    PW -->|Simulate Payment| PW
    PW -->|Confirm / Release Seats| PG
    PW -->|4. Publish: booking.confirmed / booking.failed| RMQ
    
    RMQ -->|Queue: booking.confirmed / failed.queue| NW[Notification Worker]
    NW -->|Write Notification Logs| PG
    NW -->|Retry Cycle / DLQ| RMQ
```

---

## 5. Technology Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Vite.
* **Backend API & Workers**: Node.js, Express, TypeScript, TSX, Winston.
* **Database & ORM**: PostgreSQL, Prisma.
* **Message Broker**: RabbitMQ.
* **Caching & Idempotency**: Redis (via ioredis).
* **Containerization**: Docker, Docker Compose.

---

## 6. Project Structure

The project is structured as an NPM workspace containing the following services:

```text
├── backend/
│   ├── booking-service/       # Express HTTP API server (port 4000)
│   ├── payment-worker/        # Processes booking.created and simulates payment gateway
│   └── notification-worker/   # Listens for booking outcomes and sends notifications
├── frontend/                  # React dashboard web client (port 5173)
├── shared/                    # Shared TypeScript DTOs, events, and configuration
├── docker-compose.yml         # Container orchestrator configuration
├── package.json               # Root workspaces configuration
└── README.md                  # Project documentation
```

---

## 7. System Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Booking API: POST /api/bookings (eventId, userId, seatCount)
    Booking API->>Redis: Check & Set Idempotency Lock
    Note over Redis: Lock format: idemp:userId:eventId:seatCount
    alt Lock exists
        Redis-->>Booking API: Lock already exists
        Booking API-->>User: 409 Conflict
    else Lock acquired
        Booking API->>PostgreSQL: Begin transaction
        Booking API->>PostgreSQL: SELECT event FOR UPDATE (Row Lock)
        Note over PostgreSQL: Blocks other concurrent requests for the same event
        Booking API->>PostgreSQL: Deduct seats & create PENDING Booking
        Booking API->>PostgreSQL: Commit transaction
        Booking API->>RabbitMQ: Publish booking.created event
        Booking API-->>User: 202 Accepted (bookingId)
        
        Note over RabbitMQ: booking.created.queue
        RabbitMQ->>Payment Worker: Consume booking.created
        Payment Worker->>Payment Worker: Process simulated payment (80% success)
        
        alt Payment SUCCESS
            Payment Worker->>PostgreSQL: Update status to CONFIRMED
            Payment Worker->>Redis: Delete Idempotency Lock
            Payment Worker->>RabbitMQ: Publish booking.confirmed
            Note over RabbitMQ: booking.confirmed.queue
            RabbitMQ->>Notification Worker: Consume booking.confirmed
            Notification Worker->>PostgreSQL: Create SUCCESS Notification log
        else Payment FAILED
            Payment Worker->>PostgreSQL: Update status to FAILED & release reserved seats
            Payment Worker->>Redis: Delete Idempotency Lock
            Payment Worker->>RabbitMQ: Publish booking.failed
            Note over RabbitMQ: booking.failed.queue
            RabbitMQ->>Notification Worker: Consume booking.failed
            Notification Worker->>PostgreSQL: Create FAILURE Notification log
        end
    end
```

---

## 8. Database Design

The schema is defined in PostgreSQL using Prisma. It consists of three primary tables:

```text
  ┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
  │      events      │          │     bookings     │          │  notifications   │
  ├──────────────────┤          ├──────────────────┤          ├──────────────────┤
  │ id (UUID, PK)    │ 1 ─── 🌌 │ id (UUID, PK)    │ 1 ─── 🌌 │ id (UUID, PK)    │
  │ name             │          │ eventId (FK)     │          │ bookingId (FK)   │
  │ totalSeats       │          │ userId           │          │ type (Enum)      │
  │ availableSeats   │          │ seatCount        │          │ status (Enum)    │
  │ price            │          │ ticketPrice      │          │ retryCount       │
  │ status (Enum)    │          │ totalAmount      │          │ message          │
  └──────────────────┘          │ status (Enum)    │          └──────────────────┘
                                │ idempotencyKey   │
                                └──────────────────┘
```

---

## 9. RabbitMQ Messaging Flow

RabbitMQ handles asynchronous processing using a Topic Exchange named `booking.exchange`.

| Queue | Routing Key | Publisher | Consumer | Action |
| :--- | :--- | :--- | :--- | :--- |
| `booking.created.queue` | `booking.created` | `booking-service` | `payment-worker` | Triggers payment gateway simulation. |
| `booking.confirmed.queue` | `booking.confirmed` | `payment-worker` | `notification-worker` | Triggers a success notification event. |
| `booking.failed.queue` | `booking.failed` | `payment-worker` | `notification-worker` | Triggers a failure notification event. |
| `notification.retry.queue` | `notification.retry` | `notification-worker` | RabbitMQ DLX | Implements temporary backoff before retrying. |
| `notification.dlq.queue` | `notification.dlq` | `notification-worker` | Dead-Letter Queue | Holds failed messages after exceeding 3 retries. |

---

## 10. Redis Idempotency Flow

To prevent duplicate booking requests from hitting PostgreSQL (e.g., users clicking "Book" twice), a high-speed Redis lock is established before database transactions:

1. **Key Pattern**: `idemp:{userId}:{eventId}:{seatCount}`.
2. **Lock Expiry (TTL)**: Defaults to 10 minutes (`600` seconds).
3. **Execution flow**:
   * If the key already exists in Redis, the request is rejected with `409 Conflict`.
   * If it doesn't exist, the lock is acquired, and the transaction is sent to PostgreSQL.
   * Upon successful database confirmation or failure from the Payment Worker, the lock key is **deleted** so the user can place new bookings.

---

## 11. Concurrency Handling

High concurrency (e.g., 100+ requests hitting a single seat) is handled using **Row-Level Locking** in PostgreSQL:
* During booking creation, the transaction performs a `SELECT ... FOR UPDATE` on the event row:
  ```sql
  SELECT * FROM events WHERE id = $1 FOR UPDATE;
  ```
* This blocks other concurrent transactions trying to read or modify the same event row.
* Once the lock is acquired, the service validates `availableSeats >= requestedSeats`. If true, it decrements the seats and releases the lock on commit.
* If seats are exhausted, subsequent locked transactions read `availableSeats = 0` and are immediately rejected with `409 Conflict`.

---

## 12. API Overview

### 1. Create Booking
* **Endpoint**: `POST /api/bookings`
* **Request Body**:
  ```json
  {
    "eventId": "a1b2c3d4-0001-4000-8000-000000000001",
    "userId": "user-123",
    "seatCount": 2
  }
  ```
* **Response (Success - 202 Accepted)**:
  ```json
  {
    "bookingId": "8f8e8d8c-0002-4000-8000-000000000002",
    "status": "PENDING",
    "message": "Booking submitted. Processing payment..."
  }
  ```

### 2. Get Booking Status
* **Endpoint**: `GET /api/bookings/:bookingId`
* **Response (Success - 200 OK)**:
  ```json
  {
    "bookingId": "8f8e8d8c-0002-4000-8000-000000000002",
    "status": "CONFIRMED",
    "ticketPrice": 150.00,
    "totalAmount": 300.00
  }
  ```

---

## 13. Running the Project

### Prerequisites
To run the system, ensure you have the following installed on your machine:
* **Docker & Docker Desktop** (Recommended for full containerized stack run)
* **Git** (For repository cloning)
* **Node.js (v20+)** & **npm** (Required only for running locally outside Docker)
* **PostgreSQL / Redis / RabbitMQ** (Required locally only if running without Docker)

---

## 14. Quick Start (Docker Setup)

This is the easiest way to launch the entire platform (all microservices, background workers, broker network, cache instance, database, and client dashboard) in one command.

### Step 1: Clone the Repository
```bash
git clone https://github.com/bhautik-rakhasiya/ticket-booking-and-notification-platform.git
cd ticket-booking-and-notification-platform
```

### Step 2: Spin up the Containers
Run the following command to build the workspace dependencies and run the containers in detached (background) mode:
```bash
docker compose up -d --build
```

### Step 3: Access the Application Outputs
Once the services start up and their health checks report healthy, you can access the system entry points and monitoring dashboards at the following URLs:

| Service / Interface | URL | Access / Credentials |
| :--- | :--- | :--- |
| **📺 Frontend Dashboard (UI)** | **[http://localhost:5173](http://localhost:5173)** | React client to purchase tickets and view notification drawer |
| **🚀 Booking HTTP API** | **[http://localhost:4000/api](http://localhost:4000/api)** | Main Express gateway backend endpoint |
| **🐇 RabbitMQ Management Console** | **[http://localhost:15672](http://localhost:15672)** | Log in with: `guest` / `guest` to monitor active message queues |
| **🐘 PostgreSQL Database Instance** | `localhost:5432` | Username: `postgres`, Password: `postgres`, DB: `ticket_booking` |
| **🍒 Redis Caching Lock Store** | `localhost:6379` | Fast-path key lock store |

To check container statuses or inspect running service logs:
```bash
docker compose ps
docker compose logs -f
```

---

## 14a. Running Locally (Without Docker)

If you prefer to run the services individually on your host machine:

1. **Install Workspace Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Databases**:
   Copy `.env.example` in each service directory to `.env` and configure your local connection credentials.

3. **Deploy Schema**:
   Inside `backend/booking-service`:
   ```bash
   npx prisma migrate dev --schema=src/prisma/schema.prisma
   ```

4. **Launch the Services**:
   In separate terminals from the root directory, run:
   ```bash
   npm run dev:booking       # Starts booking API (port 4000)
   npm run dev:payment       # Starts payment worker
   npm run dev:notification  # Starts notification worker
   npm run dev:frontend      # Starts frontend dashboard (port 5173)
   ```

---

## 15. Environment Variables

Variables are configured directly in `docker-compose.yml` for container runs, and `.env` files for local runs.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ticket_booking` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://localhost:5672` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PAYMENT_SUCCESS_RATE` | Success rate % for payment simulation | `80` |
| `MAX_NOTIFICATION_RETRIES` | Max delivery attempts before DLQ | `3` |
| `RETRY_DELAY_MS` | Notification backoff delay in ms | `5000` |

---

## 16. Testing

### E2E Concurrency & Load Testing
A custom testing guide is available at [e2e_testing_guide.md](file:///c:/Users/bhaut/OneDrive/Desktop/Ticket-Booking-Notification-system/e2e_testing_guide.md). 

To execute automated load testing against a running server:
1. Make sure all services are running.
2. Run the load test runner script (e.g. 120 concurrent user bookings):
   ```bash
   npx tsx backend/booking-service/src/scratch/concurrency-test.ts
   ```

---

## 17. Design Decisions

### How We Prevent Overselling
At the database layer, we enforce absolute inventory correctness using PostgreSQL's row-level locking mechanism. When a booking request is received, we query the target event using a `SELECT FOR UPDATE` query within a database transaction:
```typescript
const event = await tx.$queryRaw`
  SELECT * FROM events 
  WHERE id = ${eventId} 
  FOR UPDATE;
`;
```
This forces PostgreSQL to lock the specific row representing the event. If 1,000 concurrent requests try to reserve tickets for the same event, Postgres queues their transactions and processes them sequentially. Once a transaction gains the lock, the service performs a double check: it validates if the requested seat count is still available. If seats are available, it decrements the `availableSeats` inventory and commits. If the seats are exhausted, it throws a `ConflictError` and aborts. By combining row-level locking with post-lock validation, we make it mathematically impossible to oversell even under extreme concurrent spikes.

### How We Guarantee Idempotency
Idempotency is maintained via a two-layer guard system (Redis fast-path + PostgreSQL fallback):
1. **Redis Fast-Path (Deduplication Lock)**: When a request hits `/api/bookings`, the system creates a deterministic idempotency key based on the booking details: `idemp:{userId}:{eventId}:{seatCount}`. It performs a set operation with a TTL:
   ```typescript
   const acquired = await redis.set(key, "locked", "EX", envConfig.redisTtlSeconds, "NX");
   ```
   If the user submits a duplicate request (e.g., due to double-clicking), the lock check fails immediately, and the API rejects the request with `409 Conflict` in microseconds, preventing database connection exhaustion.
2. **PostgreSQL Fallback Layer**: If Redis is offline or restarted, the database has a unique constraint on `idempotencyKey` on the `bookings` table. Before starting the transaction, the service queries PostgreSQL for any existing booking for the same user, event, and seat count with a `PENDING` status. If found, it blocks the duplicate booking request. The idempotency lock is cleared by the payment worker when a booking transitions to a final state (`CONFIRMED` or `FAILED`), allowing users to book again for the same event once the pending transaction is resolved.

### Our Retry / DLQ Strategy
Event processing is designed to be highly resilient against transient errors (such as network drops, timeout failures, or database connection resets):
1. **Prefetch Setting**: Workers set `channel.prefetch(1)`. This tells RabbitMQ only to deliver a single message to a worker instance at a time. The worker must explicitly ACK or NACK the message before receiving the next one.
2. **Notification Worker Retry Cycle**: If the notification worker fails to write a notification log, it nacks the message. Instead of simple requeuing (which blocks the queue), it publishes the message to a dedicated `notification.retry.exchange` with a custom header `x-retry-count`.
3. **Dead-Letter Exchange (DLX)**: The retry queue has a Time-To-Live (TTL) configuration (default `5000ms`) and dead-letters back to the main booking exchange. When the message expires, it is automatically re-queued for consumption.
4. **Dead-Letter Queue (DLQ)**: If a message fails more than `3` times (configured via `MAX_NOTIFICATION_RETRIES`), the message is permanently moved to the `notification.dlq.queue` with detailed error stack headers for developer inspection, ensuring that messages are never silently lost.

### How We'd Scale this to 100K Concurrent Users
To scale this architecture to handle 100,000+ concurrent users, we would deploy the following production optimizations:
1. **Distributed Locks (Redlock)**: Replace local Postgres transaction locking with a distributed Redis lock (using the Redlock algorithm) for event inventories. This shifts the serialization queue from the disk-bound PostgreSQL databases to in-memory Redis nodes, significantly reducing Postgres connection congestion.
2. **Database Connection Pooling (PgBouncer)**: Deploy PgBouncer in front of PostgreSQL. Prisma opens a connection pool per Node process; under high horizontal scaling (e.g. 50 API nodes), this easily exceeds PostgreSQL's max connection limits. PgBouncer multiplexes connections efficiently.
3. **Caching Event Inventories in Redis**: Rather than querying PostgreSQL to verify if an event is `ACTIVE` or `SOLD_OUT`, cache the event's availability state and basic metadata in Redis. The Booking API can check the cache first; only requests that pass the cache check will hit Postgres.
4. **Horizontal Scaling**:
   * **API Nodes**: Package Express services inside Docker containers and run them behind a Load Balancer (NGINX/ALB) managed by Kubernetes, automatically autoscaling based on CPU/Memory usage.
   * **Message Workers**: Spin up multiple instances of the Payment and Notification Worker containers. Since RabbitMQ distributes queue messages in a round-robin fashion, scaling workers linearly speeds up queue processing.
5. **Database Sharding or Read Replicas**: Direct all read traffic (e.g., getting the event list, checking notifications) to read-only PostgreSQL replicas, preserving the primary master database strictly for transactional writes (booking creations).

---

## 18. Future Improvements

* **Distributed Locks (Redlock)**: Implementing Redlock algorithms in Redis to manage distributed locks across multiple instances.
* **WebSocket Updates**: Upgrading the frontend polling mechanism to WebSockets or SSE (Server-Sent Events) for real-time status pushes.
* **Payment Gateway Integration**: Hooking up stripe or razorpay sandbox webhooks instead of simulating gateway outcomes.

---

## 19. Conclusion

This project demonstrates a production-grade, transaction-safe booking architecture. By combining relational locks (Postgres) with lightweight cache checks (Redis) and event routing (RabbitMQ), the system scales to handle concurrent spikes while guaranteeing that inventory remains accurate and double-payments are avoided.