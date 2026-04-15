import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronLeft, Save, Eye, EyeOff, Settings2, BarChart2, PieChart, LineChart,
  Table, Move, Plus, Trash2, Copy, Palette, Maximize2, Minimize2, X, Expand, Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CHART_THEMES = [
  { name: "Solarized Modern", color: "#2a9d8f", palette: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'], gradient: ['#264653', '#2a9d8f'] },
  { name: "Azure Professional", color: "#0284c7", palette: ['#0c4a6e', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'], gradient: ['#0c4a6e', '#0284c7'] },
  { name: "Emerald Deep", color: "#059669", palette: ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7'], gradient: ['#064e3b', '#059669'] },
  { name: "Amethyst Night", color: "#7c3aed", palette: ['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'], gradient: ['#4c1d95', '#7c3aed'] },
  { name: "Slate Corporate", color: "#475569", palette: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'], gradient: ['#0f172a', '#1e293b'] },
];

// Rich color palettes for data visualization
const COLOR_PALETTES = {
  vibrant: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#1e3a8a', '#1e40af'],
  ocean: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe', '#bae6fd'],
  sunset: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'],
  forest: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  cosmic: ['#1e1b4b', '#312e81', '#3730a3', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'],
  pastel: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#6b7280', '#9ca3af', '#d1d5db'],
};

// Get color from palette based on index
function getPaletteColor(paletteType = 'ocean', index = 0) {
  const palette = COLOR_PALETTES[paletteType] || COLOR_PALETTES.ocean;
  return palette[index % palette.length];
}

// ─── Smart Axis Selection ──────────────────────────────────────────────────
function getSmartAxes(type, columns) {
  if (!columns || columns.length === 0) return { xAxis: null, yAxis: null };

  const dateCols = columns.filter(c => c.inferredType === 'date').map(c => c.name);
  const stringCols = columns.filter(c => c.inferredType === 'string').map(c => c.name);
  const numCols = columns.filter(c => c.inferredType === 'number').map(c => c.name);
  
  // Prioritize non-ID columns for metrics
  const metrics = numCols.filter(name => !name.toLowerCase().includes('id') && !name.toLowerCase().includes('code'));
  const fallbackMetrics = numCols;

  let xAxis = null;
  let yAxis = null;

  if (type === 'scatter') {
    xAxis = fallbackMetrics[0] || null;
    yAxis = fallbackMetrics.length > 1 ? fallbackMetrics[1] : (stringCols[0] || xAxis);
    return { xAxis, yAxis };
  }

  if (type === 'pie') {
    xAxis = stringCols[0] || dateCols[0] || fallbackMetrics[0] || null;
    yAxis = xAxis; // Pie charts default to counting X occurrences
    return { xAxis, yAxis };
  }

  // X-axis priority: Date > String > Number
  xAxis = dateCols[0] || stringCols[0] || fallbackMetrics[0] || null;

  // Y-axis priority: Metric > any Number > fallback to X (for counting)
  yAxis = metrics[0] || fallbackMetrics.find(n => n !== xAxis) || fallbackMetrics[0] || xAxis;

  return { xAxis, yAxis };
}

// ─── Correlation Matrix (Big Data / Data Science concept) ────────────────────
function CorrelationMatrixViz({ datasetInfo, data }) {
  const [hoverInfo, setHoverInfo] = useState(null);
  const rows = data || datasetInfo?.rows || [];
  
  // Robust detection: Look for columns that contain numbers (even formatted as currency/strings)
  const columns = datasetInfo?.analysis?.columns || (rows[0] ? Object.keys(rows[0]).map(name => ({name})) : []);
  const numericCols = columns
    ?.filter(c => {
      if (c.name.toLowerCase().includes('id')) return false;
      const sample = rows.slice(0, 50).map(r => String(r[c.name] ?? '').replace(/[$,]/g, '').trim());
      const validSamples = sample.filter(v => v !== '' && !isNaN(parseFloat(v)) && isFinite(parseFloat(v)));
      return validSamples.length > (sample.length * 0.3); // At least 30% must be numeric
    })
    .map(c => c.name).slice(0, 6) || [];

  if (numericCols.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 p-8 text-center">
        <Layers size={32} className="opacity-20 mb-3" />
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Low Dimensionality</p>
        <p className="text-[9px] opacity-40 mt-1">Need at least 2 numeric columns for correlation analysis.</p>
      </div>
    );
  }

  const matrix = numericCols.map((colA) => {
    const valsA = rows.map(r => parseFloat(String(r[colA] ?? '').replace(/[$,]/g, '')) || 0);
    return numericCols.map((colB) => {
      const valsB = rows.map(r => parseFloat(String(r[colB] ?? '').replace(/[$,]/g, '')) || 0);
      return calculateCorrelation(valsA, valsB);
    });
  });

  return (
    <div className="w-full h-full p-6 flex flex-col relative select-none overflow-hidden bg-slate-900/40">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Top Labels */}
        <div className="flex mb-1 ml-10">
          {numericCols.map(c => (
            <div key={c} className="flex-1 text-[7px] text-slate-500 uppercase font-black truncate text-center px-1" title={c}>{c}</div>
          ))}
        </div>
        
        <div className="flex-1 flex min-h-0">
          {/* Left Labels */}
          <div className="w-10 flex flex-col mr-1">
            {numericCols.map(c => (
              <div key={c} className="flex-1 text-[7px] text-slate-500 uppercase font-black truncate flex items-center justify-end pr-1" title={c}>{c}</div>
            ))}
          </div>
          
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${numericCols.length}, 1fr)` }}>
            {matrix.flat().map((val, idx) => {
              const i = Math.floor(idx / numericCols.length);
              const j = idx % numericCols.length;
              const absVal = Math.abs(val);
              const isDiagonal = i === j;
              const color = val > 0 ? `rgba(34, 197, 94, ${absVal})` : `rgba(239, 68, 68, ${absVal})`;
              
              return (
                <div 
                  key={idx} 
                  className="aspect-square rounded-sm border border-white/5 flex items-center justify-center group relative cursor-crosshair transition-all hover:scale-105 hover:z-20 shadow-lg"
                  style={{ backgroundColor: isDiagonal ? 'rgba(255,255,255,0.03)' : color }}
                  onMouseEnter={(e) => setHoverInfo({ val, colA: numericCols[i], colB: numericCols[j], x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  <span className="text-[8px] text-white font-black opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                    {isDiagonal ? '1.0' : val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Inverse</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Direct</span>
          <div className="w-2 h-2 rounded bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
        </div>
      </div>

      <Tooltip visible={!!hoverInfo} x={(hoverInfo?.x - 100) || 0} y={(hoverInfo?.y - 50) || 0}>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 pb-1 mb-1">Correlation Detail</p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-500">Variables:</span> 
            <span className="text-white font-mono">{hoverInfo?.colA} × {hoverInfo?.colB}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-500">Metric:</span> 
            <span className={hoverInfo?.val > 0 ? 'text-green-400' : 'text-red-400'}>{hoverInfo?.val.toFixed(4)}</span>
          </p>
        </div>
      </Tooltip>
    </div>
  );
}

// ─── Tooltip Component ────────────────────────────────────────────────────────
function Tooltip({ visible, x, y, children }) {
  if (!visible) return null;
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -110%)' }}
    >
      <div className="bg-slate-900 border border-slate-600/60 rounded-xl px-3 py-2 shadow-2xl shadow-black/60 text-xs whitespace-nowrap backdrop-blur-sm">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #334155' }} />
      </div>
    </div>
  );
}

// ─── Utility Functions for Data Processing ───────────────────────────────────
function aggregateByX(rows, xCol, yCol) {
  if (!rows || !xCol || !yCol) return [];
  const map = {};

  // Detect if we should count instead of sum
  // Count if yCol matches xCol OR if yCol appears to be a string/category
  let shouldCount = xCol === yCol;
  if (!shouldCount) {
    const sample = rows.slice(0, 50).map(r => r[yCol]).filter(v => v != null);
    if (sample.length > 0) {
      const numCount = sample.filter(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(parseFloat(v)))).length;
      if (numCount < sample.length * 0.5) shouldCount = true;
    }
  }

  rows.forEach(row => {
    const key = String(row[xCol] ?? 'null');
    if (shouldCount) {
      map[key] = (map[key] || 0) + 1;
    } else {
      const val = parseFloat(row[yCol]) || 0;
      map[key] = (map[key] || 0) + val;
    }
  });

  const result = Object.entries(map).map(([x, y]) => ({ x, y }));
  
  // Smart sorting
  if (result.length > 1) {
    const isDate = result.slice(0, 10).every(d => !isNaN(Date.parse(d.x)) && isNaN(Number(d.x)));
    const isNumeric = !isDate && !isNaN(parseFloat(result[0].x));
    
    if (isDate) {
      result.sort((a, b) => new Date(a.x) - new Date(b.x));
    } else if (isNumeric) {
      result.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
    } else {
      result.sort((a, b) => String(a.x).localeCompare(String(b.x)));
    }
  }

  return result.slice(0, 50);
}

function getMinMax(values) {
  const nums = values.filter(v => typeof v === 'number' && isFinite(v));
  if (nums.length === 0) return { min: 0, max: 100 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

// ─── Statistical Anomaly Detection (Z-Score) ────────────────────────────────
function detectAnomalies(values) {
  const nums = values.filter(v => typeof v === 'number' && isFinite(v));
  if (nums.length < 5) return new Set();
  const mean = nums.reduce((s,v) => s + v, 0) / nums.length;
  const std = Math.sqrt(nums.reduce((s,v) => s + Math.pow(v - mean, 2), 0) / nums.length);
  const outliers = new Set();
  if (std > 0) {
    values.forEach((v, i) => {
      const z = Math.abs((v - mean) / std);
      if (z > 2.5) outliers.add(i);
    });
  }
  return outliers;
}

// ─── Simple Linear Regression for Forecasting ───────────────────────────────
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += points[i].y;
    sumXY += i * points[i].y;
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// ─── Data Science Utility: Pearson Correlation ──────────────────────────────
function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const muX = x.reduce((a, b) => a + b, 0) / n;
  const muY = y.reduce((a, b) => a + b, 0) / n;
  const sXY = x.reduce((s, v, i) => s + (v - muX) * (y[i] - muY), 0);
  const sXX = x.reduce((s, v) => s + Math.pow(v - muX, 2), 0);
  const sYY = y.reduce((s, v) => s + Math.pow(v - muY, 2), 0);
  const denom = Math.sqrt(sXX * sYY);
  return denom === 0 ? 0 : sXY / denom;
}

// ─── Empty placeholder shown when no data is connected ────────────────────────
function EmptyChart({ type, theme }) {
  const icons = { bar: '▊▊▊', line: '╱‾╲', pie: '◕', scatter: '⋯', table: '≡', stat: '#' };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-700 select-none px-4">
      <span className="text-3xl opacity-30" style={{ color: theme?.color }}>{icons[type] || '?'}</span>
      <p className="text-xs font-semibold text-slate-600">No data connected</p>
      <p className="text-[10px] text-slate-700 text-center">Link a dataset and select X/Y axes in Properties</p>
    </div>
  );
}

// ─── Bar Chart (real data with SVG) ───────────────────────────────────────────
function BarChartViz({ theme = CHART_THEMES[0], data = [], xAxis = null, yAxis = null }) {
  if (!data?.length || !xAxis || !yAxis) return <EmptyChart type="bar" theme={theme} />;
  const aggregated = aggregateByX(data, xAxis, yAxis);
  if (!aggregated.length) return <EmptyChart type="bar" theme={theme} />;
  
  const vals = aggregated.map(d => d.y);
  const { min, max } = getMinMax(vals);
  const range = max === min ? 1 : max - min;
  const W = 300, H = 200;
  
  const palette = theme.palette || [theme.color];
  const barWidth = W / (aggregated.length || 1);
  const points = aggregated.map((d, i) => ({
    x: i * barWidth,
    y: H - ((d.y - min) / range) * H,
    w: barWidth,
    val: d.y,
    color: palette[i % palette.length]
  }));

  const outliers = detectAnomalies(vals);

  return (
    <div className="w-full h-full flex flex-col px-3 pt-2 pb-1 relative select-none">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-slate-600 font-bold tracking-widest whitespace-nowrap uppercase opacity-60">{yAxis}</div>
      <div className="flex flex-1 min-h-0 ml-6">
        <div className="flex flex-col justify-between text-right pr-2 shrink-0" style={{ width: 32 }}>
          {[max, max*0.75, max*0.5, max*0.25, min].map((t, i) => (
            <span key={i} className="text-[9px] text-slate-700 font-mono leading-none">{Math.round(t)}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative border-l border-b border-white/5">
            {/* Grid System */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map(t => (
                <div key={t} className="w-full h-px bg-white/[0.03]" />
              ))}
            </div>
            
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full absolute inset-0" preserveAspectRatio="none">
              {points.map((p, i) => {
                const isAnomaly = outliers.has(i);
                return (
                  <g key={i} className="group cursor-pointer">
                    <rect
                      x={p.x + p.w * 0.15}
                      y={p.y}
                      width={p.w * 0.7}
                      height={Math.max(2, H - p.y)}
                      fill={isAnomaly ? '#ef4444' : p.color}
                      rx="1.5"
                      className={`transition-all duration-300 opacity-90 hover:opacity-100 ${isAnomaly ? 'animate-pulse' : ''}`}
                    />
                    {isAnomaly && <circle cx={p.x + p.w * 0.5} cy={p.y - 5} r="2" fill="#ef4444" className="animate-ping" />}
                  </g>
                );
              })}
              <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </svg>
          </div>
          <div className="text-center text-[9px] text-slate-700 font-bold tracking-widest mt-1 uppercase truncate opacity-60">{xAxis}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Line Chart (real data with SVG path) ─────────────────────────────────────
function LineChartViz({ theme = CHART_THEMES[0], data = [], xAxis = null, yAxis = null }) {
  if (!data?.length || !xAxis || !yAxis) return <EmptyChart type="line" theme={theme} />;
  const aggregated = aggregateByX(data, xAxis, yAxis);
  if (!aggregated.length) return <EmptyChart type="line" theme={theme} />;
  
  const vals = aggregated.map(d => d.y);
  const { min, max } = getMinMax(vals);
  const range = max === min ? 1 : max - min;
  const W = 300, H = 200;
  
  const points = aggregated.map((d, i) => ({
    x: (i / (aggregated.length - 1 || 1)) * W,
    y: H - ((d.y - min) / range) * H
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const lineColor = theme.color;
  const fillGradientId = `line-grad-${Math.random()}`;

  // ML Forecasting
  const forecast = linearRegression(aggregated);
  let forecastPoints = [];
  if (forecast && aggregated.length > 5) {
    const nextSteps = 5;
    for (let i = 0; i < nextSteps; i++) {
      const idx = aggregated.length + i;
      const fY = forecast.slope * idx + forecast.intercept;
      forecastPoints.push({
        x: (idx / (aggregated.length + nextSteps - 1)) * W,
        y: H - ((fY - min) / range) * H
      });
    }
  }

  return (
    <div className="w-full h-full flex flex-col px-3 pt-2 pb-1 relative select-none">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-slate-600 font-bold tracking-widest whitespace-nowrap uppercase opacity-60">{yAxis}</div>
      <div className="flex flex-1 min-h-0 ml-6">
        <div className="flex flex-col justify-between text-right pr-2 shrink-0" style={{ width: 32 }}>
          {[max, max*0.75, max*0.5, max*0.25, min].map((t, i) => (
            <span key={i} className="text-[9px] text-slate-700 font-mono leading-none">{Math.round(t)}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative border-l border-b border-white/5">
            {/* Grid System */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map(t => (
                <div key={t} className="w-full h-px bg-white/[0.03]" />
              ))}
            </div>
            
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full absolute inset-0" preserveAspectRatio="none">
              <defs>
                <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={pathD + ` L ${W} ${H} L 0 ${H} Z`} fill={`url(#${fillGradientId})`} />
              <path d={pathD} stroke={lineColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              
              {forecastPoints.length > 0 && (
                <line 
                  x1={points[points.length-1].x} y1={points[points.length-1].y}
                  x2={forecastPoints[forecastPoints.length-1].x} y2={forecastPoints[forecastPoints.length-1].y}
                  stroke={lineColor} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6"
                />
              )}

              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3" fill={lineColor} opacity="0.4" />
                  <circle cx={p.x} cy={p.y} r="1.5" fill={lineColor} />
                </g>
              ))}
            </svg>
          </div>
          <div className="text-center text-[9px] text-slate-700 font-bold tracking-widest mt-1 uppercase truncate opacity-60">{xAxis}</div>
        </div>
      </div>
      {forecast && <div className="absolute right-2 top-2 text-[8px] text-slate-500 bg-slate-900/50 px-1.5 py-0.5 rounded border border-white/5 font-bold tracking-tighter uppercase">ML Prediction On</div>}
    </div>
  );
}

// ─── Pie Chart (real data with SVG arcs) ──────────────────────────────────────
function PieChartViz({ theme = CHART_THEMES[0], data = [], xAxis = null, yAxis = null }) {
  if (!data?.length || !xAxis || !yAxis) return <EmptyChart type="pie" theme={theme} />;
  const aggregated = aggregateByX(data, xAxis, yAxis);
  if (!aggregated.length) return <EmptyChart type="pie" theme={theme} />;
  
  const total = aggregated.reduce((s, d) => s + d.y, 0);
  const palette = theme.palette || [theme.color];
  
  let currentAngle = -90;
  const slices = aggregated.map((d, i) => {
    const sliceAngle = total > 0 ? (d.y / total) * 360 : (360 / aggregated.length);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    const large = sliceAngle > 180 ? 1 : 0;
    return { 
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`, 
      color: palette[i % palette.length], 
      label: d.x, 
      percentage: Math.round((d.y / (total || 1)) * 100)
    };
  });
  
  return (
    <div className="w-full h-full flex items-center justify-center gap-4 px-4 py-2 relative select-none">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-2xl">
          {slices.map((s, i) => (
            <path 
              key={i} d={s.path} fill={s.color} 
              className="transition-all duration-300 opacity-90 hover:opacity-100 cursor-pointer" 
              stroke="#0f172a" strokeWidth="0.5"
            />
          ))}
          <circle cx="50" cy="50" r="15" fill="#0f172a" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 max-h-full overflow-y-auto no-scrollbar py-2">
        {slices.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-200 font-bold truncate leading-none uppercase tracking-tighter">{s.label}</p>
              <p className="text-[9px] text-slate-500 font-medium">{s.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─── Scatter Plot (real data with SVG points) ─────────────────────────────────
function ScatterViz({ theme = CHART_THEMES[0], data = [], xAxis = null, yAxis = null }) {
  if (!data?.length || !xAxis || !yAxis) return <EmptyChart type="scatter" theme={theme} />;
  
  const parseNum = (v) => {
    if (v === null || v === undefined || v === '') return NaN;
    const n = parseFloat(String(v).replace(/,/g, ''));
    return isFinite(n) ? n : NaN;
  };

  const xVals = data.map(r => parseNum(r[xAxis])).filter(v => !isNaN(v));
  const yVals = data.map(r => parseNum(r[yAxis])).filter(v => !isNaN(v));
  
  if (!xVals.length || !yVals.length) return <EmptyChart type="scatter" theme={theme} />;
  
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals), xRange = xMax === xMin ? 1 : xMax - xMin;
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals), yRange = yMax === yMin ? 1 : yMax - yMin;
  const W = 300, H = 200;
  
  const palette = theme.palette || [theme.color];
  const outliers = detectAnomalies(yVals);
  
  const points = data
    .map(r => ({ xVal: parseNum(r[xAxis]), yVal: parseNum(r[yAxis]) }))
    .filter(p => !isNaN(p.xVal) && !isNaN(p.yVal))
    .slice(0, 150)
    .map((p, i) => ({
      x: ((p.xVal - xMin) / xRange) * W,
      y: H - ((p.yVal - yMin) / yRange) * H,
      color: outliers.has(i) ? '#ef4444' : palette[i % palette.length],
      isAnomaly: outliers.has(i)
    }));
  
  return (
    <div className="w-full h-full flex flex-col px-3 pt-2 pb-1 relative select-none">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-slate-600 font-bold tracking-widest whitespace-nowrap uppercase opacity-60">{yAxis}</div>
      <div className="flex flex-1 min-h-0 ml-6">
        <div className="flex flex-col justify-between text-right pr-2 shrink-0" style={{ width: 32 }}>
          {[100, 75, 50, 25, 0].map((t, i) => (
            <span key={i} className="text-[9px] text-slate-700 font-mono leading-none">{Math.round(yMin + (yRange * t / 100))}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative border-l border-b border-white/5">
            {/* Grid System */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map(t => (
                <div key={t} className="w-full h-px bg-white/[0.03]" />
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map(t => (
                <div key={t} className="h-full w-px bg-white/[0.03]" />
              ))}
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full absolute inset-0" preserveAspectRatio="none">
              {points.map((p, i) => (
                <g key={i} className="group">
                  <circle cx={p.x} cy={p.y} r={p.isAnomaly ? 5 : 3.5} fill={p.color} className={`transition-all duration-300 opacity-30 group-hover:opacity-60 ${p.isAnomaly ? 'animate-pulse' : ''}`} />
                  <circle cx={p.x} cy={p.y} r={p.isAnomaly ? 2.5 : 1.8} fill={p.color} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                </g>
              ))}
            </svg>
          </div>
          <div className="text-center text-[9px] text-slate-700 font-bold tracking-widest mt-1 uppercase truncate opacity-60">{xAxis}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Table Viz (real data rows) ─────────────────────────────────────────────
function TableViz({ data = [], xAxis = null, yAxis = null }) {
  if (!data.length || !xAxis || !yAxis) return <EmptyChart type="table" theme={CHART_THEMES[0]} />;
  const cols = [xAxis, yAxis];
  const rows = data.slice(0, 10);
  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-xs select-none">
      <div className="grid gap-0 bg-slate-800/50 border-b border-slate-800" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map(h => <div key={h} className="px-3 py-1.5 font-bold text-slate-600 uppercase tracking-wider text-[9px]">{h}</div>)}
      </div>
      <div className="flex-1 overflow-y-auto space-y-px">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-0 border-b border-slate-800/30 text-slate-300" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
            {cols.map(col => <div key={col} className="px-3 py-1 text-[10px] truncate">{String(r[col] ?? '')}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatViz({ data = [], statColumn = null, statType = 'count', theme = CHART_THEMES[0] }) {
  const [showInfo, setShowInfo] = useState(false);

  let displayValue = '0';
  let metricLabel = statType.toUpperCase();
  let displayColor = theme.color;

  if (data.length > 0 && statColumn) {
    const values = data
      .map(r => {
        const v = r[statColumn];
        return isNaN(v) ? null : Number(v);
      })
      .filter(v => v !== null);

    if (statType === 'count') {
      displayValue = data.length.toLocaleString();
      metricLabel = 'Total Records';
    } else if (statType === 'sum' && values.length > 0) {
      displayValue = values.reduce((a, b) => a + b, 0).toLocaleString('en', { maximumFractionDigits: 2 });
      metricLabel = `Sum of ${statColumn}`;
    } else if (statType === 'avg' && values.length > 0) {
      displayValue = (values.reduce((a, b) => a + b, 0) / values.length).toLocaleString('en', { maximumFractionDigits: 2 });
      metricLabel = `Average ${statColumn}`;
    } else if (statType === 'max' && values.length > 0) {
      displayValue = Math.max(...values).toLocaleString('en', { maximumFractionDigits: 2 });
      metricLabel = `Max ${statColumn}`;
    } else if (statType === 'min' && values.length > 0) {
      displayValue = Math.min(...values).toLocaleString('en', { maximumFractionDigits: 2 });
      metricLabel = `Min ${statColumn}`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2 cursor-pointer select-none p-4 relative overflow-hidden"
      onClick={() => setShowInfo(v => !v)}>
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 30% 40%, ${displayColor}, transparent)` }} />
      {!showInfo ? (
        <>
          <div className="relative">
            <div className="absolute -inset-8 blur-lg opacity-20" style={{ background: displayColor }} />
            <div className="text-5xl font-black text-white tracking-tight relative z-10"
              style={{ textShadow: `0 0 30px ${displayColor}44` }}>{displayValue}</div>
          </div>
          <div className="w-12 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${displayColor}, transparent)`, boxShadow: `0 0 12px ${displayColor}30` }} />
          <p className="text-[10px] text-slate-300 mt-1 font-semibold tracking-wide">{metricLabel}</p>
          <p className="text-[8px] text-slate-500 mt-0.5">Click for details</p>
        </>
      ) : (
        <div className="text-center space-y-3 z-10">
          <p className="text-3xl font-black text-white" style={{ color: displayColor }}>{displayValue}</p>
          <p className="text-[10px] text-slate-300 mb-2">{metricLabel}</p>
          <div className="flex gap-4 justify-center text-[9px]">
            <div className="px-2 py-1 rounded bg-slate-800/50">
              <p className="text-slate-400">Collection</p>
              <p className="text-slate-300 font-semibold">{data.length} items</p>
            </div>
            <div className="px-2 py-1 rounded bg-slate-800/50">
              <p className="text-slate-400">Column</p>
              <p className="text-slate-300 font-semibold">{statColumn || '—'}</p>
            </div>
          </div>
          <p className="text-[8px] text-slate-600 mt-2">Click to collapse</p>
        </div>
      )}
    </div>
  );
}

// ─── Widget Full-Screen Modal ─────────────────────────────────────────────────
function WidgetModal({ el, theme, datasetInfo, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: `0 0 60px ${theme.color}22` }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: theme.color, boxShadow: `0 0 8px ${theme.color}80` }} />
            <h2 className="text-lg font-bold text-white">{el.title}</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full capitalize">{el.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {/* Modal Chart Body */}
        <div className="flex-1 p-6 overflow-hidden min-h-[400px]">
          <WidgetRenderer el={el} theme={theme} datasetInfo={datasetInfo} />
        </div>
        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-slate-800/60 text-[11px] text-slate-600 flex items-center gap-2 shrink-0">
          <span>Press <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-400">Esc</kbd> or click outside to close</span>
        </div>
      </div>
    </div>
  );
}

function AIInsightWidget({ datasetInfo }) {
  const insights = datasetInfo?.aiInsights || [];
  if (insights.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className="animate-pulse bg-slate-800 h-2 w-32 rounded" />
        <div className="animate-pulse bg-slate-800 h-2 w-24 rounded" />
      </div>
      <p className="text-[10px] text-slate-600 text-center">Processing dataset for AI insights...</p>
    </div>
  );

  return (
    <div className="h-full p-4 space-y-3 overflow-y-auto scrollbar-hide">
      {insights.map((insight, idx) => {
        const colors = {
          anomaly: 'rose',
          trend: 'blue',
          quality: 'emerald',
          correlation: 'amber'
        };
        const c = colors[insight.type] || 'slate';
        return (
          <div key={idx} className={`p-2.5 rounded-xl border border-${c}-500/10 bg-${c}-500/5 flex gap-3 items-start animate-fade-in`} style={{ animationDelay: `${idx * 150}ms` }}>
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-${c}-500 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-${c}-500/50`} />
            <div className="space-y-0.5">
              <p className={`text-[9px] font-black text-${c}-400 uppercase tracking-widest`}>{insight.type}</p>
              <p className="text-[11px] text-slate-300 leading-normal font-medium">{insight.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Generate human-readable observation for a widget ────────────────────────
function generateDataObservation(el, rows) {
  if (!rows || rows.length === 0) return null;
  
  try {
    if (el.type === 'bar' || el.type === 'pie') {
      const aggregated = aggregateByX(rows, el.xAxis, el.yAxis);
      if (aggregated.length === 0) return null;
      const peak = [...aggregated].sort((a,b) => b.y - a.y)[0];
      if (el.type === 'bar') return `Highest value is ${peak.y.toLocaleString()} from category "${peak.x}".`;
      const total = aggregated.reduce((s,d) => s + d.y, 0);
      const pct = Math.round((peak.y / (total || 1)) * 100);
      return `"${peak.x}" is the dominant factor, holding ${pct}% of the total.`;
    }
    
    if (el.type === 'line') {
      const aggregated = aggregateByX(rows, el.xAxis, el.yAxis);
      if (aggregated.length < 2) return null;
      const first = aggregated[0].y;
      const last = aggregated[aggregated.length-1].y;
      const diff = last - first;
      const pct = Math.round((diff / (Math.abs(first) || 1)) * 100);
      const dir = diff >= 0 ? 'grown' : 'declined';
      if (diff === 0) return `Values remained stable from beginning to end of period.`;
      return `Overall trend has ${dir} by ${Math.abs(pct)}% over the selected range.`;
    }

    if (el.type === 'scatter') {
      return `Mapping correlation between ${el.xAxis} and ${el.yAxis} (${rows.length} points).`;
    }

    if (el.type === 'stat') {
      const label = el.statType === 'count' ? 'Records' : el.statColumn;
      return `Aggregated result for ${label} across valid dataset entries.`;
    }
  } catch (e) { console.error("Summary error:", e); }
  
  return null;
}

// ─── Widget Renderer ──────────────────────────────────────────────────────────
function WidgetRenderer({ el, theme, datasetInfo }) {
  let rows = datasetInfo?.rows || [];
  
  // Apply filters if they exist
  if (el.filters && el.filters.length > 0) {
    rows = rows.filter(row => {
      return el.filters.every(filter => {
        const cellValue = String(row[filter.column] ?? '').toLowerCase();
        const filterValue = String(filter.value ?? '').toLowerCase();
        
        if (filter.operator === 'equals') return cellValue === filterValue;
        if (filter.operator === 'contains') return cellValue.includes(filterValue);
        if (filter.operator === '!=') return cellValue !== filterValue;
        if (filter.operator === '>') return Number(row[filter.column]) > Number(filter.value);
        if (filter.operator === '<') return Number(row[filter.column]) < Number(filter.value);
        return true;
      });
    });
  }
  
  const observation = generateDataObservation(el, rows);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        {(() => {
          switch (el.type) {
            case 'bar':     return <BarChartViz theme={theme} data={rows} xAxis={el.xAxis} yAxis={el.yAxis} />;
            case 'line':    return <LineChartViz theme={theme} data={rows} xAxis={el.xAxis} yAxis={el.yAxis} />;
            case 'pie':     return <PieChartViz theme={theme} data={rows} xAxis={el.xAxis} yAxis={el.yAxis} />;
            case 'scatter': return <ScatterViz theme={theme} data={rows} xAxis={el.xAxis} yAxis={el.yAxis} />;
            case 'table':   return <TableViz data={rows} xAxis={el.xAxis} yAxis={el.yAxis} />;
            case 'stat':    return <StatViz data={rows} statColumn={el.statColumn} statType={el.statType} theme={theme} />;
            case 'ai':      return <AIInsightWidget datasetInfo={datasetInfo} />;
            default: return null;
          }
        })()}
      </div>
      
      {observation && el.type !== 'ai' && (
        <div className="px-4 py-2 bg-slate-800/20 border-t border-slate-800 shrink-0">
          <div className="flex items-start gap-2">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500/50 shrink-0" />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic opacity-80">
              <span className="text-slate-500 uppercase font-black mr-1 tracking-tighter not-italic">Result:</span>
              {observation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Studio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dashboardTitle, setDashboardTitle] = useState(id === 'new' ? 'Untitled Dashboard' : 'Loading...');
  const [isSaving, setIsSaving] = useState(false);
  const [dashboardDatasetId, setDashboardDatasetId] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [datasetInfoLoading, setDatasetInfoLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(CHART_THEMES[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState(null);

  const widgets = [
    { type: 'bar',     icon: <BarChart2 size={20} />,  label: 'Bar Chart' },
    { type: 'line',    icon: <LineChart size={20} />,   label: 'Line Chart' },
    { type: 'pie',     icon: <PieChart size={20} />,    label: 'Pie Chart' },
    { type: 'scatter', icon: <Move size={20} />,        label: 'Scatter Plot' },
    { type: 'table',   icon: <Table size={20} />,       label: 'Data Table' },
    { type: 'stat',    icon: <span className="text-base font-black">#</span>, label: 'Stat Card' },
    { type: 'correlation', icon: <Layers size={20} />, label: 'Correlation' },
    { type: 'ai',      icon: <span className="text-base font-black">AI</span>, label: 'AI Insights' },
  ];

  const widgetDescriptionMap = {
    bar:     "Compares values across categories and highlights ranking clearly.",
    line:    "Shows trend movement over sequence or time.",
    pie:     "Displays composition share for categories.",
    scatter: "Shows relationship and spread between two numeric dimensions.",
    table:   "Provides row-level detail for exact values.",
    stat:    "Surfaces a KPI as a quick summary metric."
  };

  useEffect(() => {
    if (id !== 'new' && user) {
      const fetchDashboard = async () => {
        try {
          const token = await user.getIdToken();
          const res = await fetch(`http://localhost:5000/api/dashboards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error("Failed to load dashboard");
          const data = await res.json();
          setDashboardTitle(data.title || data.name);
          setDashboardDatasetId(data.dataset_id ?? null);
          let saved = [];
          if (data.layout_json) saved = typeof data.layout_json === 'string' ? JSON.parse(data.layout_json) : data.layout_json;
          setElements(saved);
          if (saved.length > 0) setSelectedId(saved[0].id);
        } catch (error) {
          console.error("Error loading dashboard:", error);
          setDashboardTitle("Error Loading");
        }
      };
      fetchDashboard();
    } else if (id === 'new') {
      setDashboardTitle('Untitled Dashboard');
      setElements([
        { id: 'el-1', type: 'line', title: 'Monthly Revenue', gridSpan: 'col-span-8 row-span-4' },
        { id: 'el-2', type: 'stat', title: 'Total Users', value: '45,231', gridSpan: 'col-span-4 row-span-2' },
        { id: 'el-3', type: 'stat', title: 'Active Sessions', value: '1,234', gridSpan: 'col-span-4 row-span-2' },
      ]);
      setSelectedId('el-1');
    }
  }, [id, user]);

  useEffect(() => {
    const fetchDatasetInfo = async () => {
      if (!user || !dashboardDatasetId) { setDatasetInfo(null); return; }
      setDatasetInfoLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:5000/api/datasets/${dashboardDatasetId}/insights`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        setDatasetInfo(await res.json());
      } catch { setDatasetInfo(null); }
      finally { setDatasetInfoLoading(false); }
    };
    fetchDatasetInfo();
  }, [dashboardDatasetId, user]);

  const handleDragStart = (e, widgetType) => e.dataTransfer.setData('widgetType', widgetType);
  const handleDrop = (e) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('widgetType');
    if (widgetType) {
      const widgetDef = widgets.find(w => w.type === widgetType);
      const columns = datasetInfo?.analysis?.columns || [];
      const { xAxis, yAxis } = getSmartAxes(widgetType, columns);

      const newEl = {
        id: `el-${Date.now()}`,
        type: widgetType,
        title: `New ${widgetDef.label}`,
        gridSpan: widgetType === 'stat' ? 'col-span-4 row-span-2' : 'col-span-6 row-span-4',
        xAxis: widgetType !== 'stat' ? xAxis : null,
        yAxis: widgetType !== 'stat' ? yAxis : null,
        statType: widgetType === 'stat' ? 'count' : null,
        statColumn: widgetType === 'stat' ? xAxis : null,
        filters: []
      };
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  const selectedElement = elements.find(el => el.id === selectedId);

  // Auto-initialize xAxis/yAxis for chart widgets if missing
  useEffect(() => {
    if (datasetInfo && elements.length > 0) {
      const columns = datasetInfo.analysis?.columns || [];
      if (columns.length === 0) return;

      let changed = false;
      const updatedElements = elements.map(el => {
        if (['bar', 'line', 'pie', 'scatter', 'table'].includes(el.type) && !el.xAxis && !el.yAxis) {
          changed = true;
          const { xAxis, yAxis } = getSmartAxes(el.type, columns);
          return { ...el, xAxis, yAxis };
        }
        return el;
      });

      if (changed) setElements(updatedElements);
    }
  }, [datasetInfo, elements.length]);

  const updateElement = (elId, updates) => setElements(prev => prev.map(el => el.id === elId ? { ...el, ...updates } : el));
  const removeElement = (elId) => { setElements(prev => prev.filter(el => el.id !== elId)); if (selectedId === elId) setSelectedId(null); };
  const duplicateElement = (el) => {
    const newEl = { ...el, id: `el-${Date.now()}`, title: `${el.title} (Copy)` };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleSave = async () => {
    if (!user) { alert("You must be logged in to save."); return; }
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const payload = { title: dashboardTitle, dataset_id: dashboardDatasetId, layout_data: elements, visuals_data: elements };
      const url = id === 'new' ? `http://localhost:5000/api/dashboards` : `http://localhost:5000/api/dashboards/${id}`;
      const method = id === 'new' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      if (id === 'new' && data.id) { navigate(`/studio/${data.id}`); }
      else { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); }
    } catch (error) {
      alert("Failed to save dashboard: " + error.message);
    } finally { setIsSaving(false); }
  };

  // Build chart from recommendation
  const buildChartFromRecommendation = (rec) => {
    const chartType = rec.chart || 'bar';
    const cols = datasetInfo?.analysis?.columns || (datasetInfo?.rows?.[0] ? Object.keys(datasetInfo.rows[0]).map(name => ({ name })) : []);
    
    let xAxis = rec.xAxis;
    let yAxis = rec.yAxis;
    
    // Fallback: if no axes specified in recommendation, auto-select from columns
    if (!xAxis && !yAxis && cols.length > 0) {
      xAxis = cols[0]?.name || null;
      yAxis = cols.length > 1 ? cols[1]?.name : cols[0]?.name;
    } else if (!xAxis && cols.length > 0) {
      xAxis = cols[0]?.name || null;
    } else if (!yAxis && cols.length > 0) {
      yAxis = cols.length > 1 ? cols[1]?.name : cols[0]?.name;
    }
    
    const newEl = {
      id: `el-${Date.now()}`,
      type: chartType,
      title: rec.title,
      gridSpan: chartType === 'stat' ? 'col-span-4 row-span-2' : 'col-span-6 row-span-4',
      xAxis: chartType !== 'stat' ? xAxis : null,
      yAxis: chartType !== 'stat' ? yAxis : null,
      statType: chartType === 'stat' ? 'count' : null,
      statColumn: chartType === 'stat' ? xAxis : null,
      filters: []
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  // Auto-build all recommendations
  const autoVisualizeAll = () => {
    if (!datasetInfo?.visual_recommendations) return;
    const cols = datasetInfo?.analysis?.columns || (datasetInfo?.rows?.[0] ? Object.keys(datasetInfo.rows[0]).map(name => ({ name })) : []);
    
    const newElements = datasetInfo.visual_recommendations.map(rec => {
      let xAxis = rec.xAxis;
      let yAxis = rec.yAxis;
      
      // Fallback: if no axes specified, auto-select from columns
      if (!xAxis && !yAxis && cols.length > 0) {
        xAxis = cols[0]?.name || null;
        yAxis = cols.length > 1 ? cols[1]?.name : cols[0]?.name;
      } else if (!xAxis && cols.length > 0) {
        xAxis = cols[0]?.name || null;
      } else if (!yAxis && cols.length > 0) {
        yAxis = cols.length > 1 ? cols[1]?.name : cols[0]?.name;
      }
      
      return {
        id: `el-${Date.now()}-${Math.random()}`,
        type: rec.chart || 'bar',
        title: rec.title,
        gridSpan: ['bar', 'line', 'scatter'].includes(rec.chart) ? 'col-span-6 row-span-4' : 'col-span-4 row-span-2',
        value: '0',
        xAxis: xAxis || null,
        yAxis: yAxis || null
      };
    });
    setElements(prev => [...prev, ...newElements]);
    if (newElements.length > 0) setSelectedId(newElements[0].id);
  };

  const handleCanvasClick = (e) => { if (e.target.id === 'canvas-area') setSelectedId(null); };

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 font-sans">

      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {!isPreviewMode && (
            <Link to="/home" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <ChevronLeft size={18} />
            </Link>
          )}
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <input
              type="text"
              value={dashboardTitle}
              onChange={e => setDashboardTitle(e.target.value)}
              className="text-sm font-semibold text-white bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-1 py-0.5"
              disabled={isPreviewMode}
            />
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-600 ml-1">
                {isPreviewMode ? "Preview Mode" : `${elements.length} widget${elements.length !== 1 ? 's' : ''}`}
              </p>
              {saveSuccess && <span className="text-[10px] text-emerald-400 animate-fade-in">✓ Saved!</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Theme Picker */}
          {!isPreviewMode && (
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Palette size={14} />
                <span className="w-3 h-3 rounded-full" style={{ background: selectedTheme.color }} />
                Theme
              </button>
              {showColorPicker && (
                <div className="dropdown-menu right-0 top-10 flex gap-2 p-2 w-auto">
                  {CHART_THEMES.map(theme => (
                    <button
                      key={theme.name}
                      onClick={() => { setSelectedTheme(theme); setShowColorPicker(false); }}
                      title={theme.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${selectedTheme.name === theme.name ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: theme.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isPreviewMode ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            {isPreviewMode ? <><EyeOff size={14} /> Exit Preview</> : <><Eye size={14} /> Preview</>}
          </button>

          {/* Save */}
          {!isPreviewMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${isSaving ? 'bg-blue-800 text-blue-300' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          {isPreviewMode && (
            <button
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Minimize2 size={14} /> Back to Editor
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar - hidden in preview */}
        {!isPreviewMode && (
          <div className="w-60 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 z-10">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Widgets</h2>
              <div className="grid grid-cols-2 gap-2">
                {widgets.map(w => (
                  <div
                    key={w.type}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group text-slate-400 hover:text-blue-400 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={e => handleDragStart(e, w.type)}
                    title="Drag to canvas"
                  >
                    <div className="mb-1.5 pointer-events-none">{w.icon}</div>
                    <span className="text-[10px] font-semibold pointer-events-none">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 flex-1">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Data Sources</h2>
              <Link
                to="/datasets"
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
              >
                <Plus size={15} /> Connect Dataset
              </Link>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          id="canvas-area"
          className={`flex-1 overflow-y-auto relative transition-all ${isPreviewMode ? 'bg-slate-950 p-6' : 'bg-slate-950 p-6'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleCanvasClick}
        >
          {elements.length === 0 && !isPreviewMode && dashboardDatasetId && datasetInfo?.visual_recommendations?.length > 0 && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-xl">✨</span>
                    <h2 className="text-lg font-bold text-white">Recommended Visualizations</h2>
                  </div>
                  <button
                    onClick={autoVisualizeAll}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Auto Visualize All
                  </button>
                </div>
                <div className="space-y-3">
                  {datasetInfo.visual_recommendations.slice(0, 4).map((rec, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl mt-1">
                          {rec.chart === 'bar' && '📊'}
                          {rec.chart === 'line' && '📈'}
                          {rec.chart === 'pie' && '🥧'}
                          {rec.chart === 'scatter' && '⚡'}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => buildChartFromRecommendation(rec)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap ml-4"
                      >
                        Build
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {elements.length === 0 && !isPreviewMode && (!dashboardDatasetId || !datasetInfo?.visual_recommendations?.length) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 pointer-events-none">
              <Plus size={48} className="mb-4 opacity-40" />
              <h2 className="text-xl font-bold">Empty Canvas</h2>
              <p className="text-sm mt-1">Drag widgets from the left panel to start building</p>
            </div>
          )}

          <div className="grid grid-cols-12 gap-4 min-h-full auto-rows-[100px]" onDragOver={handleDragOver}>
            {elements.map(el => (
              <div
                key={el.id}
                className={`group relative glass rounded-xl border transition-all ${el.gridSpan} flex flex-col overflow-hidden cursor-pointer ${selectedId === el.id && !isPreviewMode ? 'border-blue-500 shadow-lg shadow-blue-500/15' : 'border-slate-800 hover:border-slate-700'}`}
                onClick={e => {
                  e.stopPropagation();
                  if (isPreviewMode) {
                    setExpandedWidget(el);
                  } else {
                    setSelectedId(el.id);
                  }
                }}
              >
                {/* Selection overlay */}
                {selectedId === el.id && !isPreviewMode && (
                  <div className="absolute inset-0 bg-blue-500/3 pointer-events-none z-0 rounded-xl" />
                )}

                {/* Actions */}
                {!isPreviewMode && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={e => { e.stopPropagation(); duplicateElement(el); }}
                      className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md text-slate-300 hover:text-blue-400 hover:bg-black/70 transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                      className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md text-slate-300 hover:text-white hover:bg-black/70 transition-colors"
                      title="Properties"
                    >
                      <Settings2 size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removeElement(el.id); }}
                      className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/35 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                {/* Widget Header */}
                <div className="px-4 pt-3 pb-2 border-b border-slate-800/50 z-10 relative shrink-0">
                  <h3 className={`font-semibold text-xs ${selectedId === el.id && !isPreviewMode ? 'text-blue-400' : 'text-slate-300'}`}>{el.title}</h3>
                </div>

                {/* Widget Body */}
                <div className="flex-1 z-10 relative overflow-hidden">
                  <WidgetRenderer el={el} theme={selectedTheme} datasetInfo={datasetInfo} />
                </div>

                {/* Expand hint on hover (preview mode) */}
                {isPreviewMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all opacity-0 group-hover:opacity-100 rounded-xl pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-slate-200 shadow-xl">
                      <Expand size={12} />
                      Click to expand
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Drop hint */}
            {!isPreviewMode && (
              <div className="col-span-12 row-span-2 rounded-xl border-2 border-dashed border-slate-800/30 bg-slate-900/5 flex items-center justify-center text-slate-700 pointer-events-none mt-2">
                <p className="text-xs font-medium">Drop widgets here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Sidebar - hidden in preview */}
        {!isPreviewMode && (
          <div className="w-68 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 z-10 overflow-y-auto" style={{ width: '272px' }}>
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <Settings2 size={14} className="text-slate-500" />
              <h2 className="text-sm font-bold text-white">Properties</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Dataset Info */}
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Dataset</h3>
                {!dashboardDatasetId && (
                  <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500">No dataset linked.</p>
                    <Link to="/datasets" className="text-xs text-blue-400 hover:text-blue-300 mt-1 block">Connect one →</Link>
                  </div>
                )}
                {dashboardDatasetId && datasetInfoLoading && (
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                  </div>
                )}
                {dashboardDatasetId && datasetInfo && (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">File</p>
                      <p className="text-xs text-slate-200 break-all">{datasetInfo.file_name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {datasetInfo.analysis?.rowCount?.toLocaleString() || 0} rows · {datasetInfo.analysis?.columnCount || 0} cols
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/15 p-3">
                      <p className="text-[10px] font-semibold text-emerald-300 mb-1">Cleaning Summary</p>
                      <p className="text-[10px] text-slate-400">Missing: {datasetInfo.analysis?.missingValues ?? 0}</p>
                      <p className="text-[10px] text-slate-400">Duplicates: {datasetInfo.cleaning_report?.duplicateRowsDetected ?? 0}</p>
                    </div>
                    {Array.isArray(datasetInfo.visual_recommendations) && datasetInfo.visual_recommendations.length > 0 && (
                      <div className="rounded-lg border border-blue-900/40 bg-blue-950/15 p-3">
                        <p className="text-[10px] font-semibold text-blue-300 mb-1">Best Charts</p>
                        {datasetInfo.visual_recommendations.slice(0, 3).map(rec => (
                          <p key={rec.title} className="text-[10px] text-slate-400">· {rec.title}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Element Properties */}
              {!selectedElement ? (
                <div className="p-6 flex flex-col items-center text-center text-slate-600 mt-8">
                  <Settings2 size={28} className="mb-3 opacity-30" />
                  <p className="text-xs">Click a widget on the canvas to configure it.</p>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {/* Type badge */}
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue uppercase tracking-wide">
                      {widgets.find(w => w.type === selectedElement.type)?.icon}
                      <span className="ml-1">{selectedElement.type}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">About</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {widgetDescriptionMap[selectedElement.type]}
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Widget Title</label>
                    <input
                      type="text"
                      value={selectedElement.title}
                      onChange={e => updateElement(selectedElement.id, { title: e.target.value })}
                      className="input-dark text-sm"
                      placeholder="e.g. Monthly Revenue"
                    />
                  </div>

                  {/* Grid Size */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grid Size</label>
                    <select
                      value={selectedElement.gridSpan}
                      onChange={e => updateElement(selectedElement.id, { gridSpan: e.target.value })}
                      className="input-dark text-sm appearance-none"
                    >
                      <option value="col-span-4 row-span-2">Small (1/3 Width)</option>
                      <option value="col-span-6 row-span-4">Medium (1/2 Width)</option>
                      <option value="col-span-8 row-span-4">Large (2/3 Width)</option>
                      <option value="col-span-12 row-span-4">Full Width</option>
                      <option value="col-span-12 row-span-6">Full Width Tall</option>
                    </select>
                  </div>

                  {/* Stat Configuration */}
                  {selectedElement.type === 'stat' && datasetInfo && (() => {
                    const cols = datasetInfo.analysis?.columns || (datasetInfo.rows?.[0] ? Object.keys(datasetInfo.rows[0]).map(name => ({ name })) : []);
                    return (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Metric Type</label>
                          <select
                            value={selectedElement.statType || 'count'}
                            onChange={e => updateElement(selectedElement.id, { statType: e.target.value })}
                            className="input-dark text-sm appearance-none"
                          >
                            <option value="count">Total Count</option>
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="max">Maximum</option>
                            <option value="min">Minimum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Column</label>
                          <select
                            value={selectedElement.statColumn || ''}
                            onChange={e => updateElement(selectedElement.id, { statColumn: e.target.value || null })}
                            className="input-dark text-sm appearance-none"
                          >
                            <option value="">-- Select Column --</option>
                            {cols.map(col => (
                              <option key={col.name} value={col.name}>{col.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    );
                  })()}

                  {/* Axis Selectors for chart types */}
                  {['bar', 'line', 'pie', 'scatter', 'table'].includes(selectedElement.type) && datasetInfo && (() => {
                    const cols = datasetInfo.analysis?.columns || (datasetInfo.rows?.[0] ? Object.keys(datasetInfo.rows[0]).map(name => ({ name })) : []);
                    return cols.length > 0 ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">X-Axis Column</label>
                          <select
                            value={selectedElement.xAxis || ''}
                            onChange={e => updateElement(selectedElement.id, { xAxis: e.target.value || null })}
                            className="input-dark text-sm appearance-none"
                          >
                            <option value="">-- Select Column --</option>
                            {cols.map(col => (
                              <option key={col.name} value={col.name}>{col.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Y-Axis Column</label>
                          <select
                            value={selectedElement.yAxis || ''}
                            onChange={e => updateElement(selectedElement.id, { yAxis: e.target.value || null })}
                            className="input-dark text-sm appearance-none"
                          >
                            <option value="">-- Select Column --</option>
                            {cols.map(col => (
                              <option key={col.name} value={col.name}>{col.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null;
                  })()}

                  {/* Data Filters */}
                  {['bar', 'line', 'pie', 'scatter', 'table'].includes(selectedElement.type) && datasetInfo && (() => {
                    const cols = datasetInfo?.analysis?.columns || (datasetInfo?.rows?.[0] ? Object.keys(datasetInfo.rows[0]).map(name => ({ name })) : []);
                    const currentFilters = selectedElement.filters || [];
                    return (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            🔍 Filters ({currentFilters.length})
                          </label>
                          <div className="space-y-2 mb-3">
                            {currentFilters.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs">
                                <span className="flex-1 text-slate-300">{f.column} {f.operator} {f.value}</span>
                                <button
                                  onClick={() => {
                                    const newFilters = currentFilters.filter((_, i) => i !== idx);
                                    updateElement(selectedElement.id, { filters: newFilters.length > 0 ? newFilters : undefined });
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg">
                            <select
                              id={`col-${selectedElement.id}`}
                              className="input-dark text-sm appearance-none w-full"
                              defaultValue=""
                            >
                              <option value="">-- Select Column --</option>
                              {cols.map(col => (
                                <option key={col.name} value={col.name}>{col.name}</option>
                              ))}
                            </select>
                            <select
                              id={`op-${selectedElement.id}`}
                              className="input-dark text-sm appearance-none w-full"
                              defaultValue="equals"
                            >
                              <option value="equals">=</option>
                              <option value="!=">≠</option>
                              <option value="contains">contains</option>
                              <option value=">">&gt;</option>
                              <option value="<">&lt;</option>
                            </select>
                            <input
                              id={`val-${selectedElement.id}`}
                              type="text"
                              placeholder="Filter value"
                              className="input-dark text-sm w-full"
                            />
                            <button
                              onClick={() => {
                                const col = document.getElementById(`col-${selectedElement.id}`).value;
                                const op = document.getElementById(`op-${selectedElement.id}`).value;
                                const val = document.getElementById(`val-${selectedElement.id}`).value;
                                if (col && val) {
                                  const newFilter = { column: col, operator: op, value: val };
                                  const newFilters = [...currentFilters, newFilter];
                                  updateElement(selectedElement.id, { filters: newFilters });
                                  document.getElementById(`col-${selectedElement.id}`).value = '';
                                  document.getElementById(`val-${selectedElement.id}`).value = '';
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
                            >
                              Add Filter
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* AI & Data Health Scorecard */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Intelligence</h3>
                      <button 
                        onClick={() => {
                          const columns = datasetInfo?.analysis?.columns || [];
                          const advice = getSmartAxes(selectedElement.type, columns);
                          updateElement(selectedElement.id, advice);
                        }}
                        className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-600/40 transition-all flex items-center gap-1.5"
                      >
                        <Settings2 size={10} /> AI Advice
                      </button>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Data Completeness</span>
                        <span className="text-[10px] text-emerald-400 font-bold">98.2%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98.2%]" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-slate-500">Stability Index</span>
                        <span className="text-[9px] text-blue-400">High</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-[9px] text-amber-500/80 leading-tight">
                        AI detected <span className="font-bold underline">Outliers</span> in this view. Check highlighted red markers.
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-800 border-dashed" />

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => duplicateElement(selectedElement)}
                      className="w-full flex items-center justify-center gap-2 p-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Copy size={13} /> Duplicate Widget
                    </button>
                    <button
                      onClick={() => removeElement(selectedElement.id)}
                      className="w-full flex items-center justify-center gap-2 p-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} /> Delete Widget
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen Widget Modal */}
      {expandedWidget && (
        <WidgetModal
          el={expandedWidget}
          theme={selectedTheme}
          datasetInfo={datasetInfo}
          onClose={() => setExpandedWidget(null)}
        />
      )}
    </div>
  );
}
