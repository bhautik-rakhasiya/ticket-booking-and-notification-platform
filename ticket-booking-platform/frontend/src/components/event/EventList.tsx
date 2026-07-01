import { useState, useEffect } from "react";
import { EventItem, BookingResponse } from "../../types";
import { api } from "../../api";
import EventCard from "./EventCard";
import BookingModal from "../booking/BookingModal";

export function EventList() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch events from API
  const fetchEvents = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Display toast alerts
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleBookClick = (event: EventItem) => {
    setSelectedEvent(event);
  };

  const handleBookingSuccess = (booking: BookingResponse) => {
    showToast(`Successfully booked tickets! Total amount: INR ${booking.totalAmount}`, "success");
    // Refresh the list of events in the background to update available seats
    fetchEvents(false);
  };

  return (
    <section className="events-section">
      <div className="section-title">
        <h2>Explore Events</h2>
        <button 
          className="btn btn-secondary" 
          style={{ width: "auto" }}
          onClick={() => fetchEvents(true)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner spinner-primary" />
          <p className="loader-text">Loading premium events...</p>
        </div>
      ) : error ? (
        <div className="empty-state" style={{ borderColor: "var(--color-danger)" }}>
          <p style={{ color: "var(--color-danger)", fontWeight: 600 }}>{error}</p>
          <button 
            className="btn btn-primary" 
            style={{ width: "auto", marginTop: "1rem" }}
            onClick={() => fetchEvents(true)}
          >
            Retry Connection
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>No active events available at this time.</p>
        </div>
      ) : (
        <div className="grid">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onBookClick={handleBookClick} 
            />
          ))}
        </div>
      )}

      {/* Booking Form Popup Modal */}
      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Toast Notification Alert */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.message}
        </div>
      )}
    </section>
  );
}

export default EventList;
