import { Router } from "express";
import { getEvents, getEventById } from "../controllers/event.controller";

const router = Router();

// GET /api/events        → list all active events
router.get("/", getEvents);

// GET /api/events/:eventId  → get a single event by ID
router.get("/:eventId", getEventById);

export default router;
