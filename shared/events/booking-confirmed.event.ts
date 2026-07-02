export interface BookingConfirmedEvent {
  eventType: string;
  bookingId: string;
  eventId: string;
  userId: string;
  status: "CONFIRMED";
  processedAt: string;
}
