import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Database, Settings, LogOut, BarChart3, ChevronRight, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const navItems = [
    { to: "/home", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/datasets", icon: <Database size={18} />, label: "Datasets" },
    { to: "/studio/new", icon: <BarChart3 size={18} />, label: "New Studio" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="p-5 flex items-center gap-3 relative z-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-pulse-glow">
          <BarChart3 size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          SmartDash
        </span>
      </div>

      {/* Section Label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                )}
                <span className={isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300 transition-colors"}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-blue-400/60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-800/60 mb-3" />

      {/* Bottom Section */}
      <div className="p-3 space-y-1">
        {/* Settings button - now navigates to /home with a toast concept */}
        <button
          onClick={() => setShowSettingsMenu(prev => !prev)}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200 text-sm group"
        >
          <Settings size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors group-hover:rotate-45 duration-300" />
          Settings
          <ChevronRight size={14} className={`ml-auto transition-transform duration-200 ${showSettingsMenu ? 'rotate-90' : ''}`} />
        </button>

        {/* Collapsible settings menu */}
        {showSettingsMenu && (
          <div className="ml-4 space-y-1 animate-fade-in">
            {[
              { label: "Profile", action: () => {} },
              { label: "Preferences", action: () => {} },
              { label: "API Keys", action: () => {} },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full text-left text-xs text-slate-500 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 text-sm group"
        >
          <LogOut size={18} className="text-slate-500 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>

      {/* User Card */}
      <div className="p-3 pt-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.displayName || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
