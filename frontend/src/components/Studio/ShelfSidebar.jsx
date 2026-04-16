import React from 'react';
import { X, ChevronDown, Palette, Maximize, Type, Share2, MessageSquare, Hash } from "lucide-react";
import { DroppableShelf } from './DndHelpers';
import { MARK_TYPES } from './constants';

export function ShelfSidebar({ 
  activeSheet, 
  removePill, 
  isMarksOpen, 
  setIsMarksOpen, 
  currentMarkType, 
  updateActiveSheet 
}) {
  return (
    <div className="w-60 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0 overflow-y-auto slim-scrollbar">
      
      {/* Pages Card */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pages</h3>
        <DroppableShelf id="pages" className="min-h-[48px] bg-slate-950/50 border border-dashed border-slate-700 flex flex-wrap gap-1 p-1">
           {activeSheet.shelves.pages.length === 0 && (
             <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 pointer-events-none">Drop here</span>
           )}
           {activeSheet.shelves.pages.map(pill => (
             <div key={pill.pillId} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
               {pill.displayName}
               <button onClick={() => removePill('pages', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
             </div>
           ))}
        </DroppableShelf>
      </div>

      {/* Filters Card */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filters</h3>
        <DroppableShelf id="filters" className="min-h-[64px] bg-slate-950/50 border border-dashed border-slate-700 flex flex-wrap gap-1 p-1">
           {activeSheet.shelves.filters.length === 0 && (
             <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 pointer-events-none">Drop here</span>
           )}
           {activeSheet.shelves.filters.map(pill => (
             <div key={pill.pillId} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
               {pill.displayName}
               <button onClick={() => removePill('filters', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
             </div>
           ))}
        </DroppableShelf>
      </div>

      {/* Marks Card */}
      <div className="p-3 flex-1">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Marks</h3>
        
        <div className="space-y-4">
          {/* Chart Type Selector */}
          <div className="relative">
            <div 
              onClick={() => setIsMarksOpen(!isMarksOpen)}
              className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white cursor-pointer group transition-colors shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <div className="text-blue-400">{currentMarkType.icon}</div>
                {currentMarkType.name}
              </div>
              <ChevronDown size={14} className={`text-slate-500 group-hover:text-blue-400 transition-transform duration-200 ${isMarksOpen ? 'rotate-180' : ''}`} />
            </div>

            {isMarksOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsMarksOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-1 max-h-[300px] overflow-y-auto slim-scrollbar">
                  {MARK_TYPES.map((mark) => (
                    <button
                      key={mark.name}
                      onClick={() => {
                        updateActiveSheet({ type: mark.type });
                        setIsMarksOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-slate-800 ${activeSheet.type === mark.type ? 'text-blue-400 bg-blue-400/5 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      <div className={activeSheet.type === mark.type ? 'text-blue-400' : 'text-slate-500'}>
                         {mark.icon}
                      </div>
                      {mark.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Marks Properties Grid */}
          <div className="grid grid-cols-3 gap-1">
            <button className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-blue-400">
              <Palette size={16} className="mb-1" />
              <span className="text-[9px]">Color</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-blue-400">
              <Maximize size={16} className="mb-1" />
              <span className="text-[9px]">Size</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-blue-400">
              <Type size={16} className="mb-1" />
              <span className="text-[9px]">Label</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-blue-400">
              <Share2 size={16} className="mb-1" />
              <span className="text-[9px]">Detail</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-blue-400">
              <MessageSquare size={16} className="mb-1" />
              <span className="text-[9px]">Tooltip</span>
            </button>
          </div>

          {/* Droppable Marks Area */}
          <DroppableShelf id="marks" className="min-h-[100px] bg-slate-950/30 border border-dashed border-slate-800 p-2 flex flex-col gap-1.5">
            {activeSheet.shelves.marks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 pointer-events-none">Drop here</div>
            )}
            {activeSheet.shelves.marks.map(pill => (
               <div key={pill.pillId} className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                  <div className="flex items-center gap-2 truncate">
                    {pill.type === 'measure' ? <Hash size={12} /> : <Type size={12} />}
                    <span className="truncate">{pill.displayName}</span>
                  </div>
                  <button onClick={() => removePill('marks', pill.pillId)} className="hover:text-white transition-colors"><X size={12} /></button>
               </div>
            ))}
          </DroppableShelf>
        </div>
      </div>
    </div>
  );
}
