// ─────────────────────────────────────────
// Booking Types
// ─────────────────────────────────────────

export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface CreateBookingInput {
  eventId: string;
  userId: string;
  seatCount: number;
  idempotencyKey?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: BookingStatus;
  eventId: string;
  seatCount: number;
  userId: string;
  ticketPrice: number;
  totalAmount: number;
}

// ─────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────

export type EventStatus = "ACTIVE" | "SOLD_OUT" | "CANCELLED";

export interface EventResponse {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: EventStatus;
}

// ─────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
