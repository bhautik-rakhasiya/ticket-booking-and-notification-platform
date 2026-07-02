import "dotenv/config";
import { connectRabbitMQ } from "../messaging/connection";
import { processNotificationEvent } from "../messaging/consumer";
import { QUEUES } from "../../../../shared/messaging/queues";
import logger from "../utils/logger";

/**
 * Starts consuming from booking.failed.queue.
 * Delegates all processing to the shared processNotificationEvent handler.
 */
export async function startBookingFailedConsumer(): Promise<void> {
  const { channel } = await connectRabbitMQ();

  logger.info(`[booking-failed.consumer] 🎧 Listening on: ${QUEUES.BOOKING_FAILED}`);

  await channel.consume(
    QUEUES.BOOKING_FAILED,
    async (msg) => {
      if (!msg) {
        logger.warn("[booking-failed.consumer] Consumer cancelled by broker.");
        return;
      }
      await processNotificationEvent(msg, "booking-failed");
    },
    { noAck: false }
  );
}

export default startBookingFailedConsumer;
