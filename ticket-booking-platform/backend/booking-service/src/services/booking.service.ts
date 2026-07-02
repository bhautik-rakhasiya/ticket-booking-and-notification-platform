import { bookingRepository } from "../repositories/booking.repository";
import { eventRepository } from "../repositories/event.repository";
import { BookingResponse, CreateBookingInput } from "../types";
import { ConflictError, NotFoundError } from "../utils/errors";
import { publisherService } from "./publisher.service";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";
import logger from "../utils/logger";

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
   * Phase 1 — Messaging:
   *  After the transaction commits, a booking.created event is published
   *  to RabbitMQ. If publishing fails the booking is NOT rolled back —
   *  the data is already persisted. The error is logged for observability.
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

    // ── Generate Idempotency Key ───────────────────────────────────────
    // Deterministic key based on user, event, and seat count to prevent
    // duplicate bookings of the same size for the same event by the same user.
    const idempotencyKey = `idemp:${input.userId}:${input.eventId}:${input.seatCount}`;

    // ── Atomic seat reservation inside DB transaction ──────────────────
    // After this call returns, the transaction is fully committed.
    const booking = await bookingRepository.createWithSeatReservation({
      ...input,
      idempotencyKey,
      ticketPrice,
      totalAmount,
    });

    // ── Publish booking.created event (AFTER commit) ───────────────────
    // IMPORTANT: Never publish inside the transaction.
    // If publish fails, log the error. Do NOT rollback — booking is committed.
    try {
      const eventPayload = {
        eventType: ROUTING_KEYS.BOOKING_CREATED,  // "booking.created"
        bookingId: booking.bookingId,
        eventId: booking.eventId,
        userId: booking.userId,
        seatCount: booking.seatCount,
        ticketPrice: booking.ticketPrice,
        totalAmount: booking.totalAmount,
        createdAt: new Date().toISOString(),
      };

      await publisherService.publish(ROUTING_KEYS.BOOKING_CREATED, eventPayload);
    } catch (publishErr) {
      // Publish failure must never fail the booking response.
      logger.error(
        "[bookingService] booking.created publish failed for bookingId=%s: %o",
        booking.bookingId,
        publishErr
      );
    }

    return booking;
  },
};
