import React from 'react';
import { Link } from "react-router-dom";
import { ChevronLeft, Play, Save, Layers, Columns3, Rows3, X } from "lucide-react";
import { DroppableShelf } from './DndHelpers';

export function StudioHeader({ id, handleSave, saveLoading, showShowMe, setShowShowMe }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/home" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="h-6 w-px bg-slate-800"></div>
        <div>
          <h1 className="text-sm font-medium text-white">{id === 'new' ? 'Untitled Dashboard' : `Dashboard #${id}`}</h1>
          <p className="text-xs text-slate-500">Unsaved changes</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Play size={16} /> Preview
        </button>
        <button 
          onClick={handleSave}
          disabled={saveLoading}
          className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        <div className="h-6 w-px bg-slate-800/50 mx-1"></div>
        <button 
          onClick={() => setShowShowMe(!showShowMe)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${showShowMe ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Layers size={16} /> Show Me
        </button>
      </div>
    </header>
  );
}

export function CanvasHeader({ activeSheet, removePill }) {
  return (
    <div className="shrink-0 bg-slate-900/30 border-b border-slate-800 p-1.5 flex flex-col gap-1 shadow-inner">
      {/* Columns Shelf */}
      <div className="flex items-center min-h-[36px]">
        <div className="w-24 px-3 flex items-center gap-2 text-slate-500 shrink-0">
          <Columns3 size={14} />
          <span className="text-xs font-medium">Columns</span>
        </div>
        <DroppableShelf id="columns" className="flex-1 min-h-[32px] bg-slate-950/50 border border-slate-800 flex items-center px-1.5 gap-2 overflow-x-auto overflow-y-hidden">
           {activeSheet.shelves.columns.map(pill => (
             <div key={pill.pillId} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm shrink-0 ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                <span className="truncate">{pill.displayName}</span>
                <button onClick={() => removePill('columns', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
             </div>
           ))}
           {activeSheet.shelves.columns.length === 0 && <div className="text-[10px] text-slate-700 italic ml-2">Drop columns here</div>}
        </DroppableShelf>
      </div>

      {/* Rows Shelf */}
      <div className="flex items-center min-h-[36px]">
        <div className="w-24 px-3 flex items-center gap-2 text-slate-500 shrink-0">
          <Rows3 size={14} />
          <span className="text-xs font-medium">Rows</span>
        </div>
        <DroppableShelf id="rows" className="flex-1 min-h-[32px] bg-slate-950/50 border border-slate-800 flex items-center px-1.5 gap-2 overflow-x-auto overflow-y-hidden">
           {activeSheet.shelves.rows.map(pill => (
             <div key={pill.pillId} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm shrink-0 ${pill.type === 'measure' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                <span className="truncate">{pill.displayName}</span>
                <button onClick={() => removePill('rows', pill.pillId)} className="hover:text-white transition-colors"><X size={10} /></button>
             </div>
           ))}
           {activeSheet.shelves.rows.length === 0 && <div className="text-[10px] text-slate-700 italic ml-2">Drop rows here</div>}
        </DroppableShelf>
      </div>
    </div>
  );
}
