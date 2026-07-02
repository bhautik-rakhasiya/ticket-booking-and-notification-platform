import type { ConsumeMessage } from "amqplib";
import { getChannel, RETRY_EXCHANGE } from "../messaging/connection";
import { QUEUES } from "../../../../shared/messaging/queues";
import envConfig from "../config/env";
import logger from "../utils/logger";

const MAX_RETRIES = envConfig.maxNotificationRetries;

export const retryService = {
  getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers ?? {};
    return Number(headers["x-retry-count"] ?? 0);
  },

  hasExceededMaxRetries(msg: ConsumeMessage): boolean {
    return this.getRetryCount(msg) >= MAX_RETRIES;
  },

  schedule(msg: ConsumeMessage, retryCount: number): void {
    const channel = getChannel();
    const nextRetryCount = retryCount + 1;

    channel.publish(RETRY_EXCHANGE, QUEUES.NOTIFICATION_RETRY, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType,
      headers: {
        ...(msg.properties.headers ?? {}),
        "x-retry-count": nextRetryCount,
      },
    });

    channel.ack(msg);
    logger.warn(`[retry.service] Scheduled retry #${nextRetryCount} of ${MAX_RETRIES} for notification event.`);
  },
};

export default retryService;
