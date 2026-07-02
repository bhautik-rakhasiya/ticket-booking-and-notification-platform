export interface CreateBookingDto {
  eventId: string;
  userId: string;
  seatCount: number;
}

export interface BookingResponseDto {
  bookingId: string;
  status: string;
  ticketPrice: number;
  totalAmount: number;
  eventId?: string;
  userId?: string;
  seatCount?: number;
}
