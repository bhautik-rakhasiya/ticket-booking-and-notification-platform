import prisma from "../config/database";
import { CreateNotificationInput } from "../types";
import logger from "../utils/logger";

export const notificationRepository = {
  /**
   * Checks if a notification already exists for a bookingId + type pair.
   * Used for idempotency — prevents duplicate notifications.
   */
  async findExisting(bookingId: string, type: "SUCCESS" | "FAILURE") {
    return prisma.notification.findFirst({
      where: { bookingId, type },
    });
  },

  /**
   * Inserts a new notification record with status PENDING (= unread).
   */
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        bookingId: data.bookingId,
        type:      data.type,
        status:    "PENDING",
        message:   data.message,
      },
    });
  },

  /**
   * Marks a notification as SENT (= delivered / processed successfully).
   */
  async markSent(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data:  { status: "SENT", updatedAt: new Date() },
    });
  },

  /**
   * Marks a notification as FAILED after all retries are exhausted.
   */
  async markFailed(notificationId: string, retryCount: number) {
    return prisma.notification.update({
      where: { id: notificationId },
      data:  { status: "FAILED", retryCount, updatedAt: new Date() },
    });
  },

  /**
   * Marks a notification as DLQ (moved to dead-letter queue).
   */
  async markDlq(notificationId: string, retryCount: number) {
    return prisma.notification.update({
      where: { id: notificationId },
      data:  { status: "DLQ", retryCount, updatedAt: new Date() },
    });
  },
};

export default notificationRepository;
