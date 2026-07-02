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
