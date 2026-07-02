import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import { BookingResponse, CreateBookingInput } from "../types";
import { ConflictError } from "../utils/errors";

// ─────────────────────────────────────────
// Internal input type extended with pricing
// ─────────────────────────────────────────

export interface CreateBookingData extends CreateBookingInput {
  idempotencyKey: string;
  ticketPrice: number; // event price at booking time
  totalAmount: number; // ticketPrice × seatCount
}

// ─────────────────────────────────────────
// Response mapper
// ─────────────────────────────────────────

/**
 * Maps a Prisma Booking row to the public API shape.
 * Converts Decimal fields (ticketPrice, totalAmount) to plain numbers.
 */
function toBookingResponse(booking: {
  id: string;
  status: string;
  eventId: string;
  seatCount: number;
  userId: string;
  ticketPrice: Decimal;
  totalAmount: Decimal;
}): BookingResponse {
  return {
    bookingId: booking.id,
    status: booking.status as BookingResponse["status"],
    eventId: booking.eventId,
    seatCount: booking.seatCount,
    userId: booking.userId,
    ticketPrice: booking.ticketPrice.toNumber(),
    totalAmount: booking.totalAmount.toNumber(),
  };
}

// ─────────────────────────────────────────
// Repository
// ─────────────────────────────────────────

export const bookingRepository = {
  /**
   * Finds a booking by its primary key.
   */
  async findById(id: string): Promise<BookingResponse | null> {
    const booking = await prisma.booking.findUnique({ where: { id } });
    return booking ? toBookingResponse(booking) : null;
  },

  /**
   * Checks whether a PENDING booking already exists for the same
   * userId + eventId + seatCount combination.
   *
   * Used by the service layer to enforce the rule:
   *  "Only block re-booking while payment is still in progress (PENDING).
   *   Once a booking is CONFIRMED or FAILED the user may book again."
   */
  async findPendingDuplicate(
    userId: string,
    eventId: string,
    seatCount: number
  ): Promise<boolean> {
    const existing = await prisma.booking.findFirst({
      where: { userId, eventId, seatCount, status: "PENDING" },
      select: { id: true },
    });
    return existing !== null;
  },

  /**
   * Creates a booking inside a PostgreSQL transaction.
   *
   * Concurrency safety:
   *  - Uses $queryRaw to lock the event row with SELECT ... FOR UPDATE
   *  - Re-reads availableSeats after acquiring the lock
   *  - Decrements availableSeats and sets status to SOLD_OUT when 0
   *  - All inside one ACID transaction → prevents overselling
   *
   * Pricing:
   *  - ticketPrice is the event price captured at booking time
   *  - totalAmount = ticketPrice × seatCount (calculated in service layer)
   */
  async createWithSeatReservation(
    data: CreateBookingData
  ): Promise<BookingResponse> {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the event row to prevent concurrent seat modification.
      //    Uses quoted camelCase column names as Prisma creates them in PostgreSQL.
      const lockedEvents = await tx.$queryRaw<
        Array<{
          id: string;
          availableSeats: number;
          status: string;
        }>
      >(
        Prisma.sql`
          SELECT id, "availableSeats", status::text
          FROM events
          WHERE id = ${data.eventId}
          FOR UPDATE
        `
      );

      if (lockedEvents.length === 0) {
        throw new ConflictError("Event not found during seat lock");
      }

      const lockedEvent = lockedEvents[0];

      // 2. Re-validate after acquiring lock (guards against race conditions)
      if (lockedEvent.status !== "ACTIVE") {
        throw new ConflictError("Event is not available for booking");
      }

      if (lockedEvent.availableSeats < data.seatCount) {
        throw new ConflictError(
          `Insufficient seats available. Requested: ${data.seatCount}, Available: ${lockedEvent.availableSeats}`
        );
      }

      // 3. Reserve seats – decrement and mark SOLD_OUT if exhausted
      const newAvailableSeats = lockedEvent.availableSeats - data.seatCount;
      const newStatus = newAvailableSeats === 0 ? "SOLD_OUT" : "ACTIVE";

      await tx.$executeRaw`
        UPDATE events
        SET "availableSeats" = ${newAvailableSeats},
            status = ${newStatus}::"EventStatus",
            "updatedAt" = NOW()
        WHERE id = ${data.eventId}
      `;

      // 4. Create the booking record with pricing info
      const booking = await tx.booking.create({
        data: {
          eventId:        data.eventId,
          userId:         data.userId,
          seatCount:      data.seatCount,
          ticketPrice:    data.ticketPrice,
          totalAmount:    data.totalAmount,
          idempotencyKey: data.idempotencyKey,
          status:         "PENDING",
        },
      });

      return toBookingResponse(booking);
    });
  },
};
