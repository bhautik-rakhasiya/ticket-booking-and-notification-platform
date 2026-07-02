export interface BookingFailedEvent {
  bookingId: string;
  eventId: string;
  userId: string;
  seatCount: number;
  failureReason: string;
  failedAt: string;
}
