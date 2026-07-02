import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// Seed data with fixed UUIDs (enables idempotent upsert)
// ─────────────────────────────────────────

const SEED_EVENTS = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    name: "Tech Conference 2026",
    description:
      "Annual technology conference featuring keynotes, workshops, and networking sessions for developers and tech leaders.",
    totalSeats: 100,
    price: 1500.00,
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    name: "Rock Concert – The Amplifiers",
    description:
      "An electrifying live rock concert featuring The Amplifiers band with special guest performances.",
    totalSeats: 50,
    price: 999.00,
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    name: "India vs Australia – Cricket Match",
    description:
      "International cricket match between India and Australia at the national stadium. Experience live cricket action!",
    totalSeats: 500,
    price: 750.00,
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    name: "AI & Machine Learning Summit",
    description:
      "A deep-dive conference on the latest trends in AI, deep learning, and generative models. Talks by leading researchers.",
    totalSeats: 200,
    price: 2500.00,
  },
  {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    name: "Stand-Up Comedy Night",
    description:
      "A hilarious evening of stand-up comedy featuring top comedians from across the country.",
    totalSeats: 75,
    price: 499.00,
  },
  {
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    name: "Startup Pitch Day",
    description:
      "Watch early-stage startups pitch their ideas to a panel of seasoned investors. Network with founders and VCs.",
    totalSeats: 150,
    price: 299.00,
  },
  {
    id: "a1b2c3d4-0007-4000-8000-000000000007",
    name: "Classical Music Evening",
    description:
      "An enchanting evening of classical music performed by the National Symphony Orchestra.",
    totalSeats: 120,
    price: 850.00,
  },
  {
    id: "a1b2c3d4-0008-4000-8000-000000000008",
    name: "Blockchain & Web3 Expo",
    description:
      "Explore decentralized finance, NFTs, and Web3 infrastructure in this comprehensive expo event.",
    totalSeats: 300,
    price: 1200.00,
  },
  {
    id: "a1b2c3d4-0009-4000-8000-000000000009",
    name: "Food & Culinary Festival",
    description:
      "A celebration of food culture featuring live cooking demos, celebrity chefs, and cuisine from around the world.",
    totalSeats: 400,
    price: 350.00,
  },
  {
    id: "a1b2c3d4-0010-4000-8000-000000000010",
    name: "Photography Masterclass",
    description:
      "A hands-on masterclass covering portrait, landscape, and street photography techniques led by award-winning photographers.",
    totalSeats: 40,
    price: 1800.00,
  },
];

// ─────────────────────────────────────────
// Exported seed function (called on server start)
// ─────────────────────────────────────────

/**
 * Seeds the database with the 10 predefined events using upsert.
 *
 * - Uses fixed UUIDs so the operation is fully idempotent.
 * - On create: inserts event with availableSeats = totalSeats.
 * - On update: refreshes name, description, price, and totalSeats
 *              WITHOUT touching availableSeats (preserves live booking state).
 * - Safe to call on every server start.
 */
export async function seedDatabase(
  client: PrismaClient = prisma
): Promise<void> {
  logger.info("🌱 [Seed] Running upsert for %d events...", SEED_EVENTS.length);

  // ── Clean up any legacy events not in the fixed-UUID list ───────────
  // This handles leftover rows from earlier seed runs that used random UUIDs.
  const fixedIds = SEED_EVENTS.map((e) => e.id);
  const legacyEvents = await client.event.findMany({
    where: { id: { notIn: fixedIds } },
    select: { id: true },
  });

  if (legacyEvents.length > 0) {
    const legacyIds = legacyEvents.map((e) => e.id);
    const legacyBookings = await client.booking.findMany({
      where: { eventId: { in: legacyIds } },
      select: { id: true },
    });
    const legacyBookingIds = legacyBookings.map((b) => b.id);

    if (legacyBookingIds.length > 0) {
      await client.notification.deleteMany({
        where: { bookingId: { in: legacyBookingIds } },
      });
      await client.booking.deleteMany({
        where: { id: { in: legacyBookingIds } },
      });
    }
    await client.event.deleteMany({ where: { id: { in: legacyIds } } });
    logger.info(`🗑️  [Seed] Removed ${legacyIds.length} legacy event(s).`);
  }

  // ── Upsert canonical events ─────────────────────────────────────────
  let created = 0;
  let updated = 0;

  for (const event of SEED_EVENTS) {
    const existing = await client.event.findUnique({ where: { id: event.id } });

    await client.event.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        name: event.name,
        description: event.description,
        totalSeats: event.totalSeats,
        availableSeats: event.totalSeats, // full availability on first insert
        price: event.price,
        status: "ACTIVE",
      },
      update: {
        name: event.name,
        description: event.description,
        totalSeats: event.totalSeats,
        price: event.price,
        // availableSeats intentionally NOT updated – preserves live booking state
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  logger.info(
    `✅ [Seed] Done — ${created} created, ${updated} updated (total: ${SEED_EVENTS.length} events)`
  );
}

// ─────────────────────────────────────────
// Standalone execution (npm run prisma:seed)
// ─────────────────────────────────────────

if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      logger.error("❌ [Seed] Failed: %o", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
