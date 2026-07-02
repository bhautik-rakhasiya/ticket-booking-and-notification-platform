import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";

export const notificationController = {
  /**
   * GET /api/notifications/count?userId=user-001
   * Returns the total number of notifications for a user.
   */
  async getCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        res.status(400).json({ message: "userId query param is required" });
        return;
      }
      const count = await notificationService.getNotificationCount(userId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications?userId=user-001&limit=10
   * Returns the latest notifications for a user, newest first.
   */
  async getList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, limit } = req.query;
      if (!userId || typeof userId !== "string") {
        res.status(400).json({ message: "userId query param is required" });
        return;
      }
      const take = limit ? Math.min(50, parseInt(limit as string, 10) || 10) : 10;
      const notifications = await notificationService.getLatestNotifications(userId, take);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  },
};

export default notificationController;
