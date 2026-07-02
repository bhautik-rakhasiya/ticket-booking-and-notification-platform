import { useState, useEffect } from "react";
import { EventItem, BookingResponse } from "../../types";
import { api } from "../../api";
import EventCard from "./EventCard";
import BookingModal from "../booking/BookingModal";
import { useUser } from "../../context/UserContext";

export function EventList() {
  const { selectedUser } = useUser();
  const [events, setEvents]               = useState<EventItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [toast, setToast]                 = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchEvents = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      setEvents(await api.getEvents());
    } catch (err: any) {
      setError(err.message || "Failed to load events. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleBookingSuccess = (booking: BookingResponse) => {
    fetchEvents(false);
  };

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
            Explore <span className="gradient-text">Events</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {events.length > 0 ? `${events.length} events available` : "Find your next experience"}
          </p>
        </div>
        <button
          id="refresh-events"
          onClick={() => fetchEvents(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all duration-200 disabled:opacity-50 shadow-sm"
        >
          <span className={loading ? "animate-spin" : ""}>↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading events...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => fetchEvents(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white gradient-btn"
          >
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="text-4xl">🎟️</div>
          <p className="text-slate-500 font-medium">No active events available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onBookClick={setSelectedEvent} />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold text-white animate-[bounceIn_0.4s_ease-out] max-w-sm text-center ${
          toast.type === "success"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30"
            : "bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/30"
        }`}>
          <span>{toast.type === "success" ? "🎉" : "⚠️"}</span>
          {toast.message}
        </div>
      )}
    </section>
  );
}

export default EventList;
