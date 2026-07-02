import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { User } from "../types";

export function UserSelectionPage() {
  const { setSelectedUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then((data) => {
      setUsers(data);
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const handleContinue = () => {
    const user = users.find((u) => u.id === selectedId);
    if (user) setSelectedUser(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-[bounceIn_0.4s_ease-out]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <span className="text-3xl font-black text-white tracking-tight">TicketEase</span>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back! 👋</h1>
            <p className="text-slate-300 text-sm">Select your account to continue booking tickets</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Choose Account
              </label>
              <div className="relative">
                <select
                  id="user-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full appearance-none bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer transition-all"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-800 text-white">
                      {u.name} ({u.id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  ▾
                </div>
              </div>

              <button
                id="continue-btn"
                onClick={handleContinue}
                disabled={!selectedId}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm tracking-wide gradient-btn shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Continue →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          No authentication required — select any account to explore
        </p>
      </div>
    </div>
  );
}

export default UserSelectionPage;
