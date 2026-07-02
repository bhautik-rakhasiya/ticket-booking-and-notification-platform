import { publishMessage } from "../messaging/publisher";
import logger from "../utils/logger";

/**
 * Thin service wrapper around the messaging publisher.
 *
 * The Booking Service always calls this — never the raw publishMessage()
 * directly — so business logic stays decoupled from the transport layer.
 */
export const publisherService = {
  /**
   * Publishes an event to RabbitMQ.
   *
   * @param routingKey - Routing key (e.g. "booking.created")
   * @param payload    - Event payload object
   */
  async publish(routingKey: string, payload: unknown): Promise<void> {
    const published = await publishMessage(routingKey, payload);

    if (!published) {
      logger.error(
        `[publisherService] Failed to publish event '${routingKey}'. ` +
          "Booking already committed — outbox pattern required for retry."
      );
    }
  },
};
