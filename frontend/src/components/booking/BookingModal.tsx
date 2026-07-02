import { useState, useEffect, useRef } from "react";
import { EventItem, BookingResponse } from "../../types";
import { api } from "../../api";
import { useUser } from "../../context/UserContext";

interface BookingModalProps {
  event: EventItem | null;
  onClose: () => void;
  onSuccess: (booking: BookingResponse) => void;
}

// ── What the modal is currently showing ─────────────────────────────────────
type ModalState = "form" | "submitted" | "confirmed" | "failed";

const POLL_INTERVAL_MS = 3000;

export function BookingModal({ event, onClose, onSuccess }: BookingModalProps) {
  const { selectedUser } = useUser();

  const [seatCount, setSeatCount]       = useState(1);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [modalState, setModalState]     = useState<ModalState>("form");
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // Ref for the polling interval so we can always clear it reliably
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!event) return null;

  const maxSeats = Math.min(10, event.availableSeats);

  // ── Reset when event changes ─────────────────────────────────────────────
  useEffect(() => {
    setSeatCount(1);
    setError(null);
    setModalState("form");
    setBookingResult(null);
  }, [event?.id]);

  // ── Polling: start when submitted, stop when resolved / modal closed ─────
  useEffect(() => {
    if (modalState !== "submitted" || !bookingResult) return;

    const poll = async () => {
      try {
        const latest = await api.getBookingStatus(bookingResult.bookingId);
        if (latest.status === "CONFIRMED") {
          stopPolling();
          setModalState("confirmed");
        } else if (latest.status === "FAILED") {
          stopPolling();
          setModalState("failed");
        }
        // PENDING → keep polling
      } catch {
        // Network error — swallow, retry on next tick
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll(); // immediate first check

    return stopPolling; // cleanup if component unmounts or state changes
  }, [modalState, bookingResult?.bookingId]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Stop polling if user closes modal
  const handleClose = () => {
    stopPolling();
    onClose();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedUser) return;
    if (seatCount < 1 || seatCount > maxSeats) {
      setError(`Seat count must be between 1 and ${maxSeats}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.createBooking(event.id, selectedUser.id, seatCount);
      setBookingResult(response);
      setModalState("submitted");
      onSuccess(response);
    } catch (err: any) {
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Modal title ───────────────────────────────────────────────────────────
  const titles: Record<ModalState, string> = {
    form:      "Book Tickets",
    submitted: "Booking Submitted 🎉",
    confirmed: "Payment Confirmed ✅",
    failed:    "Payment Failed ❌",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-[bounceIn_0.35s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800">{titles[modalState]}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{event.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── FORM STATE ───────────────────────────────────────── */}
        {modalState === "form" && (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Booking for (read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Booking For
                </label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {selectedUser?.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{selectedUser?.name}</p>
                    <p className="text-xs text-slate-400">{selectedUser?.id}</p>
                  </div>
                </div>
              </div>

              {/* Seat count */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="seats-input">
                  Number of Seats{" "}
                  <span className="text-slate-400 normal-case font-normal">(Max {maxSeats})</span>
                </label>
                <input
                  id="seats-input"
                  type="number"
                  min={1}
                  max={maxSeats}
                  value={seatCount}
                  onChange={(e) =>
                    setSeatCount(Math.min(maxSeats, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  disabled={loading}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Price breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Ticket Price</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(event.price)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Quantity</span>
                  <span className="font-semibold text-slate-700">× {seatCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="font-bold text-slate-800">Estimated Total</span>
                  <span className="font-black text-lg gradient-text">
                    {formatCurrency(event.price * seatCount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="confirm-booking-btn"
                disabled={loading || event.availableSeats < 1}
                className="flex-1 py-3 rounded-xl font-bold text-white gradient-btn shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── SUBMITTED STATE (PENDING — polling in progress) ─── */}
        {modalState === "submitted" && (
          <div className="px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-5">
              <span className="text-3xl">⏳</span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">
              Your booking has been created!
            </h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Payment is being processed. We'll update this screen automatically.
            </p>

            {/* Live processing indicator */}
            <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-700">
                Payment Processing...
              </span>
            </div>

            {bookingResult && <BookingReceipt booking={bookingResult} seatCount={seatCount} formatCurrency={formatCurrency} />}

            <p className="text-xs text-slate-400 mt-4 mb-5">
              🔔 Watch the notification bell for payment status updates
            </p>

            <button onClick={handleClose} className="w-full py-3 rounded-xl font-bold text-white gradient-btn">
              OK, Got it
            </button>
          </div>
        )}

        {/* ── CONFIRMED STATE ───────────────────────────────────── */}
        {modalState === "confirmed" && (
          <div className="px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5 animate-[bounceIn_0.5s_ease-out]">
              <span className="text-3xl">✅</span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Payment Confirmed!</h4>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Your seats have been secured. Enjoy the event!
            </p>

            <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5">
              <span className="text-emerald-600 font-bold text-sm">✓ Booking Confirmed</span>
            </div>

            {bookingResult && <BookingReceipt booking={bookingResult} seatCount={seatCount} formatCurrency={formatCurrency} />}

            <button
              onClick={handleClose}
              className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Done 🎉
            </button>
          </div>
        )}

        {/* ── FAILED STATE ─────────────────────────────────────── */}
        {modalState === "failed" && (
          <div className="px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30 mb-5 animate-[bounceIn_0.5s_ease-out]">
              <span className="text-3xl">❌</span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Payment Failed</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Your payment could not be processed. Your seats have been released — please try again.
            </p>

            <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
              <span className="text-red-600 font-bold text-sm">✕ Payment Declined</span>
            </div>

            {bookingResult && <BookingReceipt booking={bookingResult} seatCount={seatCount} formatCurrency={formatCurrency} />}

            <button
              onClick={handleClose}
              className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 shadow-md shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared receipt block ──────────────────────────────────────────────────────
function BookingReceipt({
  booking,
  seatCount,
  formatCurrency,
}: {
  booking: BookingResponse;
  seatCount: number;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">Booking ID</span>
        <span className="font-mono font-semibold text-slate-700 text-xs">
          {booking.bookingId.slice(0, 16)}…
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Seats</span>
        <span className="font-semibold text-slate-700">
          {seatCount} ticket{seatCount > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
        <span className="font-bold text-slate-700">Amount</span>
        <span className="font-black gradient-text">{formatCurrency(booking.totalAmount)}</span>
      </div>
    </div>
  );
}

export default BookingModal;
