import React from 'react';
import { Layers, ChevronDown, Search, Plus } from "lucide-react";
import { showMeCharts } from './constants';

export const ShowMePanel = React.memo(({ 
  showShowMe, 
  setShowShowMe, 
  activeSheet, 
  updateActiveSheet, 
  hoveredChart, 
  setHoveredChart, 
  handleAutoAiGenerate 
}) => {
  if (!showShowMe) return null;

  return (
    <div className="w-[280px] border-l border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-300 theme-transition">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/50">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 italic">
          <Layers size={16} className="text-[var(--primary)]" /> Show Me
        </h2>
        <button 
          onClick={() => setShowShowMe(false)}
          className="p-1 hover:bg-[var(--bg-surface)] rounded-md text-[var(--text-muted)] hover:text-white"
        >
          <ChevronDown size={14} className="rotate-[270deg]" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 slim-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {showMeCharts.map((chart) => (
            <button 
              key={chart.name}
              onMouseEnter={() => setHoveredChart(chart)}
              onMouseLeave={() => setHoveredChart(null)}
              onClick={() => updateActiveSheet({ type: chart.type })}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-gray-400 hover:text-white group relative ${activeSheet.type === chart.type ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50 text-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' : 'bg-[var(--bg-main)] border-[var(--border)] hover:bg-[var(--bg-surface)]'}`}
            >
              <div className={`${activeSheet.type === chart.type ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}`}>
                {chart.icon}
              </div>
              <span className="text-[9px] text-center line-clamp-1 opacity-60 group-hover:opacity-100">{chart.name}</span>
            </button>
          ))}
        </div>

         {/* Requirements & AI Panel */}
         <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-4">
            <div className="min-h-[80px]">
              {hoveredChart ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-3 font-bold">Requirements:</p>
                  <div className="flex flex-col gap-2">
                     {hoveredChart.req.dims && (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-blue-500 rounded-full" />
                          <span className="text-[11px] text-[var(--text-main)]/80">{hoveredChart.req.dims} Dimensions</span>
                        </div>
                     )}
                     {hoveredChart.req.meas && (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                          <span className="text-[11px] text-[var(--text-main)]/80">{hoveredChart.req.meas} Measures</span>
                        </div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-4">
                  <Search size={20} className="mb-2" />
                  <p className="text-[9px] uppercase tracking-tighter">Hover to see requirements</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleAutoAiGenerate}
              className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)] text-[11px] font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group border border-[var(--primary)]/30"
            >
              <Plus size={14} className="group-hover:rotate-12 transition-transform" />
              CHOOSE FOR ME
            </button>
         </div>
      </div>
    </div>
  );
});
