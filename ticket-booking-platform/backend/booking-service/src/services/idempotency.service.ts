/**
 * Idempotency Service
 *
 * Phase 1: Idempotency is enforced via a UNIQUE database constraint on
 * the `idempotency_key` column in the `bookings` table.
 * A duplicate key results in a Prisma P2002 error → 409 Conflict.
 *
 * Phase 2: This service will be replaced with Redis-based idempotency
 * checking for faster lookups and TTL support.
 */
export const idempotencyService = {
  // Placeholder for Phase 2 Redis implementation
};
