import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { BarChart3, Database, Users, Plus, MoreVertical, TrendingUp, Clock, FileWarning, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RenameModal, DeleteModal } from "../components/Modals/DashboardModals";

export default function Home() {
  const { user } = useAuth();
  
  const [dashboards, setDashboards] = useState([]);
  const [datasetsCount, setDatasetsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const dashRes = await fetch(`${import.meta.env.VITE_API_URL}/dashboards`, { headers });
      const dashData = dashRes.ok ? await dashRes.json() : [];
      setDashboards(dashData);

      const dataRes = await fetch(`${import.meta.env.VITE_API_URL}/datasets`, { headers });
      const datasetData = dataRes.ok ? await dataRes.json() : [];
      setDatasetsCount(datasetData.length);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleRename = async (id, newTitle) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboards/${id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        setDashboards(prev => prev.map(d => d.id === id ? { ...d, title: newTitle } : d));
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setDashboards(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };



  const stats = [
    { label: "Total Dashboards", value: dashboards.length.toString(), icon: <BarChart3 size={24} className="text-[var(--primary)]" />, trend: "Updated recently" },
    { label: "Connected Datasets", value: datasetsCount.toString(), icon: <Database size={24} className="text-[var(--accent)]" />, trend: "Active sources" },
    { label: "Team Members", value: "1", icon: <Users size={24} className="text-emerald-500" />, trend: "Just you" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 theme-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-[var(--text-muted)]">Here's what's happening with your data today.</p>
        </div>
        <Link 
          to="/studio/new"
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)] px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[var(--primary)]/20"
        >
          <Plus size={20} />
          New Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-sidebar)]/50 p-6 rounded-2xl border border-[var(--border)] flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)]/80 flex items-center justify-center">
                {stat.icon}
              </div>
              <TrendingUp size={20} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="text-[var(--text-muted)] text-sm font-medium">{stat.label}</h3>
            <div className="text-3xl font-bold text-white mt-1 mb-2">{stat.value}</div>
            <p className="text-xs text-[var(--text-muted)] opacity-60">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Dashboards</h2>
          <Link to="/studio" className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">View all</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboards.length === 0 && !loading && (
            <div className="col-span-full mb-4 p-8 bg-[var(--bg-sidebar)]/30 rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
                 <FileWarning className="text-[var(--primary)]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No dashboards found</h3>
              <p className="text-[var(--text-muted)] max-w-md">You haven't created any dashboards yet. Start by building your first interactive workspace.</p>
            </div>
          )}

          {dashboards.map((dash, idx) => {
            const colors = [
              "from-[var(--primary)] to-[var(--accent)]", 
              "from-[var(--accent)] to-[var(--primary)]", 
              "from-emerald-400 to-teal-500", 
              "from-orange-400 to-rose-400"
            ];
            const color = colors[idx % colors.length];
            // format date
            const dateStr = dash.updated_at ? new Date(dash.updated_at).toLocaleDateString() : 'Just now';

            return (
              <Link key={dash.id} to={`/studio/${dash.id}`} className="group relative bg-[var(--bg-sidebar)]/50 rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/50 transition-all shadow-md">
                <div className={`h-32 bg-gradient-to-br ${color} opacity-60 group-hover:opacity-80 transition-opacity p-4 flex items-end justify-between`}>
                  <div className="w-full h-1/2 bg-[var(--bg-main)]/40 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/50 group-hover:text-white/80 transition-colors">
                    <BarChart3 size={32} />
                  </div>
                </div>
                <div className="p-5">
                <h3 className="font-bold text-white mb-1 truncate">{dash.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Clock size={12} />
                  Edited {dateStr}
                </div>
              </div>
              
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(activeMenu === dash.id ? null : dash.id); }}
                  className="bg-black/40 hover:bg-black/60 rounded-md p-1.5 backdrop-blur-sm text-white/70 hover:text-white transition-all shadow-lg"
                >
                  <MoreVertical size={16} />
                </button>
                
                {activeMenu === dash.id && (
                  <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl py-2 w-32 animate-in zoom-in-95 duration-200 z-50">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenameTarget(dash); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] hover:text-white flex items-center gap-2"
                    >
                      <Edit2 size={12} /> Rename
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(dash); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </Link>
            )
          })}
          
          <Link to="/studio/new" className="bg-[var(--bg-sidebar)]/30 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex flex-col items-center justify-center min-h-[220px] text-[var(--text-muted)] hover:text-[var(--primary)]">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-main)]/50 flex items-center justify-center mb-3">
              <Plus size={24} />
            </div>
            <span className="font-bold text-[10px] uppercase tracking-widest">Create New</span>
          </Link>
        </div>
      </div>

      <RenameModal 
        isOpen={!!renameTarget} 
        onClose={() => setRenameTarget(null)} 
        currentTitle={renameTarget?.title} 
        onRename={(newTitle) => handleRename(renameTarget.id, newTitle)} 
      />

      <DeleteModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onDelete={() => handleDelete(deleteTarget.id)} 
      />
    </div>
  );
}
