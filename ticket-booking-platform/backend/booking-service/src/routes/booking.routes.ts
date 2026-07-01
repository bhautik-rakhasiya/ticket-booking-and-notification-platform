import { Router } from "express";
import { createBooking, getBookingById } from "../controllers/booking.controller";
import { validate } from "../middlewares/validate";
import { createBookingSchema } from "../validators/booking.validator";

const router = Router();

// POST /api/bookings          → create a new booking (with Joi validation)
router.post("/", validate(createBookingSchema), createBooking);

// GET  /api/bookings/:bookingId → get booking status & details
router.get("/:bookingId", getBookingById);

export default router;
