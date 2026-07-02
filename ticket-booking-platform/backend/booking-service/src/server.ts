import app from "./app";
import envConfig from "./config/env";
import { seedDatabase } from "./prisma/seed";
import prisma from "./config/database";
import logger from "./utils/logger";
import { connectRabbitMQ } from "./messaging/connection";

async function bootstrap(): Promise<void> {
  // ── Step 1: Seed the database ──────────────────────────────────────
  await seedDatabase();

  // ── Step 2: Connect to RabbitMQ & set up topology ─────────────────
  //   - Asserts booking.exchange (topic, durable)
  //   - Asserts booking.created.queue, booking.confirmed.queue, booking.failed.queue
  //   - Binds queues to exchange with their routing keys
  await connectRabbitMQ();

  // ── Step 3: Start HTTP server ──────────────────────────────────────
  app.listen(envConfig.port, () => {
    logger.info(`🚀 Booking service running on port ${envConfig.port}`);
  });
}

bootstrap().catch(async (err) => {
  logger.error("❌ Failed to start server: %o", err);
  await prisma.$disconnect();
  process.exit(1);
});
