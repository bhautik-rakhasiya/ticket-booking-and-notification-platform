import amqp from "amqplib";
import envConfig from "../config/env";
import logger from "../utils/logger";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import { QUEUES } from "../../../../shared/messaging/queues";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";

let connection: amqp.ChannelModel | null = null;
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
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
}> {
  if (connection && channel) {
    return { connection, channel };
  }

  logger.info("[connection] Connecting to RabbitMQ at %s...", envConfig.rabbitMqUrl);
  const activeConnection = await amqp.connect(envConfig.rabbitMqUrl);
  const activeChannel = await activeConnection.createChannel();

  await activeChannel.prefetch(1);
  await activeChannel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });

  const dlqExchange = "notification.dlq.exchange";
  await activeChannel.assertExchange(dlqExchange, "direct", { durable: true });

  const retryExchange = "notification.retry.exchange";
  await activeChannel.assertExchange(retryExchange, "direct", { durable: true });

  await activeChannel.assertQueue(QUEUES.NOTIFICATION_DLQ, { durable: true });
  await activeChannel.bindQueue(QUEUES.NOTIFICATION_DLQ, dlqExchange, QUEUES.NOTIFICATION_DLQ);

  await activeChannel.assertQueue(QUEUES.NOTIFICATION_RETRY, {
    durable: true,
    arguments: {
      "x-message-ttl": envConfig.retryDelayMs,
      "x-dead-letter-exchange": EXCHANGES.BOOKING,
    },
  });
  await activeChannel.bindQueue(QUEUES.NOTIFICATION_RETRY, retryExchange, QUEUES.NOTIFICATION_RETRY);

  await activeChannel.assertQueue(QUEUES.BOOKING_CONFIRMED, { durable: true });
  await activeChannel.assertQueue(QUEUES.BOOKING_FAILED, { durable: true });
  await activeChannel.bindQueue(QUEUES.BOOKING_CONFIRMED, EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CONFIRMED);
  await activeChannel.bindQueue(QUEUES.BOOKING_FAILED, EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_FAILED);

  logger.info("[connection] ✅ RabbitMQ connected — notification topology ready.");

  activeConnection.on("close", () => {
    logger.error("[connection] RabbitMQ connection closed.");
    connection = null;
    channel = null;
  });

  activeConnection.on("error", (err) => {
    logger.error("[connection] RabbitMQ error: %o", err);
    connection = null;
    channel = null;
  });

  connection = activeConnection;
  channel = activeChannel;

  return { connection: activeConnection, channel: activeChannel };
}

// Expose exchange names for use in retry/DLQ services
export const DLQ_EXCHANGE = "notification.dlq.exchange";
export const RETRY_EXCHANGE = "notification.retry.exchange";

export default connectRabbitMQ;
