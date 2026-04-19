import React from 'react';
import { Link } from "react-router-dom";
import { ChevronLeft, Play, Save, Layers, Columns3, Rows3, X, Edit3, Palette } from "lucide-react";
import { DroppableShelf, DraggablePill } from './DndHelpers';

export function StudioHeader({ id, title, onRename, handleSave, saveLoading, showShowMe, setShowShowMe }) {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-4 flex items-center justify-between shrink-0 theme-transition">
      <div className="flex items-center gap-4">
        <Link to="/home" className="p-2 -ml-2 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="h-6 w-px bg-[var(--border)]"></div>
        <div 
          onClick={onRename}
          className="group cursor-pointer hover:bg-[var(--bg-surface)] px-3 py-1 rounded-lg transition-all border border-transparent hover:border-[var(--border)]"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors">
              {title || (id === 'new' ? 'Untitled Dashboard' : `Dashboard #${id}`)}
            </h1>
            <Edit3 size={12} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-tight">Click to rename</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
          <Play size={16} /> Preview
        </button>
        <button 
          onClick={handleSave}
          disabled={saveLoading}
          className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)] rounded-lg font-bold transition-all shadow-lg shadow-[var(--primary)]/20 ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saveLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            <>
              <Save size={16} /> Save
            </>
          )}
        </button>
        <div className="h-6 w-px bg-[var(--border)] mx-1"></div>
        <button 
          onClick={() => setShowShowMe(!showShowMe)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${showShowMe ? 'bg-[var(--primary)] text-[var(--bg-main)] shadow-lg shadow-[var(--primary)]/30' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]'}`}
        >
          <Layers size={16} /> Show Me
        </button>
      </div>
    </header>
  );
}

export function CanvasHeader({ activeSheet, removePill }) {
  return (
    <div className="shrink-0 bg-[var(--bg-sidebar)]/30 border-b border-[var(--border)] p-1.5 flex flex-col gap-1 shadow-inner theme-transition">
      {/* Columns Shelf */}
      <div className="flex items-center min-h-[36px]">
        <div className="w-24 px-3 flex items-center gap-2 text-[var(--text-muted)] shrink-0">
          <Columns3 size={14} />
          <span className="text-xs font-medium">Columns</span>
        </div>
        <DroppableShelf id="columns" className="flex-1 min-h-[32px] bg-[var(--bg-main)]/50 border border-[var(--border)] flex items-center px-1.5 gap-2 overflow-x-auto overflow-y-hidden rounded-md">
          {activeSheet.shelves.columns.map(pill => (
            <DraggablePill key={pill.pillId} pill={pill} sourceShelf="columns">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm shrink-0 ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]'}`}>
                <span className="truncate">{pill.displayName}</span>
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removePill('columns', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
              </div>
            </DraggablePill>
          ))}
          {activeSheet.shelves.columns.length === 0 && <div className="text-[10px] text-[var(--text-muted)] italic ml-2 opacity-50">Drop columns here</div>}
        </DroppableShelf>
      </div>

      {/* Rows Shelf */}
      <div className="flex items-center min-h-[36px]">
        <div className="w-24 px-3 flex items-center gap-2 text-[var(--text-muted)] shrink-0">
          <Rows3 size={14} />
          <span className="text-xs font-medium">Rows</span>
        </div>
        <DroppableShelf id="rows" className="flex-1 min-h-[32px] bg-[var(--bg-main)]/50 border border-[var(--border)] flex items-center px-1.5 gap-2 overflow-x-auto overflow-y-hidden rounded-md">
          {activeSheet.shelves.rows.map(pill => (
            <DraggablePill key={pill.pillId} pill={pill} sourceShelf="rows">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm shrink-0 ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]'}`}>
                <span className="truncate">{pill.displayName}</span>
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removePill('rows', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
              </div>
            </DraggablePill>
          ))}
          {activeSheet.shelves.rows.length === 0 && <div className="text-[10px] text-[var(--text-muted)] italic ml-2 opacity-50">Drop rows here</div>}
        </DroppableShelf>
      </div>
    </div>
  );
}
