import { getChannel } from "./connection";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";
import logger from "../utils/logger";

/**
 * Publishes an event to the booking topic exchange.
 * Topology must be set up via connectRabbitMQ() before calling this.
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
      logger.info(`[publisher] ✅ Published [${routingKey}]`);
    } else {
      logger.warn(`[publisher] ⚠️  Channel write buffer full for key '${routingKey}'`);
    }

    return published;
  } catch (err) {
    logger.error(`[publisher] ❌ Failed to publish [${routingKey}]: %o`, err);
    return false;
  }
}

export default publishMessage;
