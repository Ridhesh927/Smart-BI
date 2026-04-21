import React, { useMemo } from 'react';
import { 
  BarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend, Cell,
  PieChart as RePieChart, Pie as RePie, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, LabelList, Treemap, ComposedChart
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BarChart2 } from "lucide-react";
import { CHART_COLORS } from './constants';

const getPillKey = (pill) => pill?.field ?? pill?.name;

const CustomTooltip = ({ active, payload, label, shelves }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] p-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-2 border-b border-[var(--border)] pb-1.5">
        {label || 'Data Details'}
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color || entry.fill || 'var(--primary)' }} />
               <span className="text-[10px] text-[var(--text-muted)] truncate">{entry.name}:</span>
            </div>
            <span className="text-[10px] font-bold text-white whitespace-nowrap">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
        {/* All Mark Roles in Tooltip */}
        {shelves?.marks?.map(p => {
            // Avoid showing fields already in the primary payload (measures/columns)
            if (payload.some(entry => entry.dataKey === getPillKey(p))) return null;

            const val = payload[0]?.payload?.[getPillKey(p)];
            if (val === undefined) return null;
            
            return (
              <div key={p.pillId} className="flex items-center justify-between gap-4 pt-1 border-t border-[var(--border)]/50 mt-1 first:border-0 first:pt-0 first:mt-0">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] text-[var(--text-muted)] italic">{p.displayName}:</span>
                </div>
                <span className="text-[10px] font-medium text-[var(--text-main)]">
                   {typeof val === 'number' ? val.toLocaleString() : String(val)}
                </span>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export const VisualRenderer = React.memo(({ activeSheet, activeDataset, queryLoading }) => {
  // 1. Hooks (Always at top)
  const colorMap = useMemo(() => {
    if (!activeSheet?.shelves?.marks || !activeSheet?.chartData) return {};
    const colorPill = activeSheet.shelves.marks.find(p => p.role === 'color');
    const colorKey = colorPill ? getPillKey(colorPill) : null;
    if (!colorPill || colorPill.type !== 'dimension') return {};
    
    const uniqueValues = [...new Set(activeSheet.chartData.map(d => String(d[colorKey])))];
    const mapping = {};
    uniqueValues.forEach((val, i) => {
        mapping[val] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return mapping;
  }, [activeSheet]);

  // Early return if no data/config
  if (!activeSheet || !activeDataset) return null;

  const hasData = activeSheet.chartData && activeSheet.chartData.length > 0;
  const hasShelves = activeSheet.shelves.columns.length > 0 || activeSheet.shelves.rows.length > 0;
  
  // Marks Extraction
  const colorPill = activeSheet.shelves.marks.find(p => p.role === 'color');
  const sizePill = activeSheet.shelves.marks.find(p => p.role === 'size');
  const labelPill = activeSheet.shelves.marks.find(p => p.role === 'label');
  const colorKey = colorPill ? getPillKey(colorPill) : null;
  const sizeKey = sizePill ? getPillKey(sizePill) : null;
  const labelKey = labelPill ? getPillKey(labelPill) : null;

  // Pie Logic (Define here so it's available for standard logic)
  const pieDimension = getPillKey(activeSheet.shelves.columns[0]);
  const pieMeasure = getPillKey(activeSheet.shelves.rows[0]);
  const pieData = activeSheet.type === 'pie' && hasData && pieDimension && pieMeasure
    ? (() => {
        const sorted = [...activeSheet.chartData]
          .filter(item => item?.[pieDimension] !== undefined && item?.[pieMeasure] !== undefined)
          .sort((a, b) => Number(b[pieMeasure] || 0) - Number(a[pieMeasure] || 0));
        if (sorted.length <= 8) return sorted;
        const visible = sorted.slice(0, 7);
        const othersValue = sorted.slice(7).reduce((sum, item) => sum + Number(item?.[pieMeasure] || 0), 0);
        return [...visible, { [pieDimension]: 'Others', [pieMeasure]: othersValue }];
      })()
    : activeSheet.chartData;
  const showPieLabels = Array.isArray(pieData) && pieData.length <= 6;

  // 1. High-Fidelity Geographic Map Rendering
  if (activeSheet.type === 'map' && hasShelves) {
    return (
      <div className="flex-1 min-h-0 relative bg-[var(--bg-main)]/10 rounded-xl overflow-hidden isolate">
        {queryLoading && <LoadingOverlay />}
        {hasData ? (
          <div className="w-full h-full absolute inset-0 isolate">
             <MapContainer center={[37.8, -96]} zoom={4} scrollWheelZoom={false} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                {activeSheet.chartData.map((point, idx) => (
                  point.lat && point.lng && (
                    <CircleMarker 
                      key={idx}
                      center={[point.lat, point.lng]}
                      radius={Math.sqrt(point[activeSheet.shelves.rows[0]?.name] || 100) / 2}
                      fillColor={colorKey ? (colorMap[point[colorKey]] || 'var(--primary)') : 'var(--primary)'}
                      color={colorKey ? (colorMap[point[colorKey]] || 'var(--primary)') : 'var(--primary)'}
                      weight={1} opacity={0.8} fillOpacity={0.4}
                    >
                      <Popup>
                        <div className="bg-[var(--bg-sidebar)] text-white p-2 text-xs rounded-lg border border-[var(--border)]">
                          <div className="font-bold mb-1">{point[activeSheet.shelves.columns[0]?.name] || 'Location'}</div>
                          <div className="text-[var(--text-muted)]">{activeSheet.shelves.rows[0]?.name}: {point[activeSheet.shelves.rows[0]?.name]}</div>
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
    const isHighlight = activeSheet.subType === 'highlight';
    
    // Compute column-wise max for highlighting
    const colMaxs = {};
    if (isHighlight) {
      Object.keys(activeSheet.chartData[0] || {}).forEach(key => {
        const values = activeSheet.chartData.map(d => Number(d[key])).filter(v => !isNaN(v));
        if (values.length > 0) colMaxs[key] = Math.max(...values);
      });
    }

    return (
      <div className="flex-1 min-h-0 relative overflow-hidden group/table">
        {queryLoading && <LoadingOverlay />}
        <div className="w-full h-full overflow-auto bg-[var(--bg-main)]/20 rounded-xl p-2 slim-scrollbar scroll-smooth border border-[var(--border)]/50">
          <table className="w-full text-left text-[11px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-[var(--bg-sidebar)] z-10">
              <tr>
                {Object.keys(activeSheet.chartData[0] || {}).map(key => (
                  <th key={key} className="px-3 py-2.5 border-b border-[var(--border)] text-[var(--text-muted)] font-bold uppercase tracking-wider bg-[var(--bg-sidebar)]/95 backdrop-blur-sm first:rounded-tl-lg last:rounded-tr-lg">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSheet.chartData.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface)]/30 transition-colors duration-150">
                  {Object.entries(row).map(([key, val], j) => {
                    const numVal = Number(val);
                    const isNum = !isNaN(numVal) && typeof val !== 'boolean';
                    const max = colMaxs[key];
                    const ratio = isHighlight && isNum && max ? (numVal / max) : 0;
                    
                    return (
                      <td 
                        key={j} 
                        className={`px-3 py-2 border-b border-[var(--border)]/30 text-[var(--text-main)]/90 transition-all duration-300 ${isHighlight && isNum ? 'font-medium' : ''}`}
                        style={isHighlight && isNum ? {
                          backgroundColor: `rgba(59, 130, 246, ${0.05 + ratio * 0.45})`,
                          color: ratio > 0.7 ? '#fff' : 'var(--text-main)',
                         } : {}}
                      >
                        {isNum ? numVal.toLocaleString() : String(val)}
                      </td>
                    );
                  })}
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
    <div className="flex-1 min-h-0 relative text-[var(--text-muted)] theme-transition">
      {queryLoading && <LoadingOverlay />}
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          {activeSheet.type === 'pie' ? (
             <RePieChart>
              <RePie
                data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={5}
                dataKey={pieMeasure} nameKey={pieDimension}
                label={showPieLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </RePie>
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Legend iconType="circle" />
            </RePieChart>
          ) : activeSheet.type === 'line' ? (
            <ReLineChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
              {activeSheet.subType === 'dual' && activeSheet.shelves.rows.length > 1 && (
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
              )}
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Legend />
              {activeSheet.shelves.rows.map((rowPill, idx) => (
                <Line 
                  key={rowPill.pillId}
                  yAxisId={(activeSheet.subType === 'dual' && idx === 1) ? 'right' : 'left'}
                  type="monotone" 
                  dataKey={getPillKey(rowPill)} 
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: CHART_COLORS[idx % CHART_COLORS.length] }} 
                  activeDot={{ r: 6 }}
                  name={rowPill.displayName}
                >
                  {labelPill && <LabelList dataKey={labelKey} position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />}
                </Line>
              ))}
            </ReLineChart>
          ) : activeSheet.type === 'area' ? (
            <AreaChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Area type="monotone" dataKey={getPillKey(activeSheet.shelves.rows[0])} stroke="#3b82f6" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2}>
                {labelPill && <LabelList dataKey={labelKey} position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />}
              </Area>
            </AreaChart>
          ) : activeSheet.type === 'scatter' ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                type="number" dataKey={getPillKey(activeSheet.shelves.rows[0])} name={getPillKey(activeSheet.shelves.rows[0])} 
                stroke="var(--text-muted)" fontSize={10} label={{ value: getPillKey(activeSheet.shelves.rows[0]), position: 'bottom', fill: 'var(--text-muted)', fontSize: 10 }}
              />
              <YAxis 
                type="number" dataKey={getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0])} 
                name={getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0])} 
                stroke="var(--text-muted)" fontSize={10} label={{ value: getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0]), angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }}
              />
              <ZAxis type="number" dataKey={sizeKey || undefined} range={[60, 400]} />
              <ReTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Legend />
              <Scatter name={activeSheet.shelves.columns[0]?.name || 'Data Points'} data={activeSheet.chartData} fill="var(--primary)" line={false} shape="circle">
                {hasData && activeSheet.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorKey ? (colorMap[entry[colorKey]] || 'var(--primary)') : 'var(--primary)'} />
                ))}
                {labelKey && <LabelList dataKey={labelKey} position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />}
              </Scatter>
            </ScatterChart>
          ) : activeSheet.type === 'treemap' ? (
            <Treemap
              data={activeSheet.chartData}
              dataKey={getPillKey(activeSheet.shelves.rows[0])}
              nameKey={getPillKey(activeSheet.shelves.columns[0])}
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="var(--primary)"
            >
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
            </Treemap>
          ) : activeSheet.type === 'heatmap' ? (
            <BarChart data={activeSheet.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
               <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
               <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
               <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
               <Bar dataKey={getPillKey(activeSheet.shelves.rows[0])} radius={[4, 4, 0, 0]}>
                 {activeSheet.chartData.map((entry, index) => {
                    const value = entry[getPillKey(activeSheet.shelves.rows[0])];
                    const max = Math.max(...activeSheet.chartData.map(d => d[getPillKey(activeSheet.shelves.rows[0])]));
                    const opacity = 0.3 + (value / max) * 0.7;
                    return <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={opacity} />;
                 })}
               </Bar>
            </BarChart>
          ) : activeSheet.type === 'circle' ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} />
              <YAxis dataKey={getPillKey(activeSheet.shelves.rows[0])} stroke="var(--text-muted)" fontSize={10} />
              <ZAxis type="number" dataKey={getPillKey(activeSheet.shelves.rows[1]) || getPillKey(activeSheet.shelves.rows[0])} range={[100, 1000]} />
              <ReTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Legend />
              <Scatter name={activeSheet.shelves.columns[0]?.name} data={activeSheet.chartData} fill="var(--primary)" fillOpacity={0.6}>
                {activeSheet.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          ) : activeSheet.type === 'histogram' ? (
            <BarChart data={activeSheet.chartData} barCategoryGap={0} barGap={0} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
               <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
               <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
               <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
               <Bar dataKey={getPillKey(activeSheet.shelves.rows[0])} fill="var(--primary)" fillOpacity={0.8} stroke="var(--bg-main)" strokeWidth={1} radius={0} />
            </BarChart>
          ) : activeSheet.type === 'gantt' ? (
            <BarChart 
              data={activeSheet.chartData} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={10} hide />
              <YAxis 
                type="category" 
                dataKey={getPillKey(activeSheet.shelves.columns[0])} 
                stroke="var(--text-muted)" 
                fontSize={10} 
                width={100}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Bar 
                dataKey="ganttRange" 
                fill="var(--primary)" 
                radius={[4, 4, 4, 4]} 
                barSize={20}
              >
                {activeSheet.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart 
              data={activeSheet.chartData} 
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              layout={activeSheet.subType === 'horizontal' ? 'vertical' : 'horizontal'}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              
              {activeSheet.subType === 'horizontal' ? (
                <>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                </>
              ) : (
                <>
                  <XAxis dataKey={getPillKey(activeSheet.shelves.columns[0])} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                </>
              )}
              
              <ReTooltip content={<CustomTooltip shelves={activeSheet.shelves} />} />
              <Legend />
              
              {activeSheet.shelves.rows.map((rowPill, idx) => (
                <Bar 
                  key={rowPill.pillId}
                  dataKey={getPillKey(rowPill)} 
                  fill={colorKey ? undefined : (idx === 0 ? "url(#barGradient)" : CHART_COLORS[idx % CHART_COLORS.length])} 
                  radius={activeSheet.subType === 'horizontal' ? [0, 6, 6, 0] : [6, 6, 0, 0]} 
                  barSize={activeSheet.subType === 'horizontal' ? 20 : 32}
                  stackId={activeSheet.subType === 'stacked' ? 'a' : undefined}
                  name={rowPill.displayName}
                >
                  {colorKey && idx === 0 && hasData && activeSheet.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorMap[entry[colorKey]] || 'var(--primary)'} />
                  ))}
                  {labelPill && <LabelList dataKey={labelKey} position={activeSheet.subType === 'horizontal' ? "right" : "top"} style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />}
                </Bar>
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : <EmptyState name={activeSheet.name} />}
    </div>
  );
});

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
       <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest animate-pulse">Running Query...</p>
       </div>
    </div>
  );
}

function EmptyState({ name }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] font-sans theme-transition">
      <BarChart2 size={48} className="mb-4 opacity-20" />
      <p className="text-sm font-medium opacity-50 text-center px-10 leading-relaxed">Drag dimensions to Columns and measures to Rows to visualize {name}</p>
    </div>
  );
}
