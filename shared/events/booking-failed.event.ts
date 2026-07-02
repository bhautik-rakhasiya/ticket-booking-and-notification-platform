export interface BookingFailedEvent {
  eventType: string;
  bookingId: string;
  eventId: string;
  userId: string;
  status: "FAILED";
  reason: string;
  processedAt: string;
}
