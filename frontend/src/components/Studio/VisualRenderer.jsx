import React from 'react';
import { 
  BarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend, Cell,
  PieChart as RePieChart, Pie as RePie, AreaChart, Area
} from 'recharts';
import { BarChart2 } from "lucide-react";
import { CHART_COLORS } from './constants';

export function VisualRenderer({ activeSheet, activeDataset, queryLoading }) {
  if (!activeSheet || !activeDataset) return null;

  return (
    <div className="flex-1 min-h-0 relative">
      {/* Loading Overlay */}
      {queryLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
           <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">Running Query...</p>
           </div>
        </div>
      )}

      {activeSheet.chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {activeSheet.type === 'pie' ? (
            <RePieChart>
              <RePie
                data={activeSheet.chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey={activeSheet.shelves.rows[0]?.name}
                nameKey={activeSheet.shelves.columns[0]?.name}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {activeSheet.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </RePie>
              <ReTooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend iconType="circle" />
            </RePieChart>
          ) : activeSheet.type === 'line' ? (
            <ReLineChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={activeSheet.shelves.columns[0]?.name} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Legend />
              <Line type="monotone" dataKey={activeSheet.shelves.rows[0]?.name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </ReLineChart>
          ) : activeSheet.type === 'area' ? (
            <AreaChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={activeSheet.shelves.columns[0]?.name} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Area type="monotone" dataKey={activeSheet.shelves.rows[0]?.name} stroke="#3b82f6" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2} />
            </AreaChart>
          ) : activeSheet.type === 'table' ? (
            <div className="w-full h-full overflow-auto bg-slate-900/20 rounded-xl p-2 custom-scrollbar">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
                  <tr>
                    {Object.keys(activeSheet.chartData[0] || {}).map(key => (
                      <th key={key} className="px-3 py-2 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSheet.chartData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 border-b border-slate-800/50 text-slate-300">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <BarChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={activeSheet.shelves.columns[0]?.name} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Bar dataKey={activeSheet.shelves.rows[0]?.name} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : activeSheet.shelves.columns.length > 0 && activeSheet.shelves.rows.length > 0 && activeSheet.type === 'map' ? (
         <div className="w-full h-full absolute inset-0 rounded-b-xl overflow-hidden z-0">
            {/* Map content placeholder - could be extracted later to a separate MapRenderer if needed */}
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 italic">Map view is being rendered...</div>
         </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 font-sans">
          <BarChart2 size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium opacity-50 text-center px-10 leading-relaxed">Drag dimensions to Columns and measures to Rows to visualize {activeSheet.name}</p>
        </div>
      )}
    </div>
  );
}
