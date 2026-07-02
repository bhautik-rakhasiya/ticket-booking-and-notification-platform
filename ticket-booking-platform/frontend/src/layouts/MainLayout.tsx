import { useState, PropsWithChildren } from "react";
import { useUser } from "../context/UserContext";
import { useNotificationPolling } from "../hooks/useNotificationPolling";
import { NotificationBell } from "../components/NotificationBell";
import { NotificationDrawer } from "../components/NotificationDrawer";

export function MainLayout({ children }: PropsWithChildren) {
  const { selectedUser, clearUser } = useUser();
  const notificationCount = useNotificationPolling(selectedUser?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-b border-white/10 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/30">
              <span className="text-white font-black text-base">T</span>
            </div>
            <span className="text-xl font-black text-white tracking-tight">TicketEase</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {selectedUser && (
              <>
                {/* Auto-update hint */}
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-updating every 5s
                </span>

                {/* Greeting */}
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {selectedUser.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white hidden sm:block">
                    Hello, {selectedUser.name.split(" ")[0]} 👋
                  </span>
                </div>

                {/* Notification Bell */}
                <NotificationBell
                  count={notificationCount}
                  onClick={() => setDrawerOpen(true)}
                />

                {/* Switch user */}
                <button
                  id="switch-user-btn"
                  onClick={clearUser}
                  title="Switch user"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200 text-xs font-medium"
                >
                  Switch
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs text-slate-400">© 2026 TicketEase Inc. All rights reserved.</span>
        </div>
      </footer>

      {/* ── Notification Drawer ─────────────────────────────── */}
      {drawerOpen && selectedUser && (
        <NotificationDrawer
          userId={selectedUser.id}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

export default MainLayout;
