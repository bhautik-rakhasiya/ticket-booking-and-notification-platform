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
};

export default notificationRepository;
