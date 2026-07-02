import { notificationRepository } from "../repositories/notification.repository";
import { BookingStatusEvent } from "../types";
import logger from "../utils/logger";

const MESSAGES = {
  CONFIRMED: "Your booking has been confirmed. Enjoy the event!",
  FAILED:    "Your booking could not be completed because payment failed.",
};

export const notificationService = {
  /**
   * Creates a notification record for a booking status event.
   *
   * Idempotency: if a notification already exists for this
   * bookingId + type pair, it is skipped silently.
   *
   * @returns the created notification, or null if duplicate.
   */
  async createNotification(event: BookingStatusEvent) {
    const type    = event.status === "CONFIRMED" ? "SUCCESS" : "FAILURE";
    const message = MESSAGES[event.status];

    // ── Idempotency check ─────────────────────────────────────────────
    const existing = await notificationRepository.findExisting(event.bookingId, type);
    if (existing) {
      logger.info(
        `[notificationService] Notification already exists for booking=${event.bookingId} type=${type} — skipping.`
      );
      return null; // signal: duplicate, safe to ACK
    }

    // ── Create notification record ────────────────────────────────────
    const notification = await notificationRepository.create({
      bookingId: event.bookingId,
      type,
      message,
    });

    // Mark as SENT immediately (no actual delivery in this implementation)
    await notificationRepository.markSent(notification.id);

    logger.info(
      `[notificationService] ✅ Notification created and marked SENT`,
      { notificationId: notification.id, bookingId: event.bookingId, type }
    );

    return notification;
  },
};

export default notificationService;
