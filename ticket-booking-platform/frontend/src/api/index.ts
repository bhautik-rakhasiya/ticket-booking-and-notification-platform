import { EventItem, BookingResponse } from "../types";

export const api = {
  /**
   * Fetches all active events from the backend.
   * Utilizes the Vite proxy settings to call /api/events.
   */
  async getEvents(): Promise<EventItem[]> {
    const res = await fetch("/api/events");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch events");
    }
    return res.json();
  },

  /**
   * Submits a booking creation request.
   * Note: idempotencyKey is generated on the backend if omitted.
   */
  async createBooking(
    eventId: string,
    userId: string,
    seatCount: number
  ): Promise<BookingResponse> {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, userId, seatCount }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to create booking");
    }

    return data;
  },
};
