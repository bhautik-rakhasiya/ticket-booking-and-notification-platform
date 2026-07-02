// ─────────────────────────────────────────
// Incoming Event Payload (from booking.created.queue)
// ─────────────────────────────────────────

export interface BookingCreatedEvent {
  eventType: string;
  bookingId: string;
  eventId: string;
  userId: string;
  seatCount: number;
  ticketPrice: number;
  totalAmount: number;
  createdAt: string;
}

// ─────────────────────────────────────────
// Outgoing Event Payloads
// ─────────────────────────────────────────

export interface BookingConfirmedEvent {
  eventType: string;
  bookingId: string;
  userId: string;
  eventId: string;
  status: "CONFIRMED";
  processedAt: string;
}

export interface BookingFailedEvent {
  eventType: string;
  bookingId: string;
  userId: string;
  eventId: string;
  status: "FAILED";
  reason: string;
  processedAt: string;
}

// ─────────────────────────────────────────
// Payment Result
// ─────────────────────────────────────────

export interface PaymentResult {
  success: boolean;
  reason?: string;
}
