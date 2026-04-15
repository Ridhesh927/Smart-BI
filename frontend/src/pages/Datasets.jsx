import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud, FileText, Search, Filter, FileSpreadsheet, Trash2,
  CheckCircle2, AlertCircle, BarChart3, TrendingUp, X, ChevronLeft,
  ChevronRight, Eye, Zap, Activity, Download, FileDown, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Data quality score calculator
function getQualityScore(insights) {
  if (!insights?.analysis) return null;
  const { rowCount = 1, missingValues = 0, columns = [] } = insights.analysis;
  const totalCells = rowCount * (columns.length || 1);
  const missingPct = totalCells > 0 ? (missingValues / totalCells) * 100 : 0;
  const dupPct = rowCount > 0 ? ((insights.cleaning_report?.duplicateRowsDetected || 0) / rowCount) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - missingPct * 0.6 - dupPct * 0.4)));
  return score;
}

function QualityScoreRing({ score }) {
  if (score === null) return null;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Fair" : "Poor";
  const r = 28, cx = 32, cy = 32;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">{score}%</text>
      </svg>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

// Type chip colors
const typeColors = {
  csv: "badge-green", json: "badge-blue", xlsx: "badge-purple",
  ready: "badge-green", processing: "badge-amber", failed: "badge-red", uploaded: "badge-blue"
};

export default function Datasets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [datasetInsights, setDatasetInsights] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotalPages, setPreviewTotalPages] = useState(1);
  const [previewSearch, setPreviewSearch] = useState("");
  const [creatingDashboard, setCreatingDashboard] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  const [visualizationError, setVisualizationError] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const filterRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDownloadCleaned = async () => {
    if (!user || !selectedDatasetId) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:5000/api/datasets/${selectedDatasetId}/download-cleaned?format=${downloadFormat}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Download failed");
      }
      // Trigger browser download
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `cleaned_dataset.${downloadFormat}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const fetchDatasets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/datasets`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDatasets(await res.json());
    } catch (err) { console.error("Error fetching datasets:", err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) { handleFileUpload(e.dataTransfer.files[0]); e.dataTransfer.clearData(); }
  };
  const onFileInputChange = (e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); };
  const triggerFileInput = () => fileInputRef.current.click();

  const handleFileUpload = async (file) => {
    if (!user) return;
    setUploading(true);
    setUploadFeedback(null);
    setUploadProgress(0);

    const validExtensions = ['.csv', '.xlsx', '.json'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExtension) {
      setUploadFeedback({ type: "error", title: "Upload failed", message: "Only CSV, XLSX, and JSON files are allowed." });
      setUploading(false);
      return;
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => p < 85 ? p + Math.random() * 15 : p);
    }, 300);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('dataset', file);
      const res = await fetch(`http://localhost:5000/api/datasets/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Upload failed"); }
      const uploadData = await res.json();
      await fetchDatasets();
      setUploadFeedback({
        type: "success",
        title: "Dataset ready!",
        message: `${file.name} was uploaded and processed.`,
        steps: ["Data cleaning completed.", "Schema analysis done.", "Visualization plan generated."],
        fileDetails: { fileName: uploadData?.file?.originalname || file.name, fileSize: uploadData?.file?.size || file.size },
        recommendedVisuals: ["Bar Chart", "Line Chart", "Pie Chart", "Data Table"]
      });
    } catch (err) {
      clearInterval(progressInterval);
      setUploadFeedback({ type: "error", title: "Upload failed", message: err.message });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm("Delete this dataset?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/datasets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      setDatasets(prev => prev.filter(ds => ds.id !== id));
      if (selectedDatasetId === id) { setSelectedDatasetId(null); setDatasetInsights(null); }
    } catch (err) { alert("Failed to delete dataset: " + err.message); }
  };

  const handlePreviewDataset = async (datasetId, page = 1, search = previewSearch) => {
    if (!user) return;
    setSelectedDatasetId(datasetId);
    setInsightsLoading(true);
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [insightsRes, previewRes] = await Promise.all([
        fetch(`http://localhost:5000/api/datasets/${datasetId}/insights`, { headers }),
        fetch(`http://localhost:5000/api/datasets/${datasetId}/preview?page=${page}&limit=10&search=${encodeURIComponent(search || "")}`, { headers })
      ]);
      if (!insightsRes.ok) throw new Error("Failed to load insights");
      if (!previewRes.ok) throw new Error("Failed to load preview");
      const insightsData = await insightsRes.json();
      const previewData = await previewRes.json();
      setDatasetInsights(insightsData);
      setVisualizationError("");
      setPreviewRows(previewData.rows || []);
      setPreviewPage(previewData.page || 1);
      setPreviewTotalPages(previewData.totalPages || 1);
    } catch (error) {
      setDatasetInsights(null);
      setPreviewRows([]);
      alert(error.message);
    } finally { setInsightsLoading(false); }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toStudioWidgetType = (chartType) => {
    if (["bar", "line", "pie", "table", "stat", "scatter"].includes(chartType)) return chartType;
    return "bar";
  };

  const visualizationOptions = datasetInsights?.visual_recommendations?.length
    ? datasetInsights.visual_recommendations
    : [
        { chart: "line", title: "Trend Analysis", reason: "Useful for time or sequence trends." },
        { chart: "bar", title: "Category Comparison", reason: "Useful for comparing grouped values." },
        { chart: "pie", title: "Distribution Analysis", reason: "Useful for part-to-whole composition." },
        { chart: "scatter", title: "Relationship Plot", reason: "Useful for numeric relationship and outliers." }
      ];

  useEffect(() => {
    if (visualizationOptions.length > 0) setSelectedVisualization(visualizationOptions[0]);
  }, [datasetInsights]); // eslint-disable-line

  const buildElementsFromRecommendations = (recommendations = []) => {
    const usable = recommendations.length > 0 ? recommendations : [
      { chart: "line", title: "Trend Analysis" }, { chart: "bar", title: "Category Comparison" },
      { chart: "pie", title: "Distribution Analysis" }, { chart: "table", title: "Dataset Preview" }
    ];
    return usable.slice(0, 6).map((rec, index) => ({
      id: `auto-${Date.now()}-${index}`,
      type: toStudioWidgetType(rec.chart),
      title: rec.title || `Auto ${rec.chart}`,
      gridSpan: index === 0 ? "col-span-8 row-span-4" : "col-span-4 row-span-3",
      value: toStudioWidgetType(rec.chart) === "stat" ? "0" : ""
    }));
  };

  const createAutoDashboard = async (elements, title) => {
    if (!user || !selectedDatasetId) return;
    setCreatingDashboard(true);
    setVisualizationError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/dashboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, dataset_id: selectedDatasetId, layout_data: elements, visuals_data: elements })
      });
      if (!res.ok) throw new Error("Failed to create dashboard");
      const data = await res.json();
      if (data.id) navigate(`/studio/${data.id}`);
    } catch (error) {
      setVisualizationError(`Visualization failed: ${error.message}`);
    } finally { setCreatingDashboard(false); }
  };

  const handleAutoVisualizeBest = () => createAutoDashboard(buildElementsFromRecommendations(visualizationOptions), `${datasetInsights?.file_name || "Dataset"} - Auto Dashboard`);
  const handleVisualizeRecommendation = (rec) => createAutoDashboard(buildElementsFromRecommendations([rec]), `${datasetInsights?.file_name || "Dataset"} - ${rec?.chart || "Auto"} View`);

  const qualityScore = getQualityScore(datasetInsights);

  // Filtering logic
  const filteredDatasets = datasets.filter(ds => {
    const matchesSearch = ds.file_name?.toLowerCase().includes(datasetSearch.toLowerCase());
    const ext = ds.file_name?.split('.').pop()?.toLowerCase();
    const matchesType = filterType === "all" || ext === filterType;
    const matchesStatus = filterStatus === "all" || (ds.processing_status || "uploaded") === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const chartTypeIcon = (chart) => {
    const icons = { bar: <BarChart3 size={12} />, line: <TrendingUp size={12} />, pie: <Activity size={12} />, scatter: <Activity size={12} />, table: <FileText size={12} /> };
    return icons[chart] || <BarChart3 size={12} />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Datasets</h1>
          <p className="text-slate-400 text-sm">Upload, analyze, and visualize your data sources.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="badge badge-blue">{datasets.length} total</span>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadFeedback && (
        <div className={`rounded-2xl border p-5 animate-fade-in-up relative ${uploadFeedback.type === "success" ? "border-emerald-500/25 bg-emerald-500/8" : "border-red-500/25 bg-red-500/8"}`}>
          <button onClick={() => setUploadFeedback(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-start gap-3">
            {uploadFeedback.type === "success"
              ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              : <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              <h3 className={`font-semibold ${uploadFeedback.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{uploadFeedback.title}</h3>
              <p className="text-slate-300 text-sm mt-1">{uploadFeedback.message}</p>
              {uploadFeedback.type === "success" && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {uploadFeedback.steps?.map((step, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> {step}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <p className="text-slate-500 uppercase tracking-wide mb-1">File</p>
                      <p className="text-slate-200 truncate">{uploadFeedback.fileDetails?.fileName}</p>
                      <p className="text-slate-400 mt-0.5">{formatSize(uploadFeedback.fileDetails?.fileSize || 0)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <p className="text-slate-500 uppercase tracking-wide mb-1">Suggested Charts</p>
                      <p className="text-slate-200">{uploadFeedback.recommendedVisuals?.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all relative overflow-hidden ${isDragging ? "border-blue-500 bg-blue-500/8 scale-[1.01]" : "border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/60"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Progress bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="progress-bar rounded-none">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${isDragging ? "bg-blue-500/20 scale-110" : "bg-slate-800"}`}>
          <UploadCloud size={32} className={`transition-colors ${isDragging ? "text-blue-400" : uploading ? "text-blue-400 animate-bounce-subtle" : "text-slate-400"}`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : isDragging ? "Drop to upload!" : "Drag & drop your dataset"}
        </h3>
        <p className="text-slate-400 text-sm mb-5 max-w-sm mx-auto">
          CSV, Excel (.xlsx), or JSON files up to 500MB. SmartDash auto-detects schema and generates insights.
        </p>
        <input type="file" className="hidden" ref={fileInputRef} onChange={onFileInputChange}
          accept=".csv,.xlsx,.json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json" />
        <button
          className="btn-primary mx-auto"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          <UploadCloud size={16} /> {uploading ? "Processing..." : "Browse Files"}
        </button>
      </div>

      {/* Datasets Table */}
      <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3 justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search datasets..."
                value={datasetSearch}
                onChange={e => setDatasetSearch(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-56 transition-all focus:w-72"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter(v => !v)}
                className={`btn-ghost text-sm py-2 px-3 gap-1.5 ${(filterType !== "all" || filterStatus !== "all") ? "border-blue-500/40 text-blue-400" : ""}`}
              >
                <Filter size={14} />
                Filter
                {(filterType !== "all" || filterStatus !== "all") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
              {showFilter && (
                <div className="dropdown-menu left-0 top-10 w-52">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-2">File Type</p>
                  {["all", "csv", "xlsx", "json"].map(type => (
                    <button key={type} onClick={() => setFilterType(type)}
                      className={`dropdown-item ${filterType === type ? "bg-blue-500/10 text-blue-400" : ""}`}>
                      {type === "all" ? "All types" : type.toUpperCase()}
                    </button>
                  ))}
                  <div className="h-px bg-slate-800 my-1" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-2">Status</p>
                  {["all", "ready", "processing", "failed"].map(status => (
                    <button key={status} onClick={() => setFilterStatus(status)}
                      className={`dropdown-item ${filterStatus === status ? "bg-blue-500/10 text-blue-400" : ""}`}>
                      {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                  <div className="h-px bg-slate-800 my-1" />
                  <button onClick={() => { setFilterType("all"); setFilterStatus("all"); setShowFilter(false); }}
                    className="dropdown-item text-slate-500 hover:text-red-400">
                    <X size={12} /> Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-500">{filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900/20">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Size</th>
                <th className="px-5 py-3 font-semibold">Uploaded</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && datasets.length === 0 ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-40" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-12" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-24" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredDatasets.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500 text-sm">
                  {datasets.length === 0 ? "No datasets yet. Upload your first file above!" : "No datasets match your filters."}
                </td></tr>
              ) : (
                filteredDatasets.map(ds => {
                  const ext = ds.file_name?.split('.').pop()?.toLowerCase();
                  const status = ds.processing_status || "uploaded";
                  return (
                    <tr key={ds.id} className={`hover:bg-slate-800/20 transition-colors group ${selectedDatasetId === ds.id ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ext === 'csv' ? 'bg-emerald-500/10' : ext === 'json' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                            {ext === 'csv' ? <FileText size={17} className="text-emerald-400" /> : <FileSpreadsheet size={17} className="text-purple-400" />}
                          </div>
                          <span className="text-sm font-medium text-slate-200">{ds.file_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${typeColors[ext] || 'badge-blue'}`}>{ext?.toUpperCase() || '?'}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{formatSize(ds.file_size)}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{new Date(ds.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${typeColors[status] || 'badge-blue'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handlePreviewDataset(ds.id, 1)}
                            title="Analyze & Preview"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Eye size={13} /> Analyze
                          </button>
                          <button
                            onClick={() => handleDelete(ds.id)}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Insights Panel */}
      {selectedDatasetId && (
        <div className="glass rounded-2xl border border-slate-800 overflow-hidden panel-slide-in">
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Activity size={16} className="text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white">Dataset Insights</h3>
              {insightsLoading && <span className="badge badge-amber animate-pulse">Analyzing...</span>}
            </div>
            <div className="flex items-center gap-3">
              {/* Download Cleaned — inline in header */}
              {datasetInsights && !insightsLoading && (
                <div className="flex items-center gap-2">
                  <select
                    value={downloadFormat}
                    onChange={e => setDownloadFormat(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="json">JSON</option>
                  </select>
                  <button
                    onClick={handleDownloadCleaned}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {downloading
                      ? <><Loader2 size={13} className="animate-spin" /> Cleaning...</>
                      : <><FileDown size={13} /> Download Cleaned</>}
                  </button>
                </div>
              )}
              <button onClick={() => { setSelectedDatasetId(null); setDatasetInsights(null); setPreviewRows([]); setDownloadError(""); }}
                className="text-slate-500 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {datasetInsights && !insightsLoading && (
            <div className="p-6 space-y-6">
              {/* Overview stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Rows", value: (datasetInsights.analysis?.rowCount || datasetInsights.rows_count || 0).toLocaleString(), color: "blue" },
                  { label: "Columns", value: datasetInsights.analysis?.columnCount || datasetInsights.columns_count || 0, color: "purple" },
                  { label: "Missing Values", value: datasetInsights.analysis?.missingValues || 0, color: "amber" },
                  { label: "Duplicates", value: datasetInsights.cleaning_report?.duplicateRowsDetected ?? 0, color: "red" },
                ].map(stat => (
                  <div key={stat.label} className={`rounded-xl border border-${stat.color}-500/15 bg-${stat.color}-500/5 p-4 text-center`}>
                    <p className={`text-2xl font-black text-${stat.color}-300`}>{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Download error */}
              {downloadError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm animate-fade-in">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span className="text-red-300">{downloadError}</span>
                  <button onClick={() => setDownloadError("")} className="ml-auto text-slate-500 hover:text-white"><X size={14} /></button>
                </div>
              )}

              {/* Download Cleaned — full info card */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Download size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">Download Cleaned Dataset</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Duplicates removed · Empty columns dropped · Missing values filled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      {[
                        { icon: "✂️", label: `${datasetInsights.cleaning_report?.duplicateRowsDetected ?? 0} duplicates removed` },
                        { icon: "🚫", label: `${(datasetInsights.cleaning_report?.emptyColumnsDetected || []).length} empty cols dropped` },
                        { icon: "🔧", label: "Nulls filled (median/mode)" },
                      ].map(item => (
                        <span key={item.label} className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50 whitespace-nowrap">
                          {item.icon} {item.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={downloadFormat}
                        onChange={e => setDownloadFormat(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                        <option value="json">JSON</option>
                      </select>
                      <button
                        onClick={handleDownloadCleaned}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                      >
                        {downloading
                          ? <><Loader2 size={15} className="animate-spin" /> Cleaning & Exporting...</>
                          : <><FileDown size={15} /> Download Cleaned</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Narrative + Cleaning + Visualizations */}
              <div className="space-y-4">
                {/* AI Insight Section */}
                {datasetInsights.aiInsights && datasetInsights.aiInsights.length > 0 && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 animate-jade-in">
                    <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-4">
                      <Zap size={15} className="animate-pulse" /> AI Discovery Narrative
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {datasetInsights.aiInsights.map((insight, idx) => {
                        const colors = { anomaly: 'rose', trend: 'blue', quality: 'emerald', correlation: 'amber' };
                        const c = colors[insight.type] || 'slate';
                        return (
                          <div key={idx} className={`p-3 rounded-xl border border-${c}-500/10 bg-${c}-500/8 flex gap-3 items-start`}>
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-${c}-500 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-${c}-500/50`} />
                            <div>
                              <p className={`text-[9px] font-black text-${c}-400 uppercase tracking-widest`}>{insight.type}</p>
                              <p className="text-xs text-slate-200 leading-normal font-medium">{insight.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Cleaning report */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 size={15} /> Data Cleaning Report
                      </h4>
                      <QualityScoreRing score={qualityScore} />
                    </div>
                    <div className="space-y-2">
                      {datasetInsights.cleaning_report?.operations?.map(op => (
                        <div key={op.step} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-300 font-medium">{op.step.replaceAll("_", " ")}: </span>
                            <span className="text-slate-400">{op.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Visualization recommendations */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                      <Zap size={15} /> Recommended Visualizations
                    </h4>
                    <button
                      onClick={handleAutoVisualizeBest}
                      disabled={creatingDashboard}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {creatingDashboard ? "Creating..." : "Auto Visualize All"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {visualizationOptions.map(rec => (
                      <div key={`${rec.chart}-${rec.title}`}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${selectedVisualization?.chart === rec.chart && selectedVisualization?.title === rec.title ? 'border-blue-500/30 bg-blue-500/10' : 'border-transparent hover:bg-slate-800/40'}`}
                        onClick={() => { setSelectedVisualization(rec); setVisualizationError(""); }}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          {chartTypeIcon(rec.chart)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{rec.title}</p>
                          <p className="text-[10px] text-slate-500">{rec.reason}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVisualizeRecommendation(rec); }}
                          disabled={creatingDashboard}
                          className="shrink-0 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-semibold transition-colors"
                        >
                          Build
                        </button>
                      </div>
                    ))}
                  </div>
                  {visualizationError && (
                    <p className="text-xs text-red-400 mt-2">{visualizationError}</p>
                  )}
                </div>
              </div>
            </div>

              {/* Column Quality Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-slate-400" /> Column Quality Profile
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        {["Column", "Type", "Null %", "Unique", "Outliers"].map(h => (
                          <th key={h} className="py-2 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(datasetInsights.analysis?.columns || []).slice(0, 20).map(col => (
                        <tr key={col.name} className="hover:bg-slate-800/20">
                          <td className="py-2 pr-4 text-slate-200 font-medium">{col.name}</td>
                          <td className="py-2 pr-4">
                            <span className={`badge ${col.inferredType === 'number' ? 'badge-blue' : col.inferredType === 'date' ? 'badge-purple' : 'badge-amber'}`}>
                              {col.inferredType}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="progress-bar w-16 h-1.5">
                                <div className="progress-fill" style={{ width: `${col.nullPercentage}%`, background: col.nullPercentage > 30 ? '#ef4444' : col.nullPercentage > 10 ? '#f59e0b' : '#22c55e' }} />
                              </div>
                              <span className="text-slate-400">{col.nullPercentage}%</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-slate-400">{col.uniqueCount}</td>
                          <td className="py-2 pr-4 text-slate-400">{col.numericStats?.outliers ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Preview */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-200">Data Preview</h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                      <input
                        type="text"
                        placeholder="Search rows..."
                        value={previewSearch}
                        onChange={e => setPreviewSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none w-44"
                      />
                    </div>
                    <button
                      onClick={() => handlePreviewDataset(selectedDatasetId, 1, previewSearch)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        {previewRows[0] ? Object.keys(previewRows[0]).map(col => (
                          <th key={col} className="py-2 pr-4 font-semibold uppercase tracking-wider text-[10px]">{col}</th>
                        )) : <th className="py-2 pr-4">No data</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          {Object.values(row).map((val, idx) => (
                            <td key={idx} className="py-2 pr-4 text-slate-300">{String(val ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => handlePreviewDataset(selectedDatasetId, Math.max(1, previewPage - 1), previewSearch)}
                    disabled={previewPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 text-xs hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft size={13} /> Previous
                  </button>
                  <span className="text-xs text-slate-400">Page <span className="text-white font-semibold">{previewPage}</span> of <span className="text-white font-semibold">{previewTotalPages}</span></span>
                  <button
                    onClick={() => handlePreviewDataset(selectedDatasetId, Math.min(previewTotalPages, previewPage + 1), previewSearch)}
                    disabled={previewPage >= previewTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 text-xs hover:bg-slate-700 transition-colors"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {insightsLoading && (
            <div className="p-8 space-y-4">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
