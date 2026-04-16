import React, { useState, useEffect } from 'react';
import { Filter, X, Search } from "lucide-react";

export function FilterModal({ field, datasetId, onConfirm, onCancel, user }) {
  const [values, setValues] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [exclude, setExclude] = useState(false);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await user?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${datasetId}/values/${field.name}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setValues(data);
          setSelected(data); // Default to select all
        } else {
          setError(data.error || "Invalid data format received");
          setValues([]);
        }
      } catch (err) {
        console.error("Failed to fetch values:", err);
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchValues();
  }, [field, datasetId, user]);

  const filteredValues = Array.isArray(values) 
    ? values.filter(v => String(v).toLowerCase().includes(search.toLowerCase()))
    : [];

  const toggleValue = (val) => {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-[450px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
             <Filter size={16} className="text-blue-400" /> Filter [{field.name}]
          </h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                autoFocus
                type="text" 
                placeholder="Enter search text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setExclude(!exclude)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${exclude ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              Exclude
            </button>
          </div>

          <div className="h-[250px] bg-slate-950 border border-slate-800 rounded-xl overflow-y-auto slim-scrollbar relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                 <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
                    <X size={20} />
                 </div>
                 <p className="text-sm font-bold text-white mb-1">Failed to load values</p>
                 <p className="text-[10px] text-slate-500 leading-relaxed">{error}</p>
              </div>
            ) : (
              <div className="p-1">
                {filteredValues.map((val) => (
                  <label key={val} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      checked={selected.includes(val)}
                      onChange={() => toggleValue(val)}
                    />
                    <span className="text-xs text-slate-300 group-hover:text-white truncate">{String(val)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {!error && !loading && (
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
               <div className="flex gap-4">
                  <button onClick={() => setSelected(values)} className="hover:text-blue-400">All</button>
                  <button onClick={() => setSelected([])} className="hover:text-blue-400">None</button>
               </div>
               <div>Selected {selected.length} of {values.length}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button 
            disabled={loading || (selected.length === 0 && !exclude)}
            onClick={() => onConfirm({ values: selected, exclude })} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
