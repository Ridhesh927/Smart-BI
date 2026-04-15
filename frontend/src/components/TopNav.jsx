import { Bell, Search, User, X, Clock, BarChart3, Database, CheckCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const mockNotifications = [
  { id: 1, type: "success", icon: <BarChart3 size={14} className="text-blue-400" />, title: "Dashboard saved", desc: "Q3 Sales Analytics saved successfully.", time: "2 min ago", read: false },
  { id: 2, type: "info", icon: <Database size={14} className="text-purple-400" />, title: "Dataset processed", desc: "sales_data.csv is ready to visualize.", time: "15 min ago", read: false },
  { id: 3, type: "success", icon: <CheckCheck size={14} className="text-emerald-400" />, title: "Cleaning complete", desc: "3 duplicate rows removed automatically.", time: "1 hr ago", read: true },
  { id: 4, type: "info", icon: <Clock size={14} className="text-amber-400" />, title: "Weekly report ready", desc: "Your scheduled report is available.", time: "3 hrs ago", read: true },
];

export default function TopNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifsRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (searchQuery.toLowerCase().includes("dataset")) navigate("/datasets");
      else if (searchQuery.toLowerCase().includes("studio")) navigate("/studio/new");
      else navigate("/home");
      setSearchQuery("");
    }
  };

  const markAllRead = () => {
    setNotifications(n => n.map(notif => ({ ...notif, read: true })));
  };

  return (
    <header className="h-18 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 w-full" style={{ height: '72px' }}>
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Search dashboards, datasets... (Enter)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full bg-slate-800/70 border border-slate-700/60 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 rounded-full pl-9 pr-8 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-slate-900" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
              </>
            )}
          </button>

          {showNotifs && (
            <div className="dropdown-menu right-0 top-12 w-80">
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="badge badge-blue">{unreadCount} new</span>
                  )}
                  <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Mark all read
                  </button>
                </div>
              </div>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    className={`dropdown-item flex-col items-start gap-0.5 cursor-pointer rounded-lg ${!n.read ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span>{n.icon}</span>
                      <span className={`text-xs font-semibold flex-1 ${!n.read ? 'text-white' : 'text-slate-300'}`}>{n.title}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5">{n.desc}</p>
                    <p className="text-[10px] text-slate-600 pl-5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-200">{user?.displayName || "User"}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
