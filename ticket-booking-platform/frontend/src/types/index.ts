export interface EventItem {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: "ACTIVE" | "SOLD_OUT" | "CANCELLED";
}

export interface BookingResponse {
  bookingId: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  ticketPrice: number;
  totalAmount: number;
  eventId?: string;
  userId?: string;
  seatCount?: number;
}
