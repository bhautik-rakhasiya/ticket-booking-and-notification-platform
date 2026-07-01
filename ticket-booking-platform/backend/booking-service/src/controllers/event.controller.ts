import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";

/**
 * GET /api/events
 * Returns all ACTIVE events.
 */
export const getEvents = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await eventService.getAll();
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:eventId
 * Returns a single event by ID.
 * Responds with 404 if not found.
 */
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await eventService.getById(eventId);
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
};
