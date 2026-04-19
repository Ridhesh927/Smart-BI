import React from 'react';
import { Database, Layers, Search, Table, Plus, BarChart3 } from "lucide-react";
import { DraggableField } from './DndHelpers';
import { DataProfileView } from '../DataProfilePanel';

export const DataSidebar = React.memo(({ 
  activeLeftTab, 
  setActiveLeftTab, 
  searchQuery, 
  setSearchQuery, 
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
    <aside className="w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col theme-transition">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/50">
        <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border)] mb-4">
          {[
            { id: 'data', icon: Database, label: 'Data' },
            { id: 'quality', icon: Table, label: 'Quality' },
            { id: 'ai', icon: BarChart3, label: 'AI Assistant' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeLeftTab === tab.id 
                  ? 'bg-[var(--primary)] text-[var(--bg-main)] shadow-lg' 
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden xl:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeLeftTab === 'data' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
            <input 
              type="text" 
              placeholder="Search fields..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-sidebar)]/30">
        {activeLeftTab === 'data' ? (
          <div className="flex-1 overflow-y-auto px-2 pb-4 slim-scrollbar pt-2">
            <div className="mb-6">
              <h3 className="px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 font-mono opacity-80">
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

              <div className="h-px bg-[var(--border)]/50 mt-6 mb-4 mx-2"></div>

              <h3 className="px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 font-mono opacity-80">
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
            
            <button className="w-full mt-2 flex items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest border border-dashed border-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)]/50 hover:bg-[var(--bg-surface)] transition-all active:scale-95 group">
              <Plus size={14} className="group-hover:scale-110 transition-transform" /> Add Dataset
            </button>
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
          <div className="flex-1 p-4 animate-in slide-in-from-left-4 duration-300 overflow-y-auto custom-scrollbar">
            <div className="bg-[var(--bg-main)]/50 border border-[var(--border)] rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 size={80} />
              </div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-[var(--bg-main)] shadow-lg shadow-[var(--primary)]/30">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Assistant</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Natural language chart generation</p>
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Prompt</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-white outline-none resize-none focus:ring-1 focus:ring-[var(--primary)] h-32 transition-all shadow-inner" 
                    placeholder="e.g. Suggest the cleanest chart for this dataset and tell me which fields and filters will make it clear"
                  />
                </div>
                <button 
                  onClick={() => handleAiGenerate()}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isAiGenerating ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)] shadow-[var(--primary)]/20 shadow-lg cursor-pointer'}`}
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[var(--text-muted)] border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : 'Generate Visualization'}
                </button>
                
                <div className="pt-4 border-t border-[var(--border)] mt-2">
                   <p className="text-[9px] text-[var(--text-muted)] italic text-center leading-relaxed opacity-60">
                     The assistant will choose cleaner fields for the shelves and explain which filters can reduce clutter.
                   </p>
                </div>

                {aiSuggestion && (
                  <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)]/70 p-4 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-1">Recommendation</p>
                      <p className="text-xs text-[var(--text-main)] leading-relaxed">
                        {aiSuggestion.summary || `Using a ${aiSuggestion.chartType} chart for ${aiSuggestion.title}.`}
                      </p>
                    </div>

                    {aiSuggestion.recommendedFilters?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Suggested Filters</p>
                        <div className="space-y-2">
                          {aiSuggestion.recommendedFilters.map((item, index) => (
                            <div key={`${item.field}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-main)]/80 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-white">{item.field}</span>
                                <span className={`text-[9px] uppercase tracking-widest font-bold ${item.priority === 'high' ? 'text-rose-400' : 'text-[var(--text-muted)]'}`}>
                                  {item.priority || 'medium'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiSuggestion.avoidedFields?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Avoid For Clarity</p>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Make It Cleaner</p>
                        <div className="space-y-2">
                          {aiSuggestion.tips.map((tip, index) => (
                            <div key={`${tip}-${index}`} className="text-[11px] text-[var(--text-main)]/80 leading-relaxed rounded-lg bg-[var(--bg-main)]/70 border border-[var(--border)] px-3 py-2">
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
    </aside>
  );
});
