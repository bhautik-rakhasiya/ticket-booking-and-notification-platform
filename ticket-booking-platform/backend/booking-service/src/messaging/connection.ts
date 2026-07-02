import amqp from "amqplib";
import rabbitMqConfig from "../config/rabbitmq";
import logger from "../utils/logger";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import { QUEUES } from "../../../../shared/messaging/queues";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

/**
 * Returns the cached channel.
 * Must call connectRabbitMQ() before using this.
 */
export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized. Call connectRabbitMQ() first.");
  }
  return channel;
}

/**
 * Connects to RabbitMQ, creates a channel, and performs the full
 * topology setup:
 *   1. Assert topic exchange  (booking.exchange)
 *   2. Assert 3 durable queues
 *   3. Bind each queue to the exchange with its routing key
 *
 * Idempotent — safe to call multiple times (returns cached connection).
 */
export async function connectRabbitMQ(): Promise<{
  connection: amqp.Connection;
  channel: amqp.Channel;
}> {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    logger.info("Connecting to RabbitMQ at %s...", rabbitMqConfig.url);
    connection = await amqp.connect(rabbitMqConfig.url);
    channel = await connection.createChannel();
    logger.info("Connected to RabbitMQ successfully.");

    // ── Step 3: Assert exchange ────────────────────────────────────────
    await channel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });
    logger.info(`Exchange '${EXCHANGES.BOOKING}' asserted (topic, durable).`);

    // ── Step 4: Assert queues ──────────────────────────────────────────
    const queues = [
      QUEUES.BOOKING_CREATED,
      QUEUES.BOOKING_CONFIRMED,
      QUEUES.BOOKING_FAILED,
    ];

    for (const queue of queues) {
      await channel.assertQueue(queue, { durable: true });
      logger.info(`Queue '${queue}' asserted (durable).`);
    }

    // ── Step 5: Bind queues to exchange with routing keys ─────────────
    const bindings: Array<{ queue: string; routingKey: string }> = [
      { queue: QUEUES.BOOKING_CREATED,   routingKey: ROUTING_KEYS.BOOKING_CREATED },
      { queue: QUEUES.BOOKING_CONFIRMED, routingKey: ROUTING_KEYS.BOOKING_CONFIRMED },
      { queue: QUEUES.BOOKING_FAILED,    routingKey: ROUTING_KEYS.BOOKING_FAILED },
    ];

    for (const { queue, routingKey } of bindings) {
      await channel.bindQueue(queue, EXCHANGES.BOOKING, routingKey);
      logger.info(
        `Queue '${queue}' bound to exchange '${EXCHANGES.BOOKING}' with key '${routingKey}'.`
      );
    }

    logger.info("✅ RabbitMQ topology setup complete. Ready to publish.");

    // ── Reconnection handling ─────────────────────────────────────────
    connection.on("close", () => {
      logger.error("RabbitMQ connection closed. Will reconnect on next publish.");
      connection = null;
      channel = null;
    });

    connection.on("error", (err) => {
      logger.error("RabbitMQ connection error: %o", err);
      connection = null;
      channel = null;
    });

    return { connection, channel };
  } catch (err) {
    logger.error("Failed to connect to RabbitMQ: %o", err);
    throw err;
  }
}

export default connectRabbitMQ;
