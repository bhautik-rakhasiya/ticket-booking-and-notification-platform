import "dotenv/config";
import { connectRabbitMQ } from "../messaging/connection";
import { publishMessage } from "../messaging/publisher";
import { bookingRepository } from "../repositories/booking.repository";
import { redisRepository } from "../repositories/redis.repository";
import { paymentService } from "../services/payment.service";
import { QUEUES } from "../../../../shared/messaging/queues";
import { ROUTING_KEYS } from "../../../../shared/messaging/routingKeys";
import {
  BookingCreatedEvent,
  BookingConfirmedEvent,
  BookingFailedEvent,
} from "../types";
import logger from "../utils/logger";
import type { ConsumeMessage } from "amqplib";

/**
 * Validates that a raw message has all required fields.
 * Returns the typed event or null if invalid.
 */
function parseAndValidate(raw: unknown): BookingCreatedEvent | null {
  if (!raw || typeof raw !== "object") return null;

  const msg = raw as Record<string, unknown>;

  if (
    typeof msg.bookingId !== "string" ||
    typeof msg.eventId !== "string" ||
    typeof msg.userId !== "string" ||
    typeof msg.seatCount !== "number" ||
    typeof msg.totalAmount !== "number"
  ) {
    return null;
  }

  return raw as BookingCreatedEvent;
}

/**
 * Processes a single booking.created message:
 *
 * 1. Parse & validate payload
 * 2. Load booking from DB (idempotency: skip if not PENDING)
 * 3. Simulate payment via paymentService
 * 4. On success: confirm booking → publish booking.confirmed
 * 5. On failure: fail booking + release seats → publish booking.failed
 * 6. ACK message
 *
 * On any retryable error: NACK (requeue=true)
 * On invalid message: ACK (discard — no retry makes sense)
 */
async function processBookingCreated(
  rawMsg: ConsumeMessage,
  channel: import("amqplib").Channel
): Promise<void> {
  const startTime = Date.now();
  let parsed: BookingCreatedEvent | null = null;

  // ── 1. Parse & validate ─────────────────────────────────────────────
  try {
    const body = JSON.parse(rawMsg.content.toString());
    parsed = parseAndValidate(body);
  } catch {
    logger.error("[consumer] Failed to parse message — discarding (ACK).");
    channel.ack(rawMsg);
    return;
  }

  if (!parsed) {
    logger.error("[consumer] Invalid message payload — discarding (ACK).", {
      content: rawMsg.content.toString(),
    });
    channel.ack(rawMsg);
    return;
  }

  const { bookingId, eventId, userId, seatCount, totalAmount } = parsed;
  logger.info(`[consumer] 📥 Received booking.created`, { bookingId, eventId });

  // ── 2. Idempotency check: load booking ───────────────────────────────
  let booking;
  try {
    booking = await bookingRepository.findById(bookingId);
  } catch (err) {
    logger.error(`[consumer] DB error loading booking=${bookingId}: %o`, err);
    channel.nack(rawMsg, false, true);
    return;
  }

  if (!booking) {
    logger.warn(`[consumer] Booking ${bookingId} not found in DB — discarding (ACK).`);
    channel.ack(rawMsg);
    return;
  }

  if (booking.status !== "PENDING") {
    logger.info(
      `[consumer] Booking ${bookingId} already processed (status=${booking.status}) — skipping (ACK).`
    );
    channel.ack(rawMsg);
    return;
  }

  logger.info(`[consumer] 📋 Booking loaded`, { bookingId, status: booking.status });

  // ── 3. Simulate payment ──────────────────────────────────────────────
  let paymentResult;
  try {
    logger.info(`[consumer] 💳 Payment started`, { bookingId, totalAmount });
    paymentResult = await paymentService.processPayment(bookingId, totalAmount);
  } catch (err) {
    logger.error(`[consumer] Payment simulation threw an error for booking=${bookingId}: %o`, err);
    channel.nack(rawMsg, false, true);
    return;
  }

  const redisKey = `idemp:${userId}:${eventId}:${seatCount}`;

  // ── 4. Payment SUCCESS path ──────────────────────────────────────────
  if (paymentResult.success) {
    try {
      const confirmed = await bookingRepository.confirmBooking(bookingId);

      if (!confirmed) {
        // Was already processed by a concurrent worker — safe ACK
        logger.info(`[consumer] Booking ${bookingId} already confirmed (race) — ACK.`);
        channel.ack(rawMsg);
        return;
      }

      logger.info(`[consumer] ✅ Booking CONFIRMED`, { bookingId });

      // Clean up Redis Idempotency Key
      try {
        await redisRepository.delete(redisKey);
        logger.info(`[consumer] Redis idempotency key deleted: ${redisKey}`);
      } catch (redisErr) {
        logger.error(`[consumer] Redis DEL failed for key=${redisKey}:`, redisErr);
      }

      // Publish booking.confirmed
      const confirmedPayload: BookingConfirmedEvent = {
        eventType: ROUTING_KEYS.BOOKING_CONFIRMED,
        bookingId,
        userId,
        eventId,
        status: "CONFIRMED",
        processedAt: new Date().toISOString(),
      };

      await publishMessage(ROUTING_KEYS.BOOKING_CONFIRMED, confirmedPayload);
      logger.info(`[consumer] 📤 Published booking.confirmed`, { bookingId });

      channel.ack(rawMsg);
      logger.info(`[consumer] ✔ ACK sent`, {
        bookingId,
        durationMs: Date.now() - startTime,
      });
    } catch (err) {
      logger.error(`[consumer] Error in success path for booking=${bookingId}: %o`, err);
      channel.nack(rawMsg, false, true);
    }
    return;
  }

  // ── 5. Payment FAILURE path ──────────────────────────────────────────
  const failReason = paymentResult.reason ?? "Payment failed";
  try {
    const released = await bookingRepository.failBookingAndReleaseSeats(
      bookingId,
      eventId,
      seatCount,
      failReason
    );

    if (!released) {
      logger.info(`[consumer] Booking ${bookingId} already failed (race) — ACK.`);
      channel.ack(rawMsg);
      return;
    }

    logger.info(`[consumer] ❌ Booking FAILED + seats released`, {
      bookingId,
      seatCount,
      reason: failReason,
    });

    // Clean up Redis Idempotency Key
    try {
      await redisRepository.delete(redisKey);
      logger.info(`[consumer] Redis idempotency key deleted: ${redisKey}`);
    } catch (redisErr) {
      logger.error(`[consumer] Redis DEL failed for key=${redisKey}:`, redisErr);
    }

    // Publish booking.failed
    const failedPayload: BookingFailedEvent = {
      eventType: ROUTING_KEYS.BOOKING_FAILED,
      bookingId,
      userId,
      eventId,
      status: "FAILED",
      reason: failReason,
      processedAt: new Date().toISOString(),
    };

    await publishMessage(ROUTING_KEYS.BOOKING_FAILED, failedPayload);
    logger.info(`[consumer] 📤 Published booking.failed`, { bookingId });

    channel.ack(rawMsg);
    logger.info(`[consumer] ✔ ACK sent`, {
      bookingId,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    logger.error(`[consumer] Error in failure path for booking=${bookingId}: %o`, err);
    channel.nack(rawMsg, false, true);
  }
}

/**
 * Starts the booking.created consumer.
 * Call once during worker startup — runs indefinitely.
 */
export async function startBookingCreatedConsumer(): Promise<void> {
  const { channel } = await connectRabbitMQ();

  logger.info(`[consumer] 🎧 Listening on queue: ${QUEUES.BOOKING_CREATED}`);

  await channel.consume(
    QUEUES.BOOKING_CREATED,
    async (msg) => {
      if (!msg) {
        // Consumer cancelled by RabbitMQ
        logger.warn("[consumer] Consumer cancelled by broker.");
        return;
      }
      await processBookingCreated(msg, channel);
    },
    { noAck: false } // manual acknowledgement
  );
}

export default startBookingCreatedConsumer;
