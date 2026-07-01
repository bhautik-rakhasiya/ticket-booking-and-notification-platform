import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service";
import { CreateBookingInput } from "../types";

/**
 * POST /api/bookings
 * Creates a new booking with atomic seat reservation.
 * Returns 202 Accepted with booking summary including pricing.
 */
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateBookingInput = req.body;
    const booking = await bookingService.createBooking(input);

    // 202 Accepted – booking received, will be processed asynchronously
    res.status(202).json({
      bookingId: booking.bookingId,
      status: booking.status,
      ticketPrice: booking.ticketPrice,
      totalAmount: booking.totalAmount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/:bookingId
 * Returns the full status and details of a booking.
 * Responds with 404 if not found.
 */
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.getById(bookingId);

    res.status(200).json({
      bookingId: booking.bookingId,
      status: booking.status,
      eventId: booking.eventId,
      userId: booking.userId,
      seatCount: booking.seatCount,
      ticketPrice: booking.ticketPrice,
      totalAmount: booking.totalAmount,
    });
  } catch (err) {
    next(err);
  }
};
