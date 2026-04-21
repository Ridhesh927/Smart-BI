import React, { useState, useEffect } from 'react';
import { Filter as FilterIcon, X, Search, Info, Settings2, BarChart2, Star } from "lucide-react";

const TABS = [
  { id: 'general', name: 'General', icon: <FilterIcon size={14} /> },
  { id: 'wildcard', name: 'Wildcard', icon: <Star size={14} /> },
  { id: 'condition', name: 'Condition', icon: <Settings2 size={14} /> },
  { id: 'top', name: 'Top', icon: <BarChart2 size={14} /> }
];

export function FilterModal({ field, datasetId, onConfirm, onCancel, user, dataset = null }) {
  const [activeTab, setActiveTab] = useState('general');
  const [values, setValues] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exclude, setExclude] = useState(false);
  
  // Wildcard State
  const [wildcard, setWildcard] = useState({ matchType: 'contains', value: '' });
  
  // Condition State
  const [condition] = useState({ type: 'none', field: '', operator: '>', value: '' });
  
  // Top State
  const [top] = useState({ active: false, type: 'top', count: 10, measure: '' });

  useEffect(() => {
    const fetchValues = async () => {
      try {
        setLoading(true);
        // In Demo/Mock mode, we Use the dataset data if provided
        if (dataset) {
          const uniqueValues = [...new Set(dataset.data.map(item => item[field.name]))];
          setValues(uniqueValues);
          setSelected(uniqueValues);
          setLoading(false);
          return;
        }

        const token = user ? await user?.getIdToken() : null;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${datasetId}/values/${field.name}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setValues(data);
          setSelected(data);
        }
      } catch (err) {
        console.error("Failed to fetch values:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchValues();
  }, [field, datasetId, user, dataset]);

  const filteredValues = values.filter(v => 
    String(v).toLowerCase().includes(search.toLowerCase())
  );

  const toggleValue = (val) => {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const handleOK = () => {
    onConfirm({
      field: field.name,
      type: field.type,
      filterType: activeTab,
      params: {
        selected: activeTab === 'general' ? selected : [],
        exclude,
        wildcard: activeTab === 'wildcard' ? wildcard : null,
        condition: activeTab === 'condition' ? condition : null,
        top: activeTab === 'top' ? top : null
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-[500px] h-[640px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
               Filter [{field.name}]
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-bold">Advanced Selection</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Tabs Tracker */}
        <div className="flex border-b border-slate-800 shrink-0 bg-slate-900/30">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'text-blue-400 border-blue-400 bg-blue-400/5' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto invisible-scrollbar">
          
          {activeTab === 'general' && (
            <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="radio" name="select-mode" defaultChecked className="w-3 h-3 text-blue-600 bg-slate-900 border-slate-700" /> Select from list
                </label>
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer opacity-50">
                  <input type="radio" name="select-mode" className="w-3 h-3 text-blue-600 bg-slate-900 border-slate-700" disabled /> Custom value list
                </label>
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer opacity-50">
                  <input type="radio" name="select-mode" className="w-3 h-3 text-blue-600 bg-slate-900 border-slate-700" disabled /> Use all
                </label>
              </div>

              <div className="flex items-center justify-between bg-slate-950/30 p-2 rounded-xl border border-slate-800/50">
                <div className="flex gap-2">
                  <button onClick={() => setSelected(values)} className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 text-[9px] font-bold uppercase tracking-widest text-slate-300 rounded-lg transition-all border border-slate-700/50">All</button>
                  <button onClick={() => setSelected([])} className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 text-[9px] font-bold uppercase tracking-widest text-slate-300 rounded-lg transition-all border border-slate-700/50">None</button>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-white transition-colors pr-1">
                   <input type="checkbox" checked={exclude} onChange={() => setExclude(!exclude)} className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-0" /> Exclude
                </label>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Enter search text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredValues.map((val) => (
                      <label key={val} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                          checked={selected.includes(val)}
                          onChange={() => toggleValue(val)}
                        />
                        <span className="text-xs text-slate-300 group-hover:text-white truncate">{String(val)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
          )}

          {activeTab === 'wildcard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3">
                 <Info className="text-blue-400 shrink-0" size={18} />
                 <p className="text-[11px] text-blue-200/70 leading-relaxed italic">Search for data using character patterns. Use * for multiple characters and ? for single characters.</p>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pattern</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A*S" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                      value={wildcard.value}
                      onChange={(e) => setWildcard({...wildcard, value: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {['Contains', 'Starts with', 'Ends with', 'Exactly matches'].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setWildcard({...wildcard, matchType: opt.toLowerCase()})}
                        className={`p-3 rounded-xl border text-[11px] font-medium transition-all text-left ${wildcard.matchType === opt.toLowerCase() ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                         {opt}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {(activeTab === 'condition' || activeTab === 'top') && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                  {activeTab === 'condition' ? <Settings2 size={32} /> : <BarChart2 size={32} />}
               </div>
               <h4 className="text-sm font-bold text-white mb-2">Professional {activeTab} Filtering</h4>
               <p className="text-xs text-slate-500 leading-relaxed italic">Advanced dynamic filtering by measure ranges or Top N rankings is currently being simulated.</p>
            </div>
          )}
        </div>

        {/* Summary Footer Section */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800">
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2">Filter Summary</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                 <span className="text-slate-500">Field:</span> <span className="text-slate-300 font-bold">[{field.name}]</span>
                 <span className="text-slate-500">Selection:</span> <span className="text-slate-300 font-bold">{exclude ? 'Excluding' : 'Selecting'} {selected.length} of {values.length} values</span>
                 <span className="text-slate-500">Wildcard:</span> <span className="text-blue-400 font-bold">{wildcard.value || 'None'}</span>
                 <span className="text-slate-500">Limit:</span> <span className="text-amber-400 font-bold">{top.active ? `${top.type} ${top.count}` : 'None'}</span>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-between gap-3">
          <button onClick={() => {}} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Reset</button>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest">Cancel</button>
            <button 
              onClick={handleOK} 
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-widest"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
