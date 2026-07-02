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
 * Connects to RabbitMQ, asserts the booking exchange, all queues,
 * and bindings. Idempotent — safe to call multiple times.
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

  // Set prefetch = 1 so only one unacknowledged message per worker at a time
  await channel.prefetch(1);

  // Assert exchange
  await channel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });

  // Assert queues
  for (const queue of [QUEUES.BOOKING_CREATED, QUEUES.BOOKING_CONFIRMED, QUEUES.BOOKING_FAILED]) {
    await channel.assertQueue(queue, { durable: true });
  }

  // Bind queues to routing keys
  const bindings = [
    { queue: QUEUES.BOOKING_CREATED,   key: ROUTING_KEYS.BOOKING_CREATED },
    { queue: QUEUES.BOOKING_CONFIRMED, key: ROUTING_KEYS.BOOKING_CONFIRMED },
    { queue: QUEUES.BOOKING_FAILED,    key: ROUTING_KEYS.BOOKING_FAILED },
  ];
  for (const { queue, key } of bindings) {
    await channel.bindQueue(queue, EXCHANGES.BOOKING, key);
  }

  logger.info("[connection] ✅ RabbitMQ connected and topology ready.");

  connection.on("close", () => {
    logger.error("[connection] RabbitMQ connection closed.");
    connection = null;
    channel = null;
  });

  connection.on("error", (err) => {
    logger.error("[connection] RabbitMQ connection error: %o", err);
    connection = null;
    channel = null;
  });

  return { connection, channel };
}

export default connectRabbitMQ;
