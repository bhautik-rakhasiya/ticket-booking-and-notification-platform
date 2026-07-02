import { notificationRepository } from "../repositories/notification.repository";

export const notificationService = {
  /**
   * Returns total notification count for a user.
   */
  async getNotificationCount(userId: string) {
    return notificationRepository.findNotificationCount(userId);
  },

  /**
   * Returns latest notifications for a user.
   */
  async getLatestNotifications(userId: string, limit = 10) {
    return notificationRepository.findLatestNotifications(userId, limit);
  },
};

export default notificationService;
