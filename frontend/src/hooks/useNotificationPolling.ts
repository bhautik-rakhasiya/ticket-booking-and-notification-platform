import { useEffect, useRef, useState } from "react";
import { api } from "../api";

/**
 * Polls GET /api/notifications/count every `intervalMs` milliseconds.
 * Stops automatically on unmount.
 */
export function useNotificationPolling(
  userId: string | null,
  intervalMs = 5000
) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = async () => {
    if (!userId) return;
    try {
      const c = await api.getNotificationCount(userId);
      setCount(c);
    } catch {
      // Swallow — keep previous count, retry on next interval
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Immediate fetch on mount
    fetchCount();

    intervalRef.current = setInterval(fetchCount, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, intervalMs]);

  return count;
}

export default useNotificationPolling;
