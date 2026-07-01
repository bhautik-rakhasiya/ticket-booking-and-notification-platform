import { useState, useEffect } from "react";
import { EventItem, BookingResponse } from "../../types";
import { api } from "../../api";

interface BookingModalProps {
  event: EventItem | null;
  onClose: () => void;
  onSuccess: (booking: BookingResponse) => void;
}

const MOCK_USERS = [
  { id: "user-001", name: "Sarah Jenkins" },
  { id: "user-002", name: "David Chen" },
  { id: "user-003", name: "Amara Patel" },
  { id: "user-004", name: "Marcus Johnson" },
  { id: "user-005", name: "Sofia Rodriguez" },
];

export function BookingModal({ event, onClose, onSuccess }: BookingModalProps) {
  if (!event) return null;

  const [userId, setUserId] = useState(MOCK_USERS[0].id);
  const [seatCount, setSeatCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<BookingResponse | null>(null);

  // Auto-cap seat count based on available seats or max limit of 10
  const maxSeats = Math.min(10, event.availableSeats);

  useEffect(() => {
    // Reset state when event changes
    setUserId(MOCK_USERS[0].id);
    setSeatCount(1);
    setError(null);
    setSuccessData(null);
  }, [event]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (seatCount < 1 || seatCount > maxSeats) {
      setError(`Seat count must be between 1 and ${maxSeats}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createBooking(event.id, userId, seatCount);
      setSuccessData(response);
      onSuccess(response);
    } catch (err: any) {
      setError(err.message || "Failed to complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h3>{successData ? "Booking Successful!" : "Book Tickets"}</h3>
            <p>{event.name}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {successData ? (
          <div className="modal-body">
            <div className="success-screen">
              <div className="success-icon">✓</div>
              <h4>Your order is confirmed!</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                We have reserved your seats. Below are your booking details:
              </p>
              
              <div className="receipt">
                <div className="receipt-item">
                  <span className="receipt-label">Booking ID</span>
                  <span className="receipt-value" style={{ fontFamily: "monospace" }}>
                    {successData.bookingId}
                  </span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-label">User ID</span>
                  <span className="receipt-value">{userId}</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-label">Seat Count</span>
                  <span className="receipt-value">{seatCount} ticket(s)</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-label">Ticket Price</span>
                  <span className="receipt-value">{formatCurrency(successData.ticketPrice)}</span>
                </div>
                <div className="receipt-item" style={{ marginTop: "0.5rem" }}>
                  <span className="receipt-label" style={{ fontWeight: 700 }}>Total Paid</span>
                  <span className="receipt-value total">
                    {formatCurrency(successData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div 
                  className="badge badge-sold_out" 
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", textTransform: "none", fontSize: "0.85rem", fontWeight: "normal" }}
                >
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="user-select">Select User Account</label>
                <select
                  id="user-select"
                  className="form-control"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={loading}
                >
                  {MOCK_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="seats-input">Number of Seats (Max {maxSeats})</label>
                <input
                  id="seats-input"
                  type="number"
                  className="form-control"
                  min="1"
                  max={maxSeats}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Math.min(maxSeats, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={loading}
                  required
                />
              </div>

              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>Ticket Price</span>
                  <span>{formatCurrency(event.price)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Quantity</span>
                  <span>x {seatCount}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Estimated Total</span>
                  <span>{formatCurrency(event.price * seatCount)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || event.availableSeats < 1}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookingModal;
