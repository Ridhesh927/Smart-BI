import React from 'react';
import { 
  BarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend, Cell,
  PieChart as RePieChart, Pie as RePie, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BarChart2 } from "lucide-react";
import { CHART_COLORS } from './constants';

export const VisualRenderer = React.memo(({ activeSheet, activeDataset, queryLoading }) => {
  if (!activeSheet || !activeDataset) return null;

  const getPillKey = (pill) => pill?.field ?? pill?.name;

  const hasData = activeSheet.chartData && activeSheet.chartData.length > 0;
  const hasShelves = activeSheet.shelves.columns.length > 0 || activeSheet.shelves.rows.length > 0;
  const pieDimension = getPillKey(activeSheet.shelves.columns[0]);
  const pieMeasure = getPillKey(activeSheet.shelves.rows[0]);
  const pieData = activeSheet.type === 'pie' && hasData && pieDimension && pieMeasure
    ? (() => {
        const sorted = [...activeSheet.chartData]
          .filter(item => item?.[pieDimension] !== undefined && item?.[pieMeasure] !== undefined)
          .sort((a, b) => Number(b[pieMeasure] || 0) - Number(a[pieMeasure] || 0));

        if (sorted.length <= 8) return sorted;

        const visible = sorted.slice(0, 7);
        const othersValue = sorted
          .slice(7)
          .reduce((sum, item) => sum + Number(item?.[pieMeasure] || 0), 0);

        return [
          ...visible,
          { [pieDimension]: 'Others', [pieMeasure]: othersValue }
        ];
      })()
    : activeSheet.chartData;
  const showPieLabels = Array.isArray(pieData) && pieData.length <= 6;

  // 1. High-Fidelity Geographic Map Rendering
  if (activeSheet.type === 'map' && hasShelves) {
    return (
      <div className="flex-1 min-h-0 relative bg-slate-900/10 rounded-xl overflow-hidden isolate">
        {queryLoading && <LoadingOverlay />}
        {hasData ? (
          <div className="w-full h-full absolute inset-0 isolate">
             <MapContainer 
                center={[37.8, -96]} 
                zoom={4} 
                scrollWheelZoom={false}
                className="w-full h-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {activeSheet.chartData.map((point, idx) => (
                  point.lat && point.lng && (
                    <CircleMarker 
                      key={idx}
                      center={[point.lat, point.lng]}
                      radius={Math.sqrt(point[activeSheet.shelves.rows[0]?.name] || 100) / 2}
                      fillColor="#3b82f6"
                      color="#3b82f6"
                      weight={1}
                      opacity={0.8}
                      fillOpacity={0.4}
                    >
                      <Popup>
                        <div className="bg-slate-900 text-white p-2 text-xs rounded-lg border border-slate-700">
                          <div className="font-bold mb-1">{point[activeSheet.shelves.columns[0]?.name] || 'Location'}</div>
                          <div className="text-slate-400">
                            {activeSheet.shelves.rows[0]?.name}: {point[activeSheet.shelves.rows[0]?.name]}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                ))}
            </MapContainer>
          </div>
        ) : <EmptyState name={activeSheet.name} />}
      </div>
    );
  }

  // 2. Data Table Rendering
  if (activeSheet.type === 'table' && hasData) {
    return (
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {queryLoading && <LoadingOverlay />}
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
      </div>
    );
  }

  // 3. Standard Recharts Visualization Logic
  return (
    <div className="flex-1 min-h-0 relative">
      {queryLoading && <LoadingOverlay />}
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          {activeSheet.type === 'pie' ? (
             <RePieChart>
              <RePie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={5}
                dataKey={pieMeasure}
                nameKey={pieDimension}
                label={showPieLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
              >
                {pieData.map((entry, index) => (
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
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Legend />
              <Line type="monotone" dataKey={getPillKey(activeSheet.shelves.rows[0])} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
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
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Area type="monotone" dataKey={getPillKey(activeSheet.shelves.rows[0])} stroke="#3b82f6" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2} />
            </AreaChart>
          ) : activeSheet.type === 'scatter' ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey={getPillKey(activeSheet.shelves.rows[0])} 
                name={getPillKey(activeSheet.shelves.rows[0])} 
                stroke="#64748b" 
                fontSize={10} 
                label={{ value: getPillKey(activeSheet.shelves.rows[0]), position: 'bottom', fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                type="number" 
                dataKey={getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0])} 
                name={getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0])} 
                stroke="#64748b" 
                fontSize={10} 
                label={{ value: getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0]), angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
              />
              <ZAxis type="number" range={[60, 400]} />
              <ReTooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
              />
              <Legend />
              <Scatter 
                name={activeSheet.shelves.columns[0]?.name || 'Data Points'} 
                data={activeSheet.chartData} 
                fill="#3b82f6" 
                line={false}
                shape="circle"
              />
            </ScatterChart>
          ) : activeSheet.type === 'histogram' ? (
              <BarChart data={activeSheet.chartData} barCategoryGap={0} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Bar dataKey={getPillKey(activeSheet.shelves.rows[0])} fill="#3b82f6" stroke="#1e293b" />
            </BarChart>
          ) : (
            <BarChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
              <Bar dataKey={getPillKey(activeSheet.shelves.rows[0])} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : <EmptyState name={activeSheet.name} />}
    </div>
  );
});

// Sub-components for cleaner structure
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
       <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">Running Query...</p>
       </div>
    </div>
  );
}

function EmptyState({ name }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 font-sans">
      <BarChart2 size={48} className="mb-4 opacity-20" />
      <p className="text-sm font-medium opacity-50 text-center px-10 leading-relaxed">
        Drag dimensions to Columns and measures to Rows to visualize {name}
      </p>
    </div>
  );
}
