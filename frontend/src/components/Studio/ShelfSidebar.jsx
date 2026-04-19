import React from 'react';
import { X, ChevronDown, Palette, Maximize, Type, Share2, MessageSquare, Hash } from "lucide-react";
import { DroppableShelf, DraggablePill } from './DndHelpers';
import { MARK_TYPES } from './constants';

export const ShelfSidebar = React.memo(({ 
  activeSheet, 
  removePill, 
  isMarksOpen, 
  setIsMarksOpen, 
  currentMarkType, 
  updateActiveSheet 
}) => {
  return (
    <div className="w-60 border-r border-[var(--border)] bg-[var(--bg-sidebar)]/50 flex flex-col shrink-0 overflow-y-auto slim-scrollbar theme-transition">
      
      {/* Pages Card */}
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Pages</h3>
        <DroppableShelf id="pages" className="min-h-[48px] bg-[var(--bg-main)]/50 border border-dashed border-[var(--border)]/50 flex flex-wrap gap-1 p-1 rounded-lg">
           {activeSheet.shelves.pages.length === 0 && (
             <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]/50 pointer-events-none">Drop here</span>
           )}
           {activeSheet.shelves.pages.map(pill => (
             <DraggablePill key={pill.pillId} pill={pill} sourceShelf="pages">
               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]'}`}>
                 {pill.displayName}
                 <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removePill('pages', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
               </div>
             </DraggablePill>
           ))}
        </DroppableShelf>
      </div>

      {/* Filters Card */}
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Filters</h3>
        <DroppableShelf id="filters" className="min-h-[64px] bg-[var(--bg-main)]/50 border border-dashed border-[var(--border)]/50 flex flex-wrap gap-1 p-1 rounded-lg">
           {activeSheet.shelves.filters.length === 0 && (
             <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]/50 pointer-events-none">Drop here</span>
           )}
           {activeSheet.shelves.filters.map(pill => (
             <DraggablePill key={pill.pillId} pill={pill} sourceShelf="filters">
               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]'}`}>
                 {pill.displayName}
                 <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removePill('filters', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
               </div>
             </DraggablePill>
           ))}
        </DroppableShelf>
      </div>

      {/* Marks Card */}
      <div className="p-3 flex-1">
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Marks</h3>
        
        <div className="space-y-4">
          {/* Chart Type Selector */}
          <div className="relative">
            <div 
              onClick={() => setIsMarksOpen(!isMarksOpen)}
              className="flex items-center justify-between px-3 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-main)]/80 hover:text-white cursor-pointer group transition-colors shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <div className="text-[var(--primary)]">{currentMarkType.icon}</div>
                {currentMarkType.name}
              </div>
              <ChevronDown size={14} className={`text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-transform duration-200 ${isMarksOpen ? 'rotate-180' : ''}`} />
            </div>

            {isMarksOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsMarksOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-1 max-h-[300px] overflow-y-auto slim-scrollbar">
                  {MARK_TYPES.map((mark) => (
                    <button
                      key={mark.name}
                      onClick={() => {
                        updateActiveSheet({ type: mark.type });
                        setIsMarksOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-[var(--bg-surface)] ${activeSheet.type === mark.type ? 'text-[var(--primary)] bg-[var(--primary)]/5 font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                      <div className={activeSheet.type === mark.type ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}>
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
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'color', icon: <Palette size={14} />, name: 'Color' },
              { id: 'size', icon: <Maximize size={14} />, name: 'Size' },
              { id: 'label', icon: <Type size={14} />, name: 'Label' },
              { id: 'detail', icon: <Share2 size={14} />, name: 'Detail' },
              { id: 'tooltip', icon: <MessageSquare size={14} />, name: 'Tooltip' }
            ].map((role) => {
              const assignedPills = activeSheet.shelves.marks.filter(p => p.role === role.id);
              const isAssigned = assignedPills.length > 0;
              
              return (
                <DroppableShelf 
                  key={role.id} 
                  id={`mark-${role.id}`} 
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all border ${
                    isAssigned 
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                      : 'bg-[var(--bg-main)]/30 border-transparent text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <div className="relative">
                    {role.icon}
                    {isAssigned && (
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[var(--primary)] text-[var(--bg-main)] rounded-full flex items-center justify-center text-[7px] font-bold shadow-sm">
                        {assignedPills.length}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] mt-1 font-medium">{role.name}</span>
                </DroppableShelf>
              );
            })}
          </div>

          {/* Droppable Marks Area (List View) */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)]/70 uppercase tracking-widest pl-1">Active Marks</h4>
            <DroppableShelf id="marks" className="min-h-[100px] bg-[var(--bg-main)]/30 border border-dashed border-[var(--border)] p-2 flex flex-col gap-1.5 rounded-xl">
              {activeSheet.shelves.marks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]/50 pointer-events-none italic">Drop fields here or on icons</div>
              )}
              {activeSheet.shelves.marks.map(pill => (
                <DraggablePill key={pill.pillId} pill={pill} sourceShelf="marks">
                  <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm group transition-all ${
                    pill.type === 'measure' 
                      ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-[var(--primary)]'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <div className="opacity-50">
                        {pill.role === 'color' && <Palette size={10} />}
                        {pill.role === 'size' && <Maximize size={10} />}
                        {pill.role === 'label' && <Type size={10} />}
                        {pill.role === 'detail' && <Share2 size={10} />}
                        {pill.role === 'tooltip' && <MessageSquare size={10} />}
                      </div>
                      <span className="truncate">{pill.displayName}</span>
                    </div>
                    <button 
                      onPointerDown={(e) => e.stopPropagation()} 
                      onClick={() => removePill('marks', pill.pillId)} 
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </DraggablePill>
              ))}
            </DroppableShelf>
          </div>
        </div>
      </div>
    </div>
  );
});
