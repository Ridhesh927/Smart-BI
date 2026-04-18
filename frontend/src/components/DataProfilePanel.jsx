import React, { useState, useEffect } from 'react';
import { X, BarChart2, Hash, Type, Calendar, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react';

const TYPE_CONFIG = {
  numeric: { label: 'Numeric', icon: <Hash size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  text:    { label: 'Text',    icon: <Type size={12} />,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  year:    { label: 'Year',    icon: <Calendar size={12} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

function QualityBar({ percent, total, count }) {
  const fillColor = percent === 0 ? 'bg-emerald-500' : percent < 20 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold">
        <span className={percent === 0 ? 'text-emerald-400' : percent < 20 ? 'text-amber-400' : 'text-red-400'}>
          {count} missing ({percent}%)
        </span>
        <span className="text-slate-500">{total - count} valid</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${fillColor}`} style={{ width: `${Math.max(percent, 0)}%` }} />
      </div>
    </div>
  );
}

function ColumnCard({ col }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[col.dataType] || TYPE_CONFIG.text;
  const hasIssues = col.nullPercent > 0;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${hasIssues ? 'border-slate-700' : 'border-slate-800'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasIssues
            ? <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            : <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          }
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate">{col.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-[10px] text-slate-500">{col.uniqueCount} unique</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <div className={`text-sm font-bold ${col.nullPercent === 0 ? 'text-emerald-400' : col.nullPercent < 20 ? 'text-amber-400' : 'text-red-400'}`}>
              {col.nullPercent}%
            </div>
            <div className="text-[10px] text-slate-500">missing</div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800/50 pt-4 animate-in slide-in-from-top-2 duration-200">
          <QualityBar percent={col.nullPercent} total={col.totalRows} count={col.nullCount} />

          <div className="grid grid-cols-3 gap-2">
            {col.dataType === 'numeric' && (
              <>
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Min</div>
                  <div className="text-sm font-bold text-white">{col.min?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mean</div>
                  <div className="text-sm font-bold text-white">{col.mean?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Max</div>
                  <div className="text-sm font-bold text-white">{col.max?.toLocaleString()}</div>
                </div>
              </>
            )}
            {(col.dataType === 'text' || col.dataType === 'year') && (
              <div className="col-span-3 bg-slate-900/50 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Sample Values</div>
                <div className="flex flex-wrap gap-1.5">
                  {col.sampleValues.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export function DataProfileView({ datasetId, datasetName, user, isEmbedded = false }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadToast, setDownloadToast] = useState(null);

  const handleDownloadClean = async () => {
    try {
      setDownloading(true);
      const token = await user?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${datasetId}/clean`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }

      const totalRows = parseInt(res.headers.get('X-Total-Rows') || '0', 10);
      const cleanRows = parseInt(res.headers.get('X-Clean-Rows') || '0', 10);
      const removedRows = totalRows - cleanRows;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_${datasetName.replace(/\.[^.]+$/, '.csv')}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadToast({ cleanRows, removedRows });
      setTimeout(() => setDownloadToast(null), 4000);
    } catch (err) {
      alert('Download error: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!datasetId) return;
      try {
        setLoading(true);
        const token = await user?.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${datasetId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [datasetId, user]);

  const visibleColumns = profile?.columns?.filter(c =>
    filter === 'issues' ? c.nullPercent > 0 : true
  ) || [];

  const scoreColor = !profile ? 'text-slate-400'
    : profile.qualityScore >= 90 ? 'text-emerald-400'
    : profile.qualityScore >= 70 ? 'text-amber-400'
    : 'text-red-400';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">Profiling dataset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-1">Profiling Failed</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-slate-900 ${isEmbedded ? '' : 'overflow-hidden'}`}>
      {!isEmbedded && (
        <div className="p-6 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={20} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">Data Profile Report</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">{datasetName}</p>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className={`p-4 grid ${isEmbedded ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-3'} border-b border-slate-800 shrink-0 bg-slate-950/20`}>
        <div className="bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-800">
          <div className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-bold mb-1 ${scoreColor}`}>{profile.qualityScore}%</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Quality</div>
        </div>
        <div className="bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-800">
          <div className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-bold text-white mb-1`}>{profile.totalRows?.toLocaleString()}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Rows</div>
        </div>
        <div className="bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-800">
          <div className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-bold text-white mb-1`}>{profile.totalColumns}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Columns</div>
        </div>
        <div className="bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-800">
          <div className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-bold text-amber-400 mb-1`}>
            {profile.columns?.filter(c => c.nullPercent > 0).length}
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Issues</div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex gap-1.5">
          {[['all', 'All'], ['issues', 'Issues']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${filter === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
            >
              {label} {val === 'issues' && profile.columns?.filter(c => c.nullPercent > 0).length > 0 ? `(${profile.columns.filter(c => c.nullPercent > 0).length})` : ''}
            </button>
          ))}
        </div>
        <button
          onClick={handleDownloadClean}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[9px] font-bold rounded-lg transition-all"
        >
          {downloading ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
          Clean CSV
        </button>
      </div>

      {/* Column List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 slim-scrollbar pt-2">
        {visibleColumns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600">
            <CheckCircle2 size={32} className="text-emerald-500/50 mb-2" />
            <p className="text-[11px] font-medium">No issues found!</p>
          </div>
        ) : (
          visibleColumns.map(col => <ColumnCard key={col.name} col={col} />)
        )}
      </div>

      {downloadToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-2xl text-[10px] font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
          <CheckCircle2 size={12} />
          {downloadToast.cleanRows.toLocaleString()} rows kept.
        </div>
      )}
    </div>
  );
}

export function DataProfilePanel({ datasetId, datasetName, user, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-800 hover:text-white transition-all z-10"
        >
          <X size={18} />
        </button>
        <DataProfileView datasetId={datasetId} datasetName={datasetName} user={user} isEmbedded={false} />
      </div>
    </div>
  );
}
