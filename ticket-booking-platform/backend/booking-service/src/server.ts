import "dotenv/config";
import app from "./app";
import { seedDatabase } from "./prisma/seed";
import prisma from "./config/database/prisma.client";

const port = Number(process.env.PORT || 4000);

async function bootstrap(): Promise<void> {
  // Run seed upsert before accepting traffic
  await seedDatabase();

  app.listen(port, () => {
    console.log(`🚀 Booking service running on port ${port}`);
  });
}

bootstrap().catch(async (err) => {
  console.error("❌ Failed to start server:", err);
  await prisma.$disconnect();
  process.exit(1);
});
