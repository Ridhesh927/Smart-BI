import React, { useState, useEffect, useCallback } from "react";
import { Hash, Type } from "lucide-react";
import { DndContext, DragOverlay } from '@dnd-kit/core';

// Modular Components
import { MARK_TYPES, showMeCharts } from '../components/Studio/constants';
import { VisualRenderer } from '../components/Studio/VisualRenderer';
import { ShowMePanel } from '../components/Studio/ShowMePanel';
import { DataSidebar } from '../components/Studio/DataSidebar';
import { ShelfSidebar } from '../components/Studio/ShelfSidebar';
import { StudioHeader, CanvasHeader } from '../components/Studio/StudioLayout';
import { FilterModal } from '../components/Studio/FilterModal';

// Mock Data
const MOCK_DATASETS = [
  {
    id: 'demo-sales',
    name: 'Global Sales Dashboard',
    fields: {
      dimensions: [
        { name: 'Category', type: 'dimension', icon: <Type size={14} className="text-blue-400" /> },
        { name: 'Region', type: 'dimension', icon: <Type size={14} className="text-blue-400" /> },
        { name: 'District', type: 'dimension', icon: <Type size={14} className="text-blue-400" /> },
        { name: 'Product', type: 'dimension', icon: <Type size={14} className="text-blue-400" /> }
      ],
      measures: [
        { name: 'Sales', type: 'measure', icon: <Hash size={14} className="text-emerald-400" /> },
        { name: 'Profit', type: 'measure', icon: <Hash size={14} className="text-emerald-400" /> },
        { name: 'Orders', type: 'measure', icon: <Hash size={14} className="text-emerald-400" /> }
      ]
    },
    data: [
      { Category: 'Electronics', Region: 'North', Sales: 45000, Profit: 12000, Orders: 120, District: 'City A', Product: 'Laptop', lat: 40.7128, lng: -74.0060 },
      { Category: 'Fashion', Region: 'North', Sales: 32000, Profit: 8000, Orders: 210, District: 'City B', Product: 'Shared', lat: 34.0522, lng: -118.2437 },
      { Category: 'Home', Region: 'North', Sales: 15000, Profit: 3000, Orders: 55, District: 'City C', Product: 'Furniture', lat: 41.8781, lng: -87.6298 },
      { Category: 'Electronics', Region: 'South', Sales: 38000, Profit: 11000, Orders: 95, District: 'City D', Product: 'Mobile', lat: 29.7604, lng: -95.3698 },
      { Category: 'Fashion', Region: 'South', Sales: 41000, Profit: 10500, Orders: 330, District: 'City E', Product: 'Shoes', lat: 33.7490, lng: -84.3880 },
      { Category: 'Home', Region: 'South', Sales: 22000, Profit: 5000, Orders: 82, District: 'City F', Product: 'Decor', lat: 25.7617, lng: -80.1918 },
      { Category: 'Electronics', Region: 'East', Sales: 55000, Profit: 18000, Orders: 145, District: 'City G', Product: 'Tablet', lat: 42.3601, lng: -71.0589 },
      { Category: 'Fashion', Region: 'East', Sales: 28000, Profit: 6000, Orders: 180, District: 'City H', Product: 'Clothing', lat: 39.9526, lng: -75.1652 },
      { Category: 'Home', Region: 'East', Sales: 19000, Profit: 4500, Orders: 68, District: 'City I', Product: 'Kitchen', lat: 38.9072, lng: -77.0369 }
    ]
  }
];

export default function DemoStudio() {
  const [activeLeftTab, setActiveLeftTab] = useState('data');
  const [showShowMe, setShowShowMe] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingField, setDraggingField] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [hoveredChart, setHoveredChart] = useState(null);
  const [isMarksOpen, setIsMarksOpen] = useState(false);
  const [activeFilterField, setActiveFilterField] = useState(null);

  const [activeDataset] = useState(MOCK_DATASETS[0]);
  const [sheets, setSheets] = useState([
    {
      id: 'demo-sheet',
      name: 'Demo Sheet',
      shelves: { columns: [], rows: [], marks: [], filters: [], pages: [] },
      chartData: [],
      type: 'bar'
    }
  ]);
  const [activeSheetId] = useState('demo-sheet');

  const activeSheet = sheets.find(s => s.id === activeSheetId);
  const currentMarkType = MARK_TYPES.find(m => m.type === activeSheet.type) || MARK_TYPES[0];

  const updateActiveSheet = useCallback((updates) => {
    setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, ...updates } : s));
  }, [activeSheetId]);

  const handleDragStart = (event) => {
    setDraggingField(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingField(null);
    if (!over || !active.data.current) return;

    const dragData = active.data.current;
    const targetShelf = over.id;

    // --- CASE 1: Moving an existing pill from one shelf to another ---
    if (dragData.isPill) {
      const { sourceShelf, pillId } = dragData;
      // Don't do anything if dropped on same shelf
      if (sourceShelf === targetShelf) return;
      // Don't allow duplicates in target shelf
      if (activeSheet.shelves[targetShelf]?.some(p => p.name === dragData.name)) return;

      // Move: remove from source, add to target (strip isPill/sourceShelf meta)
      const { isPill: _isPill, sourceShelf: _src, ...cleanPill } = dragData;
      const newPillId = `${targetShelf}-${cleanPill.name}-${Date.now()}`;
      const movedPill = { ...cleanPill, pillId: newPillId, displayName: cleanPill.name };

      updateActiveSheet({
        shelves: {
          ...activeSheet.shelves,
          [sourceShelf]: activeSheet.shelves[sourceShelf].filter(p => p.pillId !== pillId),
          [targetShelf]: [...(activeSheet.shelves[targetShelf] || []), movedPill]
        }
      });
      return;
    }

    // --- CASE 2: Dragging a new field from the Data Sidebar ---
    const field = dragData;
    if (activeSheet.shelves[targetShelf]?.some(p => p.name === field.name)) return;

    // Filter shelf: open the modal instead of dropping directly
    if (targetShelf === 'filters') {
      setActiveFilterField(field);
      return;
    }

    const pillId = `${targetShelf}-${field.name}-${Date.now()}`;
    const newPill = { ...field, displayName: field.name, pillId };
    updateActiveSheet({
      shelves: {
        ...activeSheet.shelves,
        [targetShelf]: [...activeSheet.shelves[targetShelf], newPill]
      }
    });
  };

  const handleFilterConfirm = (filterConfig) => {
    const pillId = `filters-${filterConfig.field}-${Date.now()}`;
    const newPill = { 
       name: filterConfig.field, 
       type: filterConfig.type, 
       displayName: filterConfig.field, 
       pillId,
       filter: filterConfig.params 
    };

    updateActiveSheet({
      shelves: {
        ...activeSheet.shelves,
        filters: [...activeSheet.shelves.filters, newPill]
      }
    });
    setActiveFilterField(null);
  };

  const removePill = (shelfId, pillId) => {
    updateActiveSheet({
      shelves: { ...activeSheet.shelves, [shelfId]: activeSheet.shelves[shelfId].filter(p => p.pillId !== pillId) }
    });
  };

  // Simulated Query Engine
  useEffect(() => {
    // If shelves are empty, clear chart data
    if (activeSheet.shelves.columns.length === 0 && activeSheet.shelves.rows.length === 0) {
      if (activeSheet.chartData.length > 0) {
        updateActiveSheet({ chartData: [] });
      }
      return;
    }

    // Set loading state
    setQueryLoading(true);

    const runMockQuery = () => {
      const colField = activeSheet.shelves.columns[0]?.name;
      const rowFields = activeSheet.shelves.rows.map(r => r.name);

      if (rowFields.length > 0) {
        // If colField exists, group by it. Otherwise, return all rows (for scatter)
        if (colField) {
          const grouped = activeDataset.data.reduce((acc, curr) => {
            const key = curr[colField];
            if (!acc[key]) {
              acc[key] = { [colField]: key };
              rowFields.forEach(rf => acc[key][rf] = 0);
            }
            rowFields.forEach(rf => acc[key][rf] += curr[rf] || 0);
            return acc;
          }, {});
          updateActiveSheet({ chartData: Object.values(grouped) });
        } else if (activeSheet.type === 'scatter' || activeSheet.type === 'map') {
            // For scatter or map without grouping, just return raw data
            updateActiveSheet({ chartData: activeDataset.data.slice(0, 50) });
        }
      }
      setQueryLoading(false);
    };

    const timeout = setTimeout(runMockQuery, 600);
    return () => clearTimeout(timeout);
    // Explicitly excluding chartData from dependencies to avoid infinite loops, 
    // using the 'memoized' check pattern inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheet.shelves.columns, activeSheet.shelves.rows, activeDataset.data, updateActiveSheet]);

  const handleAutoAiGenerate = () => {
    const targetChart = hoveredChart || showMeCharts.find(c => c.type === activeSheet.type);
    setQueryLoading(true);
    setTimeout(() => {
       // Mock AI "Choosing" fields for demo purposes
       const dims = activeDataset.fields.dimensions.slice(0, 1);
       const meas = activeDataset.fields.measures.slice(0, 1);
       
       updateActiveSheet({
         type: targetChart.type,
         shelves: {
           ...activeSheet.shelves,
           columns: dims.map(d => ({ ...d, pillId: `cols-${d.name}-${Date.now()}`, displayName: d.name })),
           rows: meas.map(m => ({ ...m, pillId: `rows-${m.name}-${Date.now()}`, displayName: m.name }))
         }
       });
       setQueryLoading(false);
    }, 1000);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="absolute inset-0 flex flex-col bg-slate-950 font-sans">
        <StudioHeader id="SHOWCASE" activeSheet={activeSheet} handleSave={() => alert("Demo data cannot be saved to backend.")} saveLoading={false} showShowMe={showShowMe} setShowShowMe={setShowShowMe} />
        
        <div className="flex-1 flex overflow-hidden">
          <DataSidebar activeLeftTab={activeLeftTab} setActiveLeftTab={setActiveLeftTab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={false} dataFields={activeDataset.fields} aiPrompt="" setAiPrompt={() => {}} handleAiGenerate={() => alert("Simulation mode: Use CHOOSE FOR ME for dynamic field mapping.")} isAiGenerating={false} />
          
          <ShelfSidebar activeSheet={activeSheet} removePill={removePill} isMarksOpen={isMarksOpen} setIsMarksOpen={setIsMarksOpen} currentMarkType={currentMarkType} updateActiveSheet={updateActiveSheet} />

          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            <CanvasHeader activeSheet={activeSheet} removePill={removePill} />
            <div className="flex-1 p-4 flex flex-col min-h-0 bg-[#020617] relative">
               <VisualRenderer activeSheet={activeSheet} activeDataset={activeDataset} queryLoading={queryLoading} />
            </div>
          </div>

          <ShowMePanel showShowMe={showShowMe} setShowShowMe={setShowShowMe} activeSheet={activeSheet} updateActiveSheet={updateActiveSheet} hoveredChart={hoveredChart} setHoveredChart={setHoveredChart} handleAutoAiGenerate={handleAutoAiGenerate} />
        </div>
      </div>

      {/* Filter Modal Integration */}
      {activeFilterField && (
        <FilterModal 
          field={activeFilterField} 
          dataset={activeDataset} 
          onConfirm={handleFilterConfirm} 
          onCancel={() => setActiveFilterField(null)} 
        />
      )}

      <DragOverlay dropAnimation={null}>
        {draggingField && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-2xl border ${draggingField.type === 'measure' ? 'bg-emerald-500 border-emerald-400' : 'bg-blue-600 border-blue-400'} text-white`}>
             {draggingField.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
