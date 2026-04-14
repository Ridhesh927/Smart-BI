import { Bell, Search, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TopNav() {
  const { user } = useAuth();
  
  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 w-full">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search dashboards, datasets..." 
          className="w-full bg-slate-800/80 border border-slate-700 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full pl-10 pr-4 py-2.5 text-slate-200 outline-none transition-all"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-100 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-lg">
            {user?.displayName ? user.displayName.charAt(0) : <User size={18} />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user?.displayName || "Demo User"}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
