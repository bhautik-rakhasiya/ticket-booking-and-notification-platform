export interface CreateBookingDto {
  eventId: string;
  userId: string;
  seatCount: number;
  idempotencyKey?: string;
}

export interface BookingResponseDto {
  bookingId: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  ticketPrice: number;
  totalAmount: number;
  eventId?: string;
  userId?: string;
  seatCount?: number;
}
