import React from 'react';
import { 
  BarChart2, PieChart, LineChart, Layers, Square, Circle, Hexagon, Type, Globe, Rows3, Diamond, Target, Table, Plus
} from "lucide-react";

export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const MARK_TYPES = [
  { name: 'Automatic', type: 'bar', icon: <div className="w-2 h-2 rounded-full border border-blue-400" /> },
  { name: 'Bar', type: 'bar', icon: <BarChart2 size={14} /> },
  { name: 'Line', type: 'line', icon: <LineChart size={14} /> },
  { name: 'Area', type: 'area', icon: <Layers size={14} className="fill-current" /> },
  { name: 'Square', type: 'square', icon: <Square size={14} /> },
  { name: 'Circle', type: 'circle', icon: <Circle size={14} /> },
  { name: 'Shape', type: 'shape', icon: <Hexagon size={14} /> },
  { name: 'Text', type: 'table', icon: <Type size={14} /> },
  { name: 'Map', type: 'map', icon: <Globe size={14} /> },
  { name: 'Pie', type: 'pie', icon: <PieChart size={14} /> },
  { name: 'Gantt Bar', type: 'gantt', icon: <Rows3 size={14} /> },
  { name: 'Polygon', type: 'polygon', icon: <Diamond size={14} /> },
  { name: 'Density', type: 'density', icon: <Target size={14} /> },
];

export const showMeCharts = [
  { name: 'Text Table', icon: <Table size={18} />, type: 'table', req: { dims: '1+', meas: '1+' } },
  { name: 'Heat Map', icon: <Layers size={18} />, type: 'heatmap', req: { dims: '1+', meas: '1' } },
  { name: 'Highlight Table', icon: <Table size={18} className="rotate-90" />, type: 'table', subType: 'highlight', req: { dims: '1+', meas: '1+' } },
  { name: 'Symbol Map', icon: <Globe size={18} />, type: 'map', req: { dims: '0-1', meas: '1+' } },
  { name: 'Filled Map', icon: <Globe size={18} className="fill-current" />, type: 'map', req: { dims: '1', meas: '0+' } },
  { name: 'Pie Chart', icon: <PieChart size={18} />, type: 'pie', req: { dims: '1', meas: '1+' } },
  { name: 'Horizontal Bars', icon: <BarChart2 size={18} className="rotate-90" />, type: 'bar', subType: 'horizontal', req: { dims: '1+', meas: '1+' } },
  { name: 'Stacked Bars', icon: <BarChart2 size={18} className="rotate-90 opacity-50" />, type: 'bar', subType: 'stacked', req: { dims: '1+', meas: '1+' } },
  { name: 'Side-by-Side Bars', icon: <BarChart2 size={18} className="rotate-90" />, type: 'bar', subType: 'grouped', req: { dims: '1+', meas: '1+' } },
  { name: 'Tree Map', icon: <Plus size={18} />, type: 'treemap', req: { dims: '1+', meas: '1-2' } },
  { name: 'Circle View', icon: <Plus size={18} className="rounded-full" />, type: 'circle', req: { dims: '1+', meas: '1' } },
  { name: 'Box Plot', icon: <Layers size={18} />, type: 'boxplot', req: { dims: '1+', meas: '1+' } },
  { name: 'Lines (Discrete)', icon: <LineChart size={18} />, type: 'line', req: { dims: '1+', meas: '1+' } },
  { name: 'Lines (Continuous)', icon: <LineChart size={18} className="text-blue-400" />, type: 'line', req: { dims: '1 Date', meas: '1+' } },
  { name: 'Dual Lines', icon: <LineChart size={18} />, type: 'line', subType: 'dual', req: { dims: '1 Date', meas: '2' } },
  { name: 'Area Chart', icon: <Layers size={18} className="fill-current" />, type: 'area', req: { dims: '1 Date', meas: '1+' } },
  { name: 'Scatter Plot', icon: <Plus size={18} />, type: 'scatter', req: { dims: '0-1', meas: '2-4' } },
  { name: 'Histogram', icon: <BarChart2 size={18} />, type: 'histogram', req: { dims: '1', meas: '0' } },
  { name: 'Gantt Chart', icon: <Rows3 size={18} />, type: 'gantt', req: { dims: '1+', meas: '1+' } },
  { name: 'Bullet Graph', icon: <BarChart2 size={18} />, type: 'bullet', req: { dims: '0+', meas: '2+' } },
  { name: 'Packed Bubbles', icon: <PieChart size={18} />, type: 'bubbles', req: { dims: '1+', meas: '1-2' } },
];
