import prisma from "../config/database";

export const notificationRepository = {
  async createNotification(data: {
    bookingId: string;
    type: "SUCCESS" | "FAILURE";
    message?: string;
  }) {
    return prisma.notification.create({
      data: {
        bookingId: data.bookingId,
        type: data.type,
        message: data.message,
        status: "PENDING",
      },
    });
  },

  async updateStatus(id: string, status: "SENT" | "FAILED" | "DLQ", retryCount?: number) {
    return prisma.notification.update({
      where: { id },
      data: {
        status,
        retryCount,
      },
    });
  },

  // ─────────────────────────────────────────
  // Notification Query Methods (for API)
  // ─────────────────────────────────────────

  /**
   * Counts total notifications for a given userId.
   * Joins Notification → Booking → userId.
   */
  async findNotificationCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        booking: { userId },
      },
    });
  },

  /**
   * Returns the latest `limit` notifications for a userId, newest first.
   * Includes booking info so the frontend can display event names.
   */
  async findLatestNotifications(userId: string, limit = 10) {
    return prisma.notification.findMany({
      where: {
        booking: { userId },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        booking: {
          select: {
            id: true,
            userId: true,
            seatCount: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },
};

export default notificationRepository;
