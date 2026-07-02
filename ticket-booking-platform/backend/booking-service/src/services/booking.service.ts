import type { BookingCreatedEvent } from "../../../../shared/events";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";
import envConfig from "../config/env";
import { bookingRepository } from "../repositories/booking.repository";
import { eventRepository } from "../repositories/event.repository";
import { redisRepository } from "../repositories/redis.repository";
import { BookingResponse, CreateBookingInput } from "../types";
import logger from "../utils/logger";
import { ConflictError, NotFoundError } from "../utils/errors";
import { publisherService } from "./publisher.service";

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
      throw new ConflictError(`Event '${event.name}' is not available for booking (status: ${event.status})`);
    }

    if (event.availableSeats < input.seatCount) {
      throw new ConflictError(`Insufficient seats available. Requested: ${input.seatCount}, Available: ${event.availableSeats}`);
    }

    // ── Pricing calculation ────────────────────────────────────────────
    // Capture the price at booking time so future price changes
    // don't affect existing bookings.
    const ticketPrice = event.price;
    const totalAmount = parseFloat((ticketPrice * input.seatCount).toFixed(2));

    // ── Idempotency check — only block PENDING duplicates ──────────────────
    // Key that identifies "same user, same event, same seat count".
    // We look up any EXISTING booking with this combination first.
    const baseKey = `idemp:${input.userId}:${input.eventId}:${input.seatCount}`;

    // Redis Check (First Layer)
    const redisExists = await redisRepository.exists(baseKey);
    if (redisExists) {
      logger.warn(`[bookingService] Duplicate booking request blocked by Redis for key=${baseKey}`);
      throw new ConflictError(
        "A booking for this event with the same seat count is already being processed. " +
        "Please wait until the current booking completes."
      );
    }

    // Database check (Fallback Layer)
    const existingPending = await bookingRepository.findPendingDuplicate(input.userId, input.eventId, input.seatCount);
    if (existingPending) {
      throw new ConflictError(
        "You already have a pending booking for this event with the same seat count. " +
        "Please wait for payment processing to complete before booking again."
      );
    }

    // If a previous booking for the same combination is CONFIRMED or FAILED,
    // we must use a unique key to avoid the DB unique constraint blocking the new insert.
    const idempotencyKey = `${baseKey}:${Date.now()}`;

    // ── Atomic seat reservation inside DB transaction ──────────────────
    // After this call returns, the transaction is fully committed.
    const booking = await bookingRepository.createWithSeatReservation({
      ...input,
      idempotencyKey,
      ticketPrice,
      totalAmount,
    });

    // ── Store Redis Key (after transaction commits successfully) ─────────
    const redisTTL = Number(process.env.REDIS_TTL_SECONDS || 600);
    const redisValue = JSON.stringify({
      bookingId: booking.bookingId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });
    try {
      await redisRepository.set(baseKey, redisValue, envConfig.redisTtlSeconds);
      logger.info(`[bookingService] Idempotency lock stored in Redis for key=${baseKey} (TTL ${envConfig.redisTtlSeconds}s)`);
    } catch (err) {
      logger.error(`[bookingService] Redis SET failed for key=${baseKey}:`, err);
    }

    // ── Publish booking.created event (AFTER commit) ───────────────────
    // IMPORTANT: Never publish inside the transaction.
    // If publish fails, log the error. Do NOT rollback — booking is committed.
    try {
      const eventPayload: BookingCreatedEvent = {
        eventType: ROUTING_KEYS.BOOKING_CREATED,
        bookingId: booking.bookingId,
        eventId: booking.eventId!,
        userId: booking.userId!,
        seatCount: booking.seatCount!,
        ticketPrice: booking.ticketPrice,
        totalAmount: booking.totalAmount,
        createdAt: new Date().toISOString(),
      };

      await publisherService.publish(ROUTING_KEYS.BOOKING_CREATED, eventPayload);
    } catch (publishErr) {
      logger.error("[bookingService] booking.created publish failed for bookingId=%s: %o", booking.bookingId, publishErr);
    }

    return booking;
  },
};
