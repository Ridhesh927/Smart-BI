import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Hash, Type } from "lucide-react";
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useAuth } from "../context/AuthContext";

// Modular Components
import { MARK_TYPES, showMeCharts } from '../components/Studio/constants';
import { FilterModal } from '../components/Studio/FilterModal';
import { VisualRenderer } from '../components/Studio/VisualRenderer';
import { ShowMePanel } from '../components/Studio/ShowMePanel';
import { DataSidebar } from '../components/Studio/DataSidebar';
import { ShelfSidebar } from '../components/Studio/ShelfSidebar';
import { StudioHeader, CanvasHeader } from '../components/Studio/StudioLayout';

export default function Studio() {
  const { id } = useParams();
  const { user } = useAuth();
  
  // UI State
  const [activeLeftTab, setActiveLeftTab] = useState('data');
  const [showShowMe, setShowShowMe] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [elements] = useState([]);
  const [draggingField, setDraggingField] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [filterModalConfig, setFilterModalConfig] = useState(null);
  const [hoveredChart, setHoveredChart] = useState(null);
  const [isMarksOpen, setIsMarksOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Sheet & Data State
  const [sheets, setSheets] = useState([
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      shelves: { columns: [], rows: [], marks: [], filters: [], pages: [] },
      chartData: [],
      type: 'bar'
    }
  ]);
  const [activeSheetId] = useState('sheet-1');
  const [dataFields, setDataFields] = useState({ dimensions: [], measures: [] });
  const [loading, setLoading] = useState(false);
  const [activeDataset, setActiveDataset] = useState(null);

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const currentMarkType = MARK_TYPES.find(m => m.type === activeSheet.type) || MARK_TYPES[0];

  const updateActiveSheet = useCallback((updates) => {
    setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, ...updates } : s));
  }, [activeSheetId]);

  // --- Logic Handlers ---

  const handleDragStart = (event) => {
    setDraggingField(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingField(null);

    if (over && active.data.current) {
      const field = active.data.current;
      const shelfId = over.id;
      if (activeSheet.shelves[shelfId]?.some(p => p.name === field.name)) return;

      const pillId = `${shelfId}-${field.name}-${Date.now()}`;
      const newPill = {
        ...field,
        displayName: field.type === 'measure' ? `SUM(${field.name})` : field.name,
        pillId
      };

      if (shelfId === 'filters') {
        setFilterModalConfig({ field: newPill, shelfId });
        return;
      }

      updateActiveSheet({
        shelves: {
          ...activeSheet.shelves,
          [shelfId]: [...activeSheet.shelves[shelfId], newPill]
        }
      });
    }
  };

  const removePill = (shelfId, pillId) => {
    updateActiveSheet({
      shelves: {
        ...activeSheet.shelves,
        [shelfId]: activeSheet.shelves[shelfId].filter(p => p.pillId !== pillId)
      }
    });
  };

  const handleAiGenerate = async (finalPrompt = aiPrompt) => {
    if (!finalPrompt || !finalPrompt.trim() || !activeDataset) return;
    try {
      setIsAiGenerating(true);
      const token = await user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/suggest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          schema: { dimensions: dataFields.dimensions, measures: dataFields.measures }
        })
      });

      const result = await response.json();
      if (result.suggestion) {
        const { columns, rows, chartType, title } = result.suggestion;
        const newColumns = columns.map(name => dataFields.dimensions.find(d => d.name === name)).filter(Boolean);
        const newRows = rows.map(name => dataFields.measures.find(m => m.name === name)).filter(Boolean).map(field => ({
          ...field, displayName: `SUM(${field.name})`, pillId: `rows-${field.name}-${Date.now()}`
        }));

        updateActiveSheet({
          name: title, type: chartType,
          shelves: {
            ...activeSheet.shelves,
            columns: newColumns.map(c => ({ ...c, pillId: `cols-${c.name}-${Date.now()}`, displayName: c.name })),
            rows: newRows
          }
        });
        setAiPrompt("");
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAutoAiGenerate = async () => {
    const targetChart = hoveredChart || showMeCharts.find(c => c.type === activeSheet.type);
    let prompt = "Look at my data fields and suggest the best dashboard layout and visualizations.";
    if (targetChart) {
      prompt = `Build a professional ${targetChart.name} visualization. Requirements: ${targetChart.req.dims} Dimensions and ${targetChart.req.meas} Measures. Analyze the schema carefully.`;
    }
    handleAiGenerate(prompt);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const token = await user?.getIdToken();
      const payload = {
        title: activeSheet.name || 'Untitled Dashboard',
        layout_data: elements,
        visuals_data: sheets
      };
      const url = id === 'new' ? `${import.meta.env.VITE_API_URL}/dashboards` : `${import.meta.env.VITE_API_URL}/dashboards/${id}`;
      const response = await fetch(url, {
        method: id === 'new' ? 'POST' : 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) alert("Dashboard saved safely!");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Initialization ---

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const token = await user?.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets`, { headers: { Authorization: `Bearer ${token}` } });
        const datasets = await res.json();
        if (datasets.length > 0) {
          setActiveDataset(datasets[0]);
          const schemaRes = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${datasets[0].id}/schema`, { headers: { Authorization: `Bearer ${token}` } });
          const schema = await schemaRes.json();
          const dims = schema.columns.filter(f => f.type === 'dimension').map(f => ({ name: f.name, type: 'dimension', icon: <Type size={14} className="text-blue-400" /> }));
          const meas = schema.columns.filter(f => f.type === 'measure').map(f => ({ name: f.name, type: 'measure', icon: <Hash size={14} className="text-emerald-400" /> }));
          setDataFields({ dimensions: dims, measures: meas });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user) init();
  }, [user]);

  useEffect(() => {
    const runQuery = async () => {
      if (!activeDataset || (activeSheet.shelves.columns.length === 0 && activeSheet.shelves.rows.length === 0)) return;
      try {
        setQueryLoading(true);
        const token = await user?.getIdToken();
        const dimensions = activeSheet.shelves.columns.filter(p => p.type === 'dimension').map(p => p.name);
        const measures = activeSheet.shelves.rows.filter(p => p.type === 'measure').map(p => ({ field: p.name, aggregation: 'SUM' }));
        const filters = activeSheet.shelves.filters.map(f => ({ field: f.name, values: f.filterValues, exclude: f.exclude }));
        const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${activeDataset.id}/query`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ dimensions, measures, filters })
        });
        const result = await res.json();
        if (Array.isArray(result)) updateActiveSheet({ chartData: result });
      } catch (err) { console.error(err); } finally { setQueryLoading(false); }
    };
    const timeout = setTimeout(runQuery, 500);
    return () => clearTimeout(timeout);
  }, [activeSheet.shelves, activeDataset, activeSheetId, user, updateActiveSheet]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="absolute inset-0 flex flex-col bg-slate-950 font-sans">
        
        {filterModalConfig && activeDataset && (
          <FilterModal 
            field={filterModalConfig.field} datasetId={activeDataset.id} user={user}
            onCancel={() => setFilterModalConfig(null)}
            onConfirm={(cfg) => {
              updateActiveSheet({ shelves: { ...activeSheet.shelves, filters: [...activeSheet.shelves.filters, { ...filterModalConfig.field, filterValues: cfg.values, exclude: cfg.exclude, displayName: `${cfg.exclude ? 'NOT ' : ''}${filterModalConfig.field.name}` }] } });
              setFilterModalConfig(null);
            }} 
          />
        )}

        <StudioHeader id={id} handleSave={handleSave} saveLoading={saveLoading} showShowMe={showShowMe} setShowShowMe={setShowShowMe} />

        <div className="flex-1 flex overflow-hidden">
          <DataSidebar activeLeftTab={activeLeftTab} setActiveLeftTab={setActiveLeftTab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading} dataFields={dataFields} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} handleAiGenerate={handleAiGenerate} isAiGenerating={isAiGenerating} />
          
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
