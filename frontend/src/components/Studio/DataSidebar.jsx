import React from 'react';
import { Database, Layers, Search, Table, Plus, BarChart3 } from "lucide-react";
import { DraggableField } from './DndHelpers';
import { DataProfileView } from '../DataProfilePanel';

export const DataSidebar = React.memo(({ 
  activeLeftTab, 
  setActiveLeftTab, 
  searchQuery, 
  setSearchQuery, 
  loading, 
  dataFields, 
  aiPrompt, 
  setAiPrompt, 
  handleAiGenerate, 
  isAiGenerating,
  activeDataset,
  user,
  aiSuggestion
}) => {
  return (
    <div className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Left Tabs - Data & AI Switcher */}
        <div className="flex border-b border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveLeftTab('data')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeLeftTab === 'data' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Database size={14} /> Data
          </button>
          <button 
            onClick={() => setActiveLeftTab('ai')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeLeftTab === 'ai' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Layers size={14} /> AI
          </button>
          <button 
            onClick={() => setActiveLeftTab('quality')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeLeftTab === 'quality' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BarChart3 size={14} /> Quality
          </button>
        </div>

        {activeLeftTab === 'data' ? (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
            {/* Search */}
            <div className="p-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Search fields..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Source Label */}
            <div className="px-4 py-2 bg-slate-800/20 text-xs font-medium text-slate-500 flex items-center gap-2 border-y border-slate-800/50">
              <Table size={12} /> {loading ? 'Loading schema...' : (dataFields.dimensions.length > 0 ? 'Active Dataset' : 'No Data Connected')}
            </div>

            {/* Fields List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 slim-scrollbar pt-2">
              <div className="mb-6">
                <h3 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Dimensions
                </h3>
                
                {/* Dimensions */}
                <div className="space-y-0.5">
                  {dataFields.dimensions
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((field) => (
                      <DraggableField key={field.name} field={field} />
                  ))}
                </div>

                <div className="h-px bg-slate-800/50 mt-6 mb-4 mx-2"></div>

                <h3 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Measures
                </h3>

                {/* Measures */}
                <div className="space-y-0.5">
                  {dataFields.measures
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((field) => (
                      <DraggableField key={field.name} field={field} />
                  ))}
                </div>
              </div>
              
              <button className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-[10px] font-bold uppercase tracking-widest border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all">
                <Plus size={12} /> Add Dataset
              </button>
            </div>
          </div>
        ) : activeLeftTab === 'quality' ? (
          <div className="flex-1 min-h-0 animate-in fade-in duration-300 overflow-hidden">
            <DataProfileView 
              datasetId={activeDataset?.id} 
              datasetName={activeDataset?.file_name} 
              user={user} 
              isEmbedded={true} 
            />
          </div>
        ) : (
          <div className="flex-1 p-4 animate-in slide-in-from-left-4 duration-300 overflow-y-auto">
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Assistant</h3>
                  <p className="text-[10px] text-slate-500">Natural language chart generation</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prompt</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none resize-none focus:ring-1 focus:ring-blue-500 h-32 transition-all" 
                    placeholder="e.g. Suggest the cleanest chart for this dataset and tell me which fields and filters will make it clear"
                  />
                </div>
                <button 
                  onClick={() => handleAiGenerate()}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isAiGenerating ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 shadow-lg cursor-pointer'}`}
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : 'Generate Visualization'}
                </button>
                
                <div className="pt-4 border-t border-slate-800 mt-2">
                   <p className="text-[9px] text-slate-500 italic text-center leading-relaxed">
                     The assistant will choose cleaner fields for the shelves and explain which filters can reduce clutter.
                   </p>
                </div>

                {aiSuggestion && (
                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Recommendation</p>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {aiSuggestion.summary || `Using a ${aiSuggestion.chartType} chart for ${aiSuggestion.title}.`}
                      </p>
                    </div>

                    {aiSuggestion.recommendedFilters?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Suggested Filters</p>
                        <div className="space-y-2">
                          {aiSuggestion.recommendedFilters.map((item, index) => (
                            <div key={`${item.field}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-white">{item.field}</span>
                                <span className={`text-[9px] uppercase tracking-widest font-bold ${item.priority === 'high' ? 'text-amber-400' : 'text-slate-500'}`}>
                                  {item.priority || 'medium'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiSuggestion.avoidedFields?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Avoid For Clarity</p>
                        <div className="space-y-2">
                          {aiSuggestion.avoidedFields.map((item, index) => (
                            <div key={`${item.field}-${index}`} className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-3">
                              <div className="text-xs font-semibold text-rose-200">{item.field}</div>
                              <p className="text-[11px] text-rose-100/70 mt-1 leading-relaxed">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiSuggestion.tips?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Make It Cleaner</p>
                        <div className="space-y-2">
                          {aiSuggestion.tips.map((tip, index) => (
                            <div key={`${tip}-${index}`} className="text-[11px] text-slate-300 leading-relaxed rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2">
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
