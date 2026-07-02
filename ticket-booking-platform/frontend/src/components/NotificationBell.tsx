interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      id="notification-bell"
      onClick={onClick}
      className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label={`Notifications (${count})`}
    >
      {/* Bell SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 37.756 37.756 0 01-4.496 0z"
          clipRule="evenodd"
        />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-lg animate-bounce">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
