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

export interface User {
  id: string;
  name: string;
}

export interface NotificationItem {
  id: string;
  type: "SUCCESS" | "FAILURE";
  status: string;
  message: string | null;
  createdAt: string;
  booking: {
    id: string;
    userId: string;
    seatCount: number;
    event: {
      id: string;
      name: string;
    };
  };
}
