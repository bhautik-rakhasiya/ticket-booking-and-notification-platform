import { useState, useEffect } from "react";
import { api } from "../api";
import { NotificationItem } from "../types";

interface NotificationDrawerProps {
  userId: string;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationDrawer({ userId, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications(userId).then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [userId]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-[slideIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-700">
          <div>
            <h2 className="text-lg font-bold text-white">Notifications</h2>
            <p className="text-violet-200 text-xs mt-0.5">Latest 10 updates</p>
          </div>
          <button
            id="close-notifications"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">🔔</div>
              <h3 className="font-semibold text-slate-700">No notifications yet</h3>
              <p className="text-sm text-slate-400">Book a ticket and you'll see payment updates here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((notif) => {
                const isSuccess = notif.type === "SUCCESS";
                return (
                  <li
                    key={notif.id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${
                        isSuccess
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-500"
                      }`}>
                        {isSuccess ? "✅" : "❌"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold uppercase tracking-wide ${
                            isSuccess ? "text-emerald-600" : "text-red-500"
                          }`}>
                            {isSuccess ? "Booking Confirmed" : "Booking Failed"}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {notif.booking?.event?.name ?? "Unknown Event"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {notif.message ?? (isSuccess
                            ? "Your booking has been confirmed."
                            : "Payment could not be processed."
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            Auto-updating every 5 seconds
          </p>
        </div>
      </div>
    </>
  );
}

export default NotificationDrawer;
