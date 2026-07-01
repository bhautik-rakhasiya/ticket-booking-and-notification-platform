import { EventItem } from "../../types";

interface EventCardProps {
  event: EventItem;
  onBookClick: (event: EventItem) => void;
}

export function EventCard({ event, onBookClick }: EventCardProps) {
  const { name, description, totalSeats, availableSeats, price, status } = event;
  const isAvailable = status === "ACTIVE" && availableSeats > 0;
  
  // Calculate percentage of seats filled
  const seatsBooked = totalSeats - availableSeats;
  const bookedPercentage = Math.min(100, Math.max(0, (seatsBooked / totalSeats) * 100));

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{name}</h3>
        <span className={`badge badge-${status.toLowerCase()}`}>
          {status.replace("_", " ")}
        </span>
      </div>
      
      <p className="card-desc" title={description || ""}>
        {description || "No description provided."}
      </p>

      <div className="card-seats-bar">
        <div className="seats-label">
          <span>Seats availability</span>
          <strong>
            {availableSeats} / {totalSeats} left
          </strong>
        </div>
        <div className="progress-track">
          <div 
            className="progress-bar" 
            style={{ width: `${bookedPercentage}%` }}
          />
        </div>
      </div>

      <div className="card-price-row">
        <div>
          <div className="price-label">Price per ticket</div>
          <div className="price-val">{formattedPrice}</div>
        </div>
        <button 
          className="btn btn-primary"
          style={{ width: "auto", minWidth: "120px" }}
          onClick={() => onBookClick(event)}
          disabled={!isAvailable}
        >
          {status === "SOLD_OUT" ? "Sold Out" : status === "CANCELLED" ? "Unavailable" : "Book Ticket"}
        </button>
      </div>
    </div>
  );
}

export default EventCard;
