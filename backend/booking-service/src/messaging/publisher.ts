import { getChannel } from "./connection";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import logger from "../utils/logger";

/**
 * Publishes a message to the booking topic exchange.
 *
 * @param routingKey - One of the ROUTING_KEYS constants (e.g. "booking.created")
 * @param payload    - The event payload object; will be JSON-serialised.
 * @returns          - true if enqueued, false if backpressure / error.
 *
 * NOTE: Exchange/queue topology is set up once in connectRabbitMQ().
 *       This function only publishes — no setup logic here.
 */
export async function publishMessage(
  routingKey: string,
  payload: unknown
): Promise<boolean> {
  try {
    const channel = getChannel();
    const buffer = Buffer.from(JSON.stringify(payload));

    const published = channel.publish(EXCHANGES.BOOKING, routingKey, buffer, {
      persistent: true,
    });

    if (published) {
      logger.info(
        `✅ Published to '${EXCHANGES.BOOKING}' [key: ${routingKey}]`
      );
    } else {
      logger.warn(
        `⚠️  Channel write buffer full for key '${routingKey}' — message may be dropped.`
      );
    }

    return published;
  } catch (err) {
    logger.error(`❌ Error publishing to key '${routingKey}': %o`, err);
    return false;
  }
}

export default publishMessage;
