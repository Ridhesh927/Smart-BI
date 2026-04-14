import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Save, Play, Settings2, BarChart2, PieChart, LineChart, Table, Move, Plus } from "lucide-react";

export default function Studio() {
  const { id } = useParams();
  const [elements, setElements] = useState([
    { id: 'el-1', type: 'line', title: 'Monthly Revenue', gridSpan: 'col-span-8 row-span-4' },
    { id: 'el-2', type: 'stat', title: 'Total Users', value: '45,231', gridSpan: 'col-span-4 row-span-2' },
    { id: 'el-3', type: 'stat', title: 'Active Sessions', value: '1,234', gridSpan: 'col-span-4 row-span-2' },
  ]);

  const widgets = [
    { type: 'bar', icon: <BarChart2 size={24} />, label: 'Bar Chart' },
    { type: 'line', icon: <LineChart size={24} />, label: 'Line Chart' },
    { type: 'pie', icon: <PieChart size={24} />, label: 'Pie Chart' },
    { type: 'table', icon: <Table size={24} />, label: 'Data Table' },
    { type: 'stat', icon: <span className="font-bold text-xl">#</span>, label: 'Stat Card' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 font-sans">
      {/* Studio Header */}
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
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            <Save size={16} /> Save
          </button>
        </div>
      </header>

      {/* Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Components */}
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Components</h2>
            <div className="grid grid-cols-2 gap-2">
              {widgets.map(w => (
                <div 
                  key={w.type} 
                  className="glass flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 hover:border-blue-500 cursor-grab hover:bg-slate-800/80 transition-colors group text-slate-400 hover:text-blue-400"
                  draggable
                >
                  <div className="mb-2">{w.icon}</div>
                  <span className="text-xs font-medium">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Data Sources</h2>
            <button className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-colors">
              <Plus size={16} /> Connect Dataset
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-950 p-8 overflow-y-auto relative">
          {/* Grid implementation for DND layout */}
          <div className="grid grid-cols-12 gap-4 min-h-full">
            
            {elements.map((el) => (
              <div 
                key={el.id} 
                className={`group relative glass rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors ${el.gridSpan} flex flex-col overflow-hidden`}
              >
                {/* Drag handle */}
                <div className="absolute top-2 left-2 p-1.5 bg-black/40 backdrop-blur-md rounded-md opacity-0 group-hover:opacity-100 cursor-move transition-opacity z-10 text-slate-400 hover:text-white">
                  <Move size={14} />
                </div>
                
                {/* Settings handle */}
                <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-md opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10 text-slate-400 hover:text-white">
                  <Settings2 size={14} />
                </div>

                <div className="p-4 border-b border-slate-800/50">
                  <h3 className="font-medium text-slate-200 text-sm">{el.title}</h3>
                </div>
                
                <div className="flex-1 p-4 flex items-center justify-center">
                  {el.type === 'stat' && (
                    <div className="text-4xl font-bold text-white tracking-tight">{el.value}</div>
                  )}
                  {el.type === 'line' && (
                    <div className="w-full h-full min-h-[200px] flex items-end justify-between gap-2 px-4 pb-2">
                       {/* Fake chart visualization */}
                       {[40, 70, 45, 90, 65, 85, 120, 100, 140].map((h, i) => (
                         <div key={i} className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500 border-t-2 border-blue-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty droppable area hint */}
            <div className="col-span-12 row-span-4 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center text-slate-500">
              <Plus size={32} className="mb-2 opacity-50" />
              <p className="font-medium">Drag components here</p>
            </div>

          </div>
        </div>
        
        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 size={16} /> Properties
            </h2>
          </div>
          <div className="p-4 flex flex-col items-center justify-center h-48 text-center text-slate-500 border-b border-slate-800">
             <p className="text-sm">Select an element on the canvas to configure its properties and data mapping.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
