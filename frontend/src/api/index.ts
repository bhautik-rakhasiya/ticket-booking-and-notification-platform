import { EventItem, BookingResponse, User, NotificationItem } from "../types";

export const api = {
  async getEvents(): Promise<EventItem[]> {
    const res = await fetch("/api/events");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch events");
    }
    return res.json();
  },

  async createBooking(
    eventId: string,
    userId: string,
    seatCount: number
  ): Promise<BookingResponse> {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, userId, seatCount }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to create booking");
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  async getNotificationCount(userId: string): Promise<number> {
    const res = await fetch(`/api/notifications/count?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  },

  async getNotifications(userId: string, limit = 10): Promise<NotificationItem[]> {
    const res = await fetch(
      `/api/notifications?userId=${encodeURIComponent(userId)}&limit=${limit}`
    );
    if (!res.ok) return [];
    return res.json();
  },

  async getBookingStatus(bookingId: string): Promise<BookingResponse> {
    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
    if (!res.ok) throw new Error("Failed to fetch booking status");
    return res.json();
  },
};
