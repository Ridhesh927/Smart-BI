import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { BarChart3, Database, Users, Plus, MoreVertical, TrendingUp, Clock, FileWarning } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  const [dashboards, setDashboards] = useState([]);
  const [datasetsCount, setDatasetsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await user?.getIdToken();
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch real dashboards 
        const dashRes = await fetch(`${import.meta.env.VITE_API_URL}/dashboards`, { headers });
        const dashData = dashRes.ok ? await dashRes.json() : [];
        setDashboards(dashData);

        // Fetch datasets count (you can update this API later, using dashboards for now as proof of concept)
        const dataRes = await fetch(`${import.meta.env.VITE_API_URL}/datasets`, { headers });
        const datasetData = dataRes.ok ? await dataRes.json() : [];
        setDatasetsCount(datasetData.length);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const generateSeedData = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const seedNames = ["Q3 Sales Analytics", "User Expansion Report", "Marketing Campaign ROI", "Product Usage Metrics"];
      
      for (const name of seedNames) {
        await fetch(`${import.meta.env.VITE_API_URL}/dashboards`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: name, layout_data: [] })
        });
      }
      
      // Auto refresh
      window.location.reload();
    } catch (err) {
      alert("Error seeding data: " + err.message);
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Dashboards", value: dashboards.length.toString(), icon: <BarChart3 size={24} className="text-blue-500" />, trend: "Updated recently" },
    { label: "Connected Datasets", value: datasetsCount.toString(), icon: <Database size={24} className="text-purple-500" />, trend: "Active sources" },
    { label: "Team Members", value: "1", icon: <Users size={24} className="text-emerald-500" />, trend: "Just you" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-slate-400">Here's what's happening with your data today.</p>
        </div>
        <Link 
          to="/studio/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          New Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-slate-800 flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center">
                {stat.icon}
              </div>
              <TrendingUp size={20} className="text-slate-500" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
            <div className="text-3xl font-bold text-white mt-1 mb-2">{stat.value}</div>
            <p className="text-xs text-slate-500">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Dashboards</h2>
          <Link to="/studio" className="text-sm text-blue-400 hover:text-blue-300 font-medium">View all</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboards.length === 0 && !loading && (
            <div className="col-span-full mb-4 p-8 glass rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                 <FileWarning className="text-blue-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No dashboards found</h3>
              <p className="text-slate-400 mb-6 max-w-md">You haven't created any dashboards yet. You can build one from scratch or instantly auto-generate some beautiful demo data!</p>
              <button 
                onClick={generateSeedData}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
              >
                Generate Demo Data
              </button>
            </div>
          )}

          {dashboards.map((dash, idx) => {
            const colors = ["from-blue-500 to-cyan-400", "from-purple-500 to-indigo-500", "from-emerald-400 to-teal-500", "from-orange-400 to-rose-400"];
            const color = colors[idx % colors.length];
            // format date
            const dateStr = dash.updated_at ? new Date(dash.updated_at).toLocaleDateString() : 'Just now';

            return (
              <Link key={dash.id} to={`/studio/${dash.id}`} className="group relative glass rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-600 transition-all">
                <div className={`h-32 bg-gradient-to-br ${color} opacity-80 group-hover:opacity-100 transition-opacity p-4 flex items-end justify-between`}>
                  <div className="w-full h-1/2 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/50 group-hover:text-white/80 transition-colors">
                    <BarChart3 size={32} />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white mb-1 truncate">{dash.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    Edited {dateStr}
                  </div>
                </div>
                <button className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-md p-1 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical size={16} />
                </button>
              </Link>
            )
          })}
          
          <Link to="/studio/new" className="glass rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center min-h-[220px] text-slate-400 hover:text-blue-400">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Plus size={24} />
            </div>
            <span className="font-medium">Create New</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
