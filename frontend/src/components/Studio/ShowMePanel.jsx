import React from 'react';
import { Layers, ChevronDown, Search, Plus } from "lucide-react";
import { showMeCharts } from './constants';

export function ShowMePanel({ 
  showShowMe, 
  setShowShowMe, 
  activeSheet, 
  updateActiveSheet, 
  hoveredChart, 
  setHoveredChart, 
  handleAutoAiGenerate 
}) {
  if (!showShowMe) return null;

  return (
    <div className="w-[280px] border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 italic">
          <Layers size={16} className="text-indigo-400" /> Show Me
        </h2>
        <button 
          onClick={() => setShowShowMe(false)}
          className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white"
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
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-gray-400 hover:text-white group relative ${activeSheet.type === chart.type ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'}`}
            >
              <div className={`${activeSheet.type === chart.type ? 'text-indigo-400' : 'text-slate-500 group-hover:text-blue-400'}`}>
                {chart.icon}
              </div>
              <span className="text-[9px] text-center line-clamp-1 opacity-60 group-hover:opacity-100">{chart.name}</span>
            </button>
          ))}
        </div>

         {/* Requirements & AI Panel */}
         <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="min-h-[80px]">
              {hoveredChart ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Requirements:</p>
                  <div className="flex flex-col gap-2">
                     {hoveredChart.req.dims && (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-blue-500 rounded-full" />
                          <span className="text-[11px] text-slate-300">{hoveredChart.req.dims} Dimensions</span>
                        </div>
                     )}
                     {hoveredChart.req.meas && (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                          <span className="text-[11px] text-slate-300">{hoveredChart.req.meas} Measures</span>
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group border border-indigo-400/30"
            >
              <Plus size={14} className="group-hover:rotate-12 transition-transform" />
              CHOOSE FOR ME
            </button>
         </div>
      </div>
    </div>
  );
}
