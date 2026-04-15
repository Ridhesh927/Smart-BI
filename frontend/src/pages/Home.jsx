import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { BarChart3, Database, Users, Plus, MoreVertical, TrendingUp, TrendingDown, Clock, FileWarning, Zap, ArrowRight, Edit3, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mini sparkline chart
function Sparkline({ data, color = "#3b82f6" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 30;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Quick action button
function QuickAction({ icon, label, to, color }) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-800 hover:border-${color}-500/40 bg-slate-900/40 hover:bg-${color}-500/5 transition-all group`}>
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboards, setDashboards] = useState([]);
  const [datasetsCount, setDatasetsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await user?.getIdToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [dashRes, dataRes] = await Promise.all([
          fetch(`http://localhost:5000/api/dashboards`, { headers }),
          fetch(`http://localhost:5000/api/datasets`, { headers })
        ]);
        const dashData = dashRes.ok ? await dashRes.json() : [];
        const datasetData = dataRes.ok ? await dataRes.json() : [];
        setDashboards(dashData);
        setDatasetsCount(datasetData.length);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const generateSeedData = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const seedNames = ["Q3 Sales Analytics", "User Expansion Report", "Marketing Campaign ROI", "Product Usage Metrics"];
      for (const name of seedNames) {
        await fetch(`http://localhost:5000/api/dashboards`, {
          method: 'POST', headers,
          body: JSON.stringify({ title: name, layout_data: [] })
        });
      }
      window.location.reload();
    } catch (err) {
      alert("Error seeding data: " + err.message);
      setLoading(false);
    }
  };

  const handleDeleteDashboard = async (id) => {
    if (!window.confirm("Delete this dashboard?")) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:5000/api/dashboards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDashboards(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
    setOpenMenuId(null);
  };

  const stats = [
    {
      label: "Total Dashboards",
      value: loading ? "-" : dashboards.length.toString(),
      icon: <BarChart3 size={20} className="text-blue-500" />,
      trend: "+2 this week",
      trendUp: true,
      sparkData: [2, 3, 2, 5, 4, 6, dashboards.length || 1],
      color: "blue"
    },
    {
      label: "Connected Datasets",
      value: loading ? "-" : datasetsCount.toString(),
      icon: <Database size={20} className="text-purple-500" />,
      trend: "Active sources",
      trendUp: true,
      sparkData: [1, 2, 1, 3, 2, datasetsCount || 1, datasetsCount || 2],
      color: "purple"
    },
    {
      label: "Team Members",
      value: "1",
      icon: <Users size={20} className="text-emerald-500" />,
      trend: "Solo plan",
      trendUp: null,
      sparkData: [1, 1, 1, 1, 1, 1, 1],
      color: "emerald"
    },
  ];

  const dashboardColors = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-orange-400 to-rose-400",
    "from-pink-500 to-fuchsia-500",
    "from-amber-400 to-orange-500"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'User'}</span> 👋
            </h1>
          </div>
          <p className="text-slate-400">Here's what's happening with your data today.</p>
        </div>
        <Link
          to="/studio/new"
          className="btn-primary"
        >
          <Plus size={18} /> New Dashboard
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass-hover rounded-2xl border border-slate-800 p-6 relative overflow-hidden"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl pointer-events-none`} />
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                {stat.icon}
              </div>
              <Sparkline data={stat.sparkData} color={`#${stat.color === 'blue' ? '3b82f6' : stat.color === 'purple' ? 'a855f7' : '22c55e'}`} />
            </div>
            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            <div className="text-4xl font-black text-white mt-1 mb-2 tracking-tight">
              {loading ? <div className="skeleton w-12 h-9" /> : stat.value}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {stat.trendUp === true && <TrendingUp size={12} className="text-emerald-400" />}
              {stat.trendUp === false && <TrendingDown size={12} className="text-red-400" />}
              <span className={stat.trendUp === true ? "text-emerald-400" : stat.trendUp === false ? "text-red-400" : "text-slate-500"}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
          <QuickAction icon={<Plus size={20} />} label="New Dashboard" to="/studio/new" color="blue" />
          <QuickAction icon={<Database size={20} />} label="Upload Dataset" to="/datasets" color="purple" />
          <QuickAction icon={<Zap size={20} />} label="Auto Visualize" to="/datasets" color="amber" />
        </div>
      </div>

      {/* Recent Dashboards */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Recent Dashboards</h2>
          <Link to="/home" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" ref={menuRef}>
          {/* Empty State */}
          {dashboards.length === 0 && !loading && (
            <div className="col-span-full mb-4 p-10 glass rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <FileWarning className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No dashboards yet</h3>
              <p className="text-slate-400 mb-6 max-w-sm text-sm">Build your first dashboard from scratch or generate demo data to explore SmartDash features.</p>
              <div className="flex gap-3">
                <button
                  onClick={generateSeedData}
                  className="btn-primary text-sm"
                >
                  <Zap size={16} /> Generate Demo Data
                </button>
                <Link to="/studio/new" className="btn-ghost text-sm">
                  <Plus size={16} /> Create from scratch
                </Link>
              </div>
            </div>
          )}

          {/* Skeleton loading */}
          {loading && Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-slate-800 overflow-hidden">
              <div className="skeleton h-28 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}

          {/* Dashboard cards */}
          {!loading && dashboards.map((dash, idx) => {
            const color = dashboardColors[idx % dashboardColors.length];
            const dateStr = dash.updated_at ? new Date(dash.updated_at).toLocaleDateString() : 'Just now';
            const isMenuOpen = openMenuId === dash.id;

            return (
              <div key={dash.id} className="group relative glass rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20">
                {/* Card thumbnail */}
                <Link to={`/studio/${dash.id}`}>
                  <div className={`h-28 bg-gradient-to-br ${color} opacity-80 group-hover:opacity-100 transition-opacity relative overflow-hidden`}>
                    {/* mini chart graphic */}
                    <div className="absolute inset-0 flex items-end justify-around p-3 gap-1">
                      {[40, 70, 55, 90, 65, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-white/20 rounded-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    {/* overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/studio/${dash.id}`}>
                    <h3 className="font-bold text-white text-sm mb-1 truncate hover:text-blue-400 transition-colors">{dash.title}</h3>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={11} />
                    Edited {dateStr}
                  </div>
                </div>

                {/* 3-dot context menu button */}
                <div className="absolute top-2.5 right-2.5 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : dash.id); }}
                    className="text-white/70 hover:text-white bg-black/25 hover:bg-black/50 rounded-lg p-1.5 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {isMenuOpen && (
                    <div className="dropdown-menu right-0 top-8 w-44">
                      <button className="dropdown-item" onClick={() => { navigate(`/studio/${dash.id}`); setOpenMenuId(null); }}>
                        <ExternalLink size={13} /> Open
                      </button>
                      <button className="dropdown-item" onClick={() => { navigate(`/studio/${dash.id}`); setOpenMenuId(null); }}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <div className="h-px bg-slate-800 my-1" />
                      <button className="dropdown-item danger" onClick={() => handleDeleteDashboard(dash.id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* New Dashboard card */}
          {!loading && (
            <Link to="/studio/new" className="glass rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/3 transition-all flex flex-col items-center justify-center min-h-[200px] text-slate-500 hover:text-blue-400 group">
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-blue-500/15 flex items-center justify-center mb-3 transition-colors">
                <Plus size={22} />
              </div>
              <span className="text-sm font-semibold">Create New</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
