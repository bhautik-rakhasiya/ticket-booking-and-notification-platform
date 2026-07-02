import "dotenv/config";
import { startBookingCreatedConsumer } from "./consumers/booking-created.consumer";
import logger from "./utils/logger";
import prisma from "./config/database";

async function bootstrap(): Promise<void> {
  logger.info("🚀 Payment Worker starting...");

  // ── Verify PostgreSQL connection ────────────────────────────────────
  await prisma.$connect();
  logger.info("✅ PostgreSQL connected.");

  // ── Start RabbitMQ consumer ─────────────────────────────────────────
  // connectRabbitMQ() is called inside startBookingCreatedConsumer,
  // which sets up the full topology (exchange + queues + bindings).
  await startBookingCreatedConsumer();

  logger.info("✅ Payment Worker ready. Waiting for events...");
}

bootstrap().catch(async (err) => {
  logger.error("❌ Failed to start Payment Worker: %o", err);
  await prisma.$disconnect();
  process.exit(1);
});

// ── Graceful shutdown ───────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — shutting down Payment Worker...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received — shutting down Payment Worker...");
  await prisma.$disconnect();
  process.exit(0);
});
