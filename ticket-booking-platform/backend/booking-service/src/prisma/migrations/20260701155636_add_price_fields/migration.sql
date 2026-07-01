-- Add price to events with a temporary default to handle existing rows,
-- then drop the default to enforce NOT NULL without default going forward.
ALTER TABLE "events"
  ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE "events"
  ALTER COLUMN "price" DROP DEFAULT;

-- Add ticketPrice and totalAmount to bookings with temporary defaults.
ALTER TABLE "bookings"
  ADD COLUMN "ticketPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE "bookings"
  ALTER COLUMN "ticketPrice" DROP DEFAULT,
  ALTER COLUMN "totalAmount" DROP DEFAULT;
