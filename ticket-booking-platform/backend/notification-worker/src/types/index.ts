// ─────────────────────────────────────────
// Incoming event payloads (from Payment Worker)
// ─────────────────────────────────────────

export interface BookingStatusEvent {
  eventType: string;
  bookingId: string;
  eventId: string;
  userId: string;
  status: "CONFIRMED" | "FAILED";
  reason?: string;
  processedAt: string;
}

// ─────────────────────────────────────────
// Internal notification create input
// ─────────────────────────────────────────

export interface CreateNotificationInput {
  bookingId: string;
  type: "SUCCESS" | "FAILURE";
  message: string;
}
