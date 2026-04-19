import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden text-[var(--text-main)] font-sans theme-transition">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth slim-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
