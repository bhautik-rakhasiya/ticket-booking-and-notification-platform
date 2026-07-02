import Joi from "joi";
import { CreateBookingInput } from "../types";

// ─────────────────────────────────────────
// Booking Validators
// ─────────────────────────────────────────

/**
 * Joi schema for POST /api/bookings request body.
 *
 * Rules (as per implementation plan):
 *  - eventId:        required, UUID v4
 *  - userId:         required, string, max length 100
 *  - seatCount:      required, integer, min 1, max 10
 *  - idempotencyKey: required, string, max length 255
 */
export const createBookingSchema = Joi.object<CreateBookingInput>({
  eventId: Joi.string().uuid({ version: "uuidv4" }).required().messages({
    "string.base": "eventId must be a string",
    "string.guid": "eventId must be a valid UUID v4",
    "any.required": "eventId is required",
  }),

  userId: Joi.string().max(100).required().messages({
    "string.base": "userId must be a string",
    "string.max": "userId must not exceed 100 characters",
    "any.required": "userId is required",
  }),

  seatCount: Joi.number().integer().min(1).max(10).required().messages({
    "number.base": "seatCount must be a number",
    "number.integer": "seatCount must be an integer",
    "number.min": "seatCount must be at least 1",
    "number.max": "seatCount must not exceed 10",
    "any.required": "seatCount is required",
  })
});
