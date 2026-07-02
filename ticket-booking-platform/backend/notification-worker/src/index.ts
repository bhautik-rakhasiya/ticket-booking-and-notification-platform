import { startBookingConfirmedConsumer } from "./consumers/booking-confirmed.consumer";
import { startBookingFailedConsumer } from "./consumers/booking-failed.consumer";
import logger from "./utils/logger";
import prisma from "./config/database";

async function bootstrap(): Promise<void> {
  logger.info("🚀 Notification Worker starting...");

  // ── Verify PostgreSQL connection ────────────────────────────────────
  await prisma.$connect();
  logger.info("✅ PostgreSQL connected.");

  // ── Start both consumers ────────────────────────────────────────────
  // connectRabbitMQ() is called inside each consumer — topology is set
  // up on the first call and reused on the second (cached connection).
  await startBookingConfirmedConsumer();
  await startBookingFailedConsumer();

  logger.info("✅ Notification Worker ready. Waiting for events...");
}

bootstrap().catch(async (err) => {
  logger.error("❌ Failed to start Notification Worker: %o", err);
  await prisma.$disconnect();
  process.exit(1);
});

// ── Graceful shutdown ───────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("SIGTERM — shutting down Notification Worker...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT — shutting down Notification Worker...");
  await prisma.$disconnect();
  process.exit(0);
});
