import "dotenv/config";
import { connectRabbitMQ } from "../messaging/connection";
import { processNotificationEvent } from "../messaging/consumer";
import { QUEUES } from "../../../../shared/messaging/queues";
import logger from "../utils/logger";

/**
 * Starts consuming from booking.confirmed.queue.
 * Delegates all processing to the shared processNotificationEvent handler.
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  const { channel } = await connectRabbitMQ();

  logger.info(`[booking-confirmed.consumer] 🎧 Listening on: ${QUEUES.BOOKING_CONFIRMED}`);

  await channel.consume(
    QUEUES.BOOKING_CONFIRMED,
    async (msg) => {
      if (!msg) {
        logger.warn("[booking-confirmed.consumer] Consumer cancelled by broker.");
        return;
      }
      await processNotificationEvent(msg, "booking-confirmed");
    },
    { noAck: false }
  );
}

export default startBookingConfirmedConsumer;
