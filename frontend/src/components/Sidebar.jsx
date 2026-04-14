import { NavLink } from "react-router-dom";
import { LayoutDashboard, Database, Settings, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  
  const navItems = [
    { to: "/home", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/datasets", icon: <Database size={20} />, label: "Datasets" },
    { to: "/studio/new", icon: <BarChart3 size={20} />, label: "Studio" },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <BarChart3 size={18} strokeWidth={3} />
        </div>
        AutoBI
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-blue-600/10 text-blue-400 font-medium" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200">
          <Settings size={20} />
          Settings
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-1"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
