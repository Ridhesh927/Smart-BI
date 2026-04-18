import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Search, Filter, FileSpreadsheet, Trash2, Loader2, ExternalLink, BarChart2, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DataProfilePanel } from "../components/DataProfilePanel";
import { DeleteModal, SuccessModal } from "../components/Modals/DashboardModals";

export default function Datasets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileDataset, setProfileDataset] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/datasets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDatasets(data);
      }
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchDatasets();
  }, [user, fetchDatasets]);

  const handleDownloadClean = async (ds) => {
    try {
      setDownloadingId(ds.id);
      const token = await user?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${ds.id}/clean`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_${ds.file_name.replace(/\.[^.]+$/, '.csv')}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage('Download error: ' + err.message);
      setIsErrorModalOpen(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append('dataset', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/datasets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        fetchDatasets();
      } else {
        setErrorMessage("Upload failed: " + result.error);
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      setErrorMessage("Upload error: " + err.message);
      setIsErrorModalOpen(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${deleteTargetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setDatasets(datasets.filter(ds => ds.id !== deleteTargetId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDatasets = datasets.filter(ds => 
    ds.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Datasets Manager</h1>
          <p className="text-slate-400">Upload, organize, and prepare your data sources for AI analysis.</p>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all relative overflow-hidden ${
          isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.01]" : "border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".csv,.xlsx,.json"
        />
        
        {uploading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white">Uploading Dataset...</h3>
            <p className="text-sm text-slate-400">Processing your data structure</p>
          </div>
        )}

        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-700">
          <UploadCloud size={40} className={`transition-colors ${isDragging ? "text-blue-400" : "text-slate-500"}`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Drag & drop your records here
        </h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Support for CSV, Excel (.xlsx), and JSON files up to 500MB. AutoBI will automatically extract dimensions and measures.
        </p>
        <button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          onClick={() => fileInputRef.current.click()}
        >
          Browse Files
        </button>
      </div>

      <div className="glass rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search your library..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-full transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {filteredDatasets.length} total sources
            </div>
            <button className="p-2.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 border border-slate-700 rounded-xl">
              <Filter size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-600">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p className="text-sm font-medium">Synchronizing your library...</p>
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-600">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">No datasets found in your library.</p>
              <p className="text-xs">Upload a file to start your analysis.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 bg-slate-900/10">
                  <th className="p-6 font-bold">Source Name</th>
                  <th className="p-6 font-bold text-center">Data Size</th>
                  <th className="p-6 font-bold text-center">Status</th>
                  <th className="p-6 font-bold">Created At</th>
                  <th className="p-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredDatasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          {ds.file_name.endsWith('.csv') ? <FileText size={20} className="text-blue-400" /> : <FileSpreadsheet size={20} className="text-emerald-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">{ds.file_name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{ds.file_name.split('.').pop()} SOURCE</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center text-xs font-medium text-slate-400">{formatSize(ds.file_size)}</td>
                    <td className="p-6 text-center">
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-full uppercase tracking-widest italic">Ready</span>
                    </td>
                    <td className="p-6 text-xs text-slate-500">{new Date(ds.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDownloadClean(ds)}
                          disabled={downloadingId === ds.id}
                          className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all disabled:opacity-50" 
                          title="Download Cleaned CSV"
                        >
                          {downloadingId === ds.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        </button>
                        <button 
                          onClick={() => setProfileDataset(ds)}
                          className="p-2.5 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-xl transition-all" 
                          title="Data Profile Report"
                        >
                          <BarChart2 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/studio/new?dataset=${ds.id}`)}
                          className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all" 
                          title="Open in Studio"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteTargetId(ds.id)}
                          className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" 
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {profileDataset && (
        <DataProfilePanel
          datasetId={profileDataset.id}
          datasetName={profileDataset.file_name}
          user={user}
          onClose={() => setProfileDataset(null)}
        />
      )}

      <DeleteModal 
        isOpen={!!deleteTargetId} 
        onClose={() => setDeleteTargetId(null)} 
        onDelete={handleDelete}
        message="Are you sure you want to delete this dataset?"
      />

      <SuccessModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        message={errorMessage}
      />
    </div>
  );
}
