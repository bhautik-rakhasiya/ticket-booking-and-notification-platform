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
 * Connects to RabbitMQ, asserts the booking exchange, all queues,
 * and bindings. Idempotent — safe to call multiple times.
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

  for (const queue of [QUEUES.BOOKING_CREATED, QUEUES.BOOKING_CONFIRMED, QUEUES.BOOKING_FAILED]) {
    await activeChannel.assertQueue(queue, { durable: true });
  }

  const bindings = [
    { queue: QUEUES.BOOKING_CREATED, key: ROUTING_KEYS.BOOKING_CREATED },
    { queue: QUEUES.BOOKING_CONFIRMED, key: ROUTING_KEYS.BOOKING_CONFIRMED },
    { queue: QUEUES.BOOKING_FAILED, key: ROUTING_KEYS.BOOKING_FAILED },
  ];

  for (const { queue, key } of bindings) {
    await activeChannel.bindQueue(queue, EXCHANGES.BOOKING, key);
  }

  logger.info("[connection] ✅ RabbitMQ connected and topology ready.");

  activeConnection.on("close", () => {
    logger.error("[connection] RabbitMQ connection closed.");
    connection = null;
    channel = null;
  });

  activeConnection.on("error", (err) => {
    logger.error("[connection] RabbitMQ connection error: %o", err);
    connection = null;
    channel = null;
  });

  connection = activeConnection;
  channel = activeChannel;

  return { connection: activeConnection, channel: activeChannel };
}

export default connectRabbitMQ;
