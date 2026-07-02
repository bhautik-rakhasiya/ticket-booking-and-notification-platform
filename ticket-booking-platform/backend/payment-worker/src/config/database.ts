import { PrismaClient } from "@prisma/client";

// Shared prisma instance can be configured here if Prisma is added, 
// otherwise we export a simple config or mock client.
export const databaseConfig = {
  url: process.env.DATABASE_URL || "postgresql://localhost:5432/ticket_booking",
};

export default databaseConfig;
