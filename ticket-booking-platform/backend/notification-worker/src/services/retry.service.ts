import type { ConsumeMessage } from "amqplib";
import { getChannel, RETRY_EXCHANGE } from "../messaging/connection";
import { QUEUES } from "../../../../shared/messaging/queues";
import logger from "../utils/logger";

const MAX_RETRIES = Number(process.env.MAX_NOTIFICATION_RETRIES ?? 3);

/**
 * Reads the current retry count from the message headers.
 */
function getRetryCount(msg: ConsumeMessage): number {
  const headers = msg.properties.headers ?? {};
  return Number(headers["x-retry-count"] ?? 0);
}

/**
 * Republishes the original message to the retry queue with an incremented
 * retry count in the headers. The retry queue has an x-message-ttl that
 * expires messages back to the booking exchange after RETRY_DELAY_MS.
 *
 * ACKs the original message after successfully enqueuing the retry.
 */
export const retryService = {
  schedule(msg: ConsumeMessage, retryCount: number): void {
    const channel = getChannel();
    const nextCount = retryCount + 1;

    logger.info(
      `[retryService] Scheduling retry ${nextCount}/${MAX_RETRIES} for message`,
      { queue: QUEUES.NOTIFICATION_RETRY }
    );

    channel.publish(
      RETRY_EXCHANGE,
      QUEUES.NOTIFICATION_RETRY,
      msg.content,
      {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          "x-retry-count": nextCount,
          "x-original-routing-key": msg.fields.routingKey,
          "x-retried-at": new Date().toISOString(),
        },
      }
    );

    // ACK the original so it's removed from the main queue
    channel.ack(msg);
  },

  hasExceededMaxRetries(msg: ConsumeMessage): boolean {
    return getRetryCount(msg) >= MAX_RETRIES;
  },

  getRetryCount,
};

export default retryService;
