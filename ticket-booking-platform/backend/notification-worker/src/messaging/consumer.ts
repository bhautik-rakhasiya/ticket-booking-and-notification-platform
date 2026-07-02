import "dotenv/config";
import type { ConsumeMessage } from "amqplib";
import { getChannel } from "../messaging/connection";
import { notificationService } from "../services/notification.service";
import { retryService } from "../services/retry.service";
import { dlqService } from "../services/dlq.service";
import { BookingStatusEvent } from "../types";
import logger from "../utils/logger";

/**
 * Validates that raw JSON has the required fields for a BookingStatusEvent.
 */
function parseAndValidate(raw: unknown): BookingStatusEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const msg = raw as Record<string, unknown>;

  if (
    typeof msg.bookingId !== "string" ||
    typeof msg.eventId   !== "string" ||
    typeof msg.userId    !== "string" ||
    (msg.status !== "CONFIRMED" && msg.status !== "FAILED")
  ) {
    return null;
  }
  return raw as BookingStatusEvent;
}

/**
 * Detects errors that will NEVER succeed on retry — these should be
 * ACKed and discarded immediately rather than sent to the retry queue.
 *
 * Prisma error codes:
 *  P2003 — Foreign key constraint violated (bookingId doesn't exist in bookings table)
 *  P2025 — Record not found
 */
function isNonRetryableError(err: any): boolean {
  const code = err?.code ?? "";
  if (code === "P2003" || code === "P2025") return true;
  // Fallback: catch raw DB foreign key messages
  const msg = String(err?.message ?? "");
  return msg.toLowerCase().includes("foreign key constraint");
}

/**
 * Generic notification message processor.
 *
 * Flow:
 *  1. Parse & validate payload — invalid → ACK and discard
 *  2. Delegate to notificationService.createNotification()
 *     - duplicate → ACK silently
 *     - success   → ACK
 *  3. On non-retryable error (e.g. stale bookingId): ACK + discard
 *  4. On retryable error:
 *     - retries remaining → retry queue
 *     - retries exhausted → DLQ
 */
export async function processNotificationEvent(
  rawMsg: ConsumeMessage,
  queueLabel: string
): Promise<void> {
  const channel   = getChannel();
  const startTime = Date.now();

  // ── 1. Parse & validate ──────────────────────────────────────────────
  let event: BookingStatusEvent | null = null;
  try {
    const body = JSON.parse(rawMsg.content.toString());
    event = parseAndValidate(body);
  } catch {
    logger.error(`[${queueLabel}] ❌ Failed to parse message — discarding (ACK).`);
    channel.ack(rawMsg);
    return;
  }

  if (!event) {
    logger.error(`[${queueLabel}] ❌ Invalid payload — discarding (ACK).`, {
      content: rawMsg.content.toString(),
    });
    channel.ack(rawMsg);
    return;
  }

  logger.info(`[${queueLabel}] 📥 Received event`, {
    bookingId: event.bookingId,
    status:    event.status,
  });

  // ── 2. Process notification ──────────────────────────────────────────
  try {
    const result = await notificationService.createNotification(event);

    if (result === null) {
      // Duplicate — already exists, safe to ACK
      logger.info(`[${queueLabel}] ⚠️  Duplicate notification — ACK.`, {
        bookingId: event.bookingId,
      });
    } else {
      logger.info(`[${queueLabel}] ✅ Notification stored`, {
        bookingId:      event.bookingId,
        notificationId: result.id,
        durationMs:     Date.now() - startTime,
      });
    }

    channel.ack(rawMsg);
    logger.info(`[${queueLabel}] ✔ ACK sent`, { bookingId: event.bookingId });

  } catch (err: any) {
    const errorMsg   = err?.message ?? String(err);
    const retryCount = retryService.getRetryCount(rawMsg);

    // ── Non-retryable: discard immediately (e.g. stale/orphaned bookingId) ──
    if (isNonRetryableError(err)) {
      logger.warn(
        `[${queueLabel}] ⚠️  Non-retryable error for booking=${event.bookingId} — discarding (ACK).`,
        { prismaCode: err?.code, error: errorMsg.split("\n")[0] }
      );
      channel.ack(rawMsg);
      return;
    }

    // ── Retryable error (DB down, network issue, etc.) ─────────────────
    logger.error(`[${queueLabel}] ❌ Processing error (retry=${retryCount}): ${errorMsg.split("\n")[0]}`);

    if (retryService.hasExceededMaxRetries(rawMsg)) {
      dlqService.moveToDlq(rawMsg, retryCount, errorMsg.split("\n")[0]);
    } else {
      retryService.schedule(rawMsg, retryCount);
    }
  }
}
