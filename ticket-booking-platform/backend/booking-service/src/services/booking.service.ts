import { bookingRepository } from "../repositories/booking.repository";
import { eventRepository } from "../repositories/event.repository";
import { BookingResponse, CreateBookingInput } from "../types";
import { ConflictError, NotFoundError } from "../utils/errors";

export const bookingService = {
  /**
   * Returns booking details by ID.
   * Throws NotFoundError if booking does not exist.
   */
  async getById(bookingId: string): Promise<BookingResponse> {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(`Booking with id '${bookingId}' not found`);
    }

    return booking;
  },

  /**
   * Creates a new booking with concurrency-safe seat reservation.
   *
   * Pricing logic:
   *  - ticketPrice = event.price (captured at booking time)
   *  - totalAmount = ticketPrice × seatCount
   *
   * Business rules (validated before entering the transaction):
   *  1. Event must exist
   *  2. Event status must be ACTIVE
   *  3. Requested seats must be available
   *
   * The final atomic seat check happens inside the DB transaction
   * (SELECT FOR UPDATE) to guard against race conditions.
   *
   * NOTE: RabbitMQ publishing is intentionally NOT done here (Phase 1 only).
   */
  async createBooking(input: CreateBookingInput): Promise<BookingResponse> {
    // ── Pre-transaction business validation ────────────────────────────
    const event = await eventRepository.findById(input.eventId);

    if (!event) {
      throw new NotFoundError(`Event with id '${input.eventId}' not found`);
    }

    if (event.status !== "ACTIVE") {
      throw new ConflictError(
        `Event '${event.name}' is not available for booking (status: ${event.status})`
      );
    }

    if (event.availableSeats < input.seatCount) {
      throw new ConflictError(
        `Insufficient seats available. Requested: ${input.seatCount}, Available: ${event.availableSeats}`
      );
    }

    // ── Pricing calculation ────────────────────────────────────────────
    // Capture the price at booking time so future price changes
    // don't affect existing bookings.
    const ticketPrice = event.price;
    const totalAmount = parseFloat((ticketPrice * input.seatCount).toFixed(2));

    // ── Atomic seat reservation inside DB transaction ──────────────────
    const booking = await bookingRepository.createWithSeatReservation({
      ...input,
      ticketPrice,
      totalAmount,
    });

    return booking;
  },
};
