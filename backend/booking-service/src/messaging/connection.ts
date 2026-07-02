import amqp from "amqplib";
import envConfig from "../config/env";
import logger from "../utils/logger";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import { QUEUES } from "../../../../shared/messaging/queues";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";

let connection: amqp.ChannelModel | null = null;
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
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
}> {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    logger.info("Connecting to RabbitMQ at %s...", envConfig.rabbitMqUrl);
    const activeConnection = await amqp.connect(envConfig.rabbitMqUrl);
    const activeChannel = await activeConnection.createChannel();
    logger.info("Connected to RabbitMQ successfully.");

    await activeChannel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });
    logger.info(`Exchange '${EXCHANGES.BOOKING}' asserted (topic, durable).`);

    for (const queue of [QUEUES.BOOKING_CREATED, QUEUES.BOOKING_CONFIRMED, QUEUES.BOOKING_FAILED]) {
      await activeChannel.assertQueue(queue, { durable: true });
      logger.info(`Queue '${queue}' asserted (durable).`);
    }

    for (const { queue, routingKey } of [
      { queue: QUEUES.BOOKING_CREATED, routingKey: ROUTING_KEYS.BOOKING_CREATED },
      { queue: QUEUES.BOOKING_CONFIRMED, routingKey: ROUTING_KEYS.BOOKING_CONFIRMED },
      { queue: QUEUES.BOOKING_FAILED, routingKey: ROUTING_KEYS.BOOKING_FAILED },
    ]) {
      await activeChannel.bindQueue(queue, EXCHANGES.BOOKING, routingKey);
      logger.info(`Queue '${queue}' bound to exchange '${EXCHANGES.BOOKING}' with key '${routingKey}'.`);
    }

    logger.info("✅ RabbitMQ topology setup complete. Ready to publish.");

    activeConnection.on("close", () => {
      logger.error("RabbitMQ connection closed. Will reconnect on next publish.");
      connection = null;
      channel = null;
    });

    activeConnection.on("error", (err) => {
      logger.error("RabbitMQ connection error: %o", err);
      connection = null;
      channel = null;
    });

    connection = activeConnection;
    channel = activeChannel;

    return { connection: activeConnection, channel: activeChannel };
  } catch (err) {
    logger.error("Failed to connect to RabbitMQ: %o", err);
    throw err;
  }
}

export default connectRabbitMQ;
