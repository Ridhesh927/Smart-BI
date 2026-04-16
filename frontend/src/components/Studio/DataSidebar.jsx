import React from 'react';
import { Database, Layers, Search, Table, MoreVertical, Plus } from "lucide-react";
import { DraggableField } from './DndHelpers';

export function DataSidebar({ 
  activeLeftTab, 
  setActiveLeftTab, 
  searchQuery, 
  setSearchQuery, 
  loading, 
  dataFields, 
  aiPrompt, 
  setAiPrompt, 
  handleAiGenerate, 
  isAiGenerating 
}) {
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
            <Layers size={14} /> AI Assistant
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
        ) : (
          <div className="flex-1 p-4 animate-in slide-in-from-left-4 duration-300">
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
                    placeholder="e.g. Create a side-by-side bar chart showing Literacy rates and District names"
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
                     The assistant will automatically populate the shelves (Rows, Columns, Marks) based on your request.
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
