import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

// GET /api/notifications/count?userId=
router.get("/count", notificationController.getCount);

// GET /api/notifications?userId=&limit=10
router.get("/", notificationController.getList);

export default router;
