export interface BookingConfirmedEvent {
  bookingId: string;
  eventId: string;
  userId: string;
  seatCount: number;
  confirmedAt: string;
}
