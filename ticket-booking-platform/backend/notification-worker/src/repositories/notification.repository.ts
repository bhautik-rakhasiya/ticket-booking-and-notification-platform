export const notificationRepository = {
  async saveNotification(data: {
    bookingId: string;
    type: "SUCCESS" | "FAILURE";
    status: string;
    message: string;
  }) {
    // Repository implementation for saving notification history
    return { id: "notif-id-mock", ...data };
  },
};

export default notificationRepository;
