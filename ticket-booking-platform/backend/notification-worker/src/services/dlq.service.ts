import type { ConsumeMessage } from "amqplib";
import { getChannel, DLQ_EXCHANGE } from "../messaging/connection";
import { QUEUES } from "../../../../shared/messaging/queues";
import logger from "../utils/logger";

/**
 * Moves a message to the Dead Letter Queue after all retries are exhausted.
 * Preserves the original payload and adds failure metadata in headers.
 * ACKs the original message after successful DLQ publish.
 */
export const dlqService = {
  moveToDlq(msg: ConsumeMessage, retryCount: number, errorMessage: string): void {
    const channel = getChannel();

    logger.warn(
      `[dlqService] ☠ Moving message to DLQ after ${retryCount} retries`,
      { error: errorMessage, dlq: QUEUES.NOTIFICATION_DLQ }
    );

    channel.publish(
      DLQ_EXCHANGE,
      QUEUES.NOTIFICATION_DLQ,
      msg.content,
      {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          "x-retry-count":          retryCount,
          "x-failed-at":            new Date().toISOString(),
          "x-error":                errorMessage,
          "x-original-queue":       msg.fields.routingKey,
        },
      }
    );

    // ACK the original — it's now in the DLQ
    channel.ack(msg);
  },
};

export default dlqService;
