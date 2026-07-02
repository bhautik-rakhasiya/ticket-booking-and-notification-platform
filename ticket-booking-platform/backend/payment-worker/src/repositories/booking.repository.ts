import prisma from "../config/database";
import logger from "../utils/logger";

export const bookingRepository = {
  /**
   * Finds a booking by ID.
   * Returns null if not found.
   */
  async findById(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
    });
  },

  /**
   * Marks a booking as CONFIRMED.
   * Idempotent: only updates if current status is PENDING.
   * Returns updated booking or null if already processed.
   */
  async confirmBooking(bookingId: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId, status: "PENDING" },
        data: {
          status: "CONFIRMED",
          updatedAt: new Date(),
        },
      });
      return booking;
    } catch (err: any) {
      // Prisma throws P2025 (RecordNotFound) when WHERE clause matches nothing
      // This means booking was already processed (CONFIRMED or FAILED) — safe to skip
      if (err?.code === "P2025") {
        logger.warn(`[bookingRepository] Booking ${bookingId} already processed — skipping confirm.`);
        return null;
      }
      throw err;
    }
  },

  /**
   * Marks a booking as FAILED and releases seats in a single atomic transaction.
   * Idempotent: only updates if current status is PENDING.
   * Returns true if updated, false if already processed.
   */
  async failBookingAndReleaseSeats(
    bookingId: string,
    eventId: string,
    seatCount: number,
    reason: string
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Atomically mark booking as FAILED (only if still PENDING)
        const updated = await tx.booking.updateMany({
          where: { id: bookingId, status: "PENDING" },
          data: {
            status: "FAILED",
            failureReason: reason,
            updatedAt: new Date(),
          },
        });

        // If count is 0 — already processed, nothing to do
        if (updated.count === 0) {
          logger.warn(
            `[bookingRepository] Booking ${bookingId} already processed — skipping seat release.`
          );
          return;
        }

        // 2. Release reserved seats back to the event
        await tx.$executeRaw`
          UPDATE events
          SET "availableSeats" = "availableSeats" + ${seatCount},
              status = CASE
                WHEN status = 'SOLD_OUT'::"EventStatus" THEN 'ACTIVE'::"EventStatus"
                ELSE status
              END,
              "updatedAt" = NOW()
          WHERE id = ${eventId}
        `;

        logger.info(
          `[bookingRepository] Released ${seatCount} seat(s) for event ${eventId}.`
        );
      });

      return true;
    } catch (err: any) {
      if (err?.code === "P2025") {
        return false;
      }
      throw err;
    }
  },
};

export default bookingRepository;
