import { EventItem } from "../../types";

interface EventCardProps {
  event: EventItem;
  onBookClick: (event: EventItem) => void;
}

export function EventCard({ event, onBookClick }: EventCardProps) {
  const { name, description, totalSeats, availableSeats, price, status } = event;
  const isAvailable = status === "ACTIVE" && availableSeats > 0;
  const bookedPct = Math.min(100, Math.max(0, ((totalSeats - availableSeats) / totalSeats) * 100));

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

  const statusColors: Record<string, string> = {
    ACTIVE:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    SOLD_OUT:  "bg-red-100 text-red-600 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isAvailable ? "bg-gradient-to-r from-violet-500 to-pink-500" : "bg-slate-200"}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-violet-700 transition-colors">
            {name}
          </h3>
          <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColors[status] ?? statusColors.ACTIVE}`}>
            {status.replace("_", " ")}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
          {description || "No description provided."}
        </p>

        {/* Seats bar */}
        <div className="mt-4 mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Seats available</span>
            <span className="font-bold text-slate-700">{availableSeats} / {totalSeats}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-fill transition-all duration-500"
              style={{ width: `${bookedPct}%` }}
            />
          </div>
        </div>

        {/* Price + button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price / ticket</p>
            <p className="text-xl font-black gradient-text">{formattedPrice}</p>
          </div>
          <button
            id={`book-btn-${event.id}`}
            onClick={() => onBookClick(event)}
            disabled={!isAvailable}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {status === "SOLD_OUT" ? "Sold Out" : status === "CANCELLED" ? "Unavailable" : "Book Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
