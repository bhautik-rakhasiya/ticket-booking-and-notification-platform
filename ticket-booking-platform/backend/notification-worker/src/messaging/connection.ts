import amqp from "amqplib";
import rabbitMqConfig from "../config/rabbitmq";
import logger from "../utils/logger";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import { QUEUES } from "../../../../shared/messaging/queues";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Call connectRabbitMQ() first.");
  }
  return channel;
}

/**
 * Connects to RabbitMQ and sets up the full notification worker topology:
 *
 * Queues:
 *   - booking.confirmed.queue   ← consumes confirmed bookings
 *   - booking.failed.queue      ← consumes failed bookings
 *   - notification.retry.queue  ← delayed retry (TTL → routes back to main queues)
 *   - notification.dlq          ← dead-letter queue for exhausted messages
 *
 * DLQ exchange:
 *   - notification.dlq.exchange (direct) → notification.dlq
 */
export async function connectRabbitMQ(): Promise<{
  connection: amqp.Connection;
  channel: amqp.Channel;
}> {
  if (connection && channel) {
    return { connection, channel };
  }

  logger.info("[connection] Connecting to RabbitMQ at %s...", rabbitMqConfig.url);
  connection = await amqp.connect(rabbitMqConfig.url);
  channel = await connection.createChannel();

  // Process one message at a time per worker
  await channel.prefetch(1);

  // ── Main booking exchange (already set up by booking-service) ─────
  await channel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });

  // ── DLQ exchange (direct, dedicated to notification worker) ───────
  const DLQ_EXCHANGE = "notification.dlq.exchange";
  await channel.assertExchange(DLQ_EXCHANGE, "direct", { durable: true });

  // ── Retry exchange (direct, used to re-route after delay) ─────────
  const RETRY_EXCHANGE = "notification.retry.exchange";
  await channel.assertExchange(RETRY_EXCHANGE, "direct", { durable: true });

  // ── DLQ queue ─────────────────────────────────────────────────────
  await channel.assertQueue(QUEUES.NOTIFICATION_DLQ, { durable: true });
  await channel.bindQueue(QUEUES.NOTIFICATION_DLQ, DLQ_EXCHANGE, QUEUES.NOTIFICATION_DLQ);

  // ── Retry queue (TTL → dead-letter back to main booking exchange) ──
  const retryDelayMs = Number(process.env.RETRY_DELAY_MS ?? 5000);
  await channel.assertQueue(QUEUES.NOTIFICATION_RETRY, {
    durable: true,
    arguments: {
      "x-message-ttl":          retryDelayMs,
      "x-dead-letter-exchange":  EXCHANGES.BOOKING,  // after TTL, replay to main exchange
    },
  });
  await channel.bindQueue(QUEUES.NOTIFICATION_RETRY, RETRY_EXCHANGE, QUEUES.NOTIFICATION_RETRY);

  // ── Main queues (booking.confirmed / booking.failed) ──────────────
  await channel.assertQueue(QUEUES.BOOKING_CONFIRMED, { durable: true });
  await channel.assertQueue(QUEUES.BOOKING_FAILED, { durable: true });
  await channel.bindQueue(QUEUES.BOOKING_CONFIRMED, EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CONFIRMED);
  await channel.bindQueue(QUEUES.BOOKING_FAILED,    EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_FAILED);

  logger.info("[connection] ✅ RabbitMQ connected — notification topology ready.");

  connection.on("close", () => {
    logger.error("[connection] RabbitMQ connection closed.");
    connection = null;
    channel = null;
  });
  connection.on("error", (err) => {
    logger.error("[connection] RabbitMQ error: %o", err);
    connection = null;
    channel = null;
  });

  return { connection, channel };
}

// Expose exchange names for use in retry/DLQ services
export const DLQ_EXCHANGE    = "notification.dlq.exchange";
export const RETRY_EXCHANGE  = "notification.retry.exchange";

export default connectRabbitMQ;
