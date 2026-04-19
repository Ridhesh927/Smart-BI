import { Bell, Search, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TopNav() {
  const { user } = useAuth();
  
  return (
    <header className="h-20 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 w-full theme-transition">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
        <input 
          type="text" 
          placeholder="Search dashboards, datasets..." 
          className="w-full bg-[var(--bg-main)]/80 border border-[var(--border)] text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] rounded-full pl-10 pr-4 py-2.5 text-[var(--text-main)] outline-none transition-all"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-[var(--bg-sidebar)]"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-[var(--border)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--bg-main)] font-medium shadow-lg">
            {user?.displayName ? user.displayName.charAt(0) : <User size={18} />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[var(--text-main)]">{user?.displayName || "Demo User"}</p>
            <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
