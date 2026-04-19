import { NavLink } from "react-router-dom";
import { LayoutDashboard, Database, Settings, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const navItems = [
    { to: "/home", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/datasets", icon: <Database size={20} />, label: "Datasets" },
    { to: "/studio/new", icon: <BarChart3 size={20} />, label: "Studio" },
  ];

  return (
    <div className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] h-screen flex flex-col theme-transition">
      <div className="p-6 flex items-center gap-3 text-xl font-bold">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-[var(--bg-main)] shadow-lg shadow-[var(--primary)]/30">
          <BarChart3 size={18} strokeWidth={3} />
        </div>
        <span className="text-[var(--text-main)] font-extrabold tracking-tight">Smart Dash</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)] space-y-4">
          {/* Theme Switcher */}
          <div className="px-4 py-2 flex items-center justify-between bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border)]/50">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Theme</span>
            <div className="flex gap-2">
              {[
                { id: 'night', color: 'bg-slate-700', border: 'border-slate-500' },
                { id: 'emerald', color: 'bg-emerald-500', border: 'border-emerald-400' },
                { id: 'sunset', color: 'bg-[#ffa48e]', border: 'border-[#ff9278]' },
                { id: 'oceanic', color: 'bg-cyan-500', border: 'border-cyan-400' },
                { id: 'snow', color: 'bg-white', border: 'border-slate-200' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-4 h-4 rounded-full border-2 ${t.color} ${t.border} transition-all transform hover:scale-125 ${theme === t.id ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)]' : 'opacity-60'}`}
                  title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                />
              ))}
            </div>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" 
                  : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]"
              }`
            }
          >
            <Settings size={20} />
            Settings
          </NavLink>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-1"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
