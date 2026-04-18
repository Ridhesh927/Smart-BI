import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Hash, Type, AlertCircle, Layout, Edit3 } from "lucide-react";
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useAuth } from "../context/AuthContext";
import { RenameModal, SuccessModal } from "../components/Modals/DashboardModals";

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
  const [searchParams] = useSearchParams();
  const preloadDatasetId = searchParams.get('dataset');
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
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [dashboardTitle, setDashboardTitle] = useState("Untitled Dashboard");
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
  const [qualityScore, setQualityScore] = useState(100);
  const [datasetProfile, setDatasetProfile] = useState(null);

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
      setAiSuggestion(null);
      const token = await user?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/suggest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          schema: {
            dimensions: dataFields.dimensions.map(({ name, type }) => ({ name, type })),
            measures: dataFields.measures.map(({ name, type, field }) => ({ name, type, field }))
          },
          profile: datasetProfile
        })
      });

      const result = await response.json();
      if (result.suggestion) {
        const {
          columns = [],
          rows = [],
          chartType = activeSheet.type,
          title = activeSheet.name,
          recommendedFilters = [],
          summary = '',
          tips = [],
          avoidedFields = []
        } = result.suggestion;
        const newColumns = columns.map(name => dataFields.dimensions.find(d => d.name === name)).filter(Boolean);
        const newRows = rows.map(name => dataFields.measures.find(m => m.name === name)).filter(Boolean).map(field => ({
          ...field, displayName: `SUM(${field.name})`, pillId: `rows-${field.name}-${Date.now()}`
        }));
        const suggestedFilterPills = recommendedFilters
          .map(({ field }) => dataFields.dimensions.find(d => d.name === field) || dataFields.measures.find(m => m.name === field))
          .filter(Boolean)
          .filter(field => !activeSheet.shelves.filters.some(existing => existing.name === field.name))
          .map(field => ({
            ...field,
            displayName: field.name,
            pillId: `filters-${field.name}-${Date.now()}`
          }));

        updateActiveSheet({
          name: title, type: chartType,
          shelves: {
            ...activeSheet.shelves,
            columns: newColumns.map(c => ({ ...c, pillId: `cols-${c.name}-${Date.now()}`, displayName: c.name })),
            rows: newRows,
            filters: [...activeSheet.shelves.filters, ...suggestedFilterPills]
          }
        });
        setAiSuggestion({
          summary,
          recommendedFilters,
          tips,
          avoidedFields,
          title,
          chartType
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
    // If it's a new dashboard and still untitled, prompt for name first
    if (id === 'new' && dashboardTitle === "Untitled Dashboard") {
      setIsRenameModalOpen(true);
      return;
    }

    try {
      setSaveLoading(true);
      const token = await user?.getIdToken();
      const payload = {
        title: dashboardTitle,
        layout_data: elements,
        visuals_data: sheets
      };
      const url = id === 'new' ? `${import.meta.env.VITE_API_URL}/dashboards` : `${import.meta.env.VITE_API_URL}/dashboards/${id}`;
      const response = await fetch(url, {
        method: id === 'new' ? 'POST' : 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) setShowSuccessModal(true);
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
        
        // If editing existing, get its data
        if (id !== 'new') {
          const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/dashboards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          const detail = await detailRes.json();
          if (detail.title) setDashboardTitle(detail.title);
          if (detail.visuals_json) setSheets(JSON.parse(detail.visuals_json));
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/datasets`, { headers: { Authorization: `Bearer ${token}` } });
        const datasets = await res.json();

        // Prefer the dataset passed via ?dataset= query param, otherwise use first
        const target = preloadDatasetId
          ? datasets.find(d => String(d.id) === String(preloadDatasetId)) || datasets[0]
          : datasets[0];

        if (target) {
          setActiveDataset(target);
          const schemaRes = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${target.id}/schema`, { headers: { Authorization: `Bearer ${token}` } });
          const schema = await schemaRes.json();
          const dims = schema.columns.filter(f => f.type === 'dimension').map(f => ({ name: f.name, type: 'dimension', icon: <Type size={14} className="text-blue-400" /> }));
          const meas = schema.columns.filter(f => f.type === 'measure').map(f => ({ name: f.name, type: 'measure', icon: <Hash size={14} className="text-emerald-400" /> }));
          // Always inject a virtual "Number of Records" COUNT measure — works on any dataset
          const countMeasure = { name: 'Number of Records', type: 'measure', field: '__count__', icon: <Hash size={14} className="text-amber-400" /> };
          // Fetch quality profile for actionable insights
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/datasets/${target.id}/profile`, { headers: { Authorization: `Bearer ${token}` } });
          const profile = await profileRes.json();
          if (profile.qualityScore) setQualityScore(profile.qualityScore);
          setDatasetProfile(profile);

          setDataFields({ dimensions: dims, measures: [countMeasure, ...meas] });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user) init();
  }, [user, preloadDatasetId, id]);

  useEffect(() => {
    const runQuery = async () => {
      if (!activeDataset || (activeSheet.shelves.columns.length === 0 && activeSheet.shelves.rows.length === 0)) return;
      try {
        setQueryLoading(true);
        const token = await user?.getIdToken();
        const dimensions = activeSheet.shelves.columns.filter(p => p.type === 'dimension').map(p => p.name);
        const measures = activeSheet.shelves.rows.filter(p => p.type === 'measure').map(p => ({ field: p.field ?? p.name, aggregation: 'SUM' }));
        const filters = activeSheet.shelves.filters.map(f => ({ 
          field: f.name, 
          values: f.filterValues || [], 
          exclude: f.exclude 
        }));
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
              updateActiveSheet({ 
                shelves: { 
                  ...activeSheet.shelves, 
                  filters: [
                    ...activeSheet.shelves.filters, 
                    { 
                      ...filterModalConfig.field, 
                      filterValues: cfg.params.selected, 
                      exclude: cfg.params.exclude, 
                      displayName: `${cfg.params.exclude ? 'NOT ' : ''}${filterModalConfig.field.name}` 
                    }
                  ] 
                } 
              });
              setFilterModalConfig(null);
            }} 
          />
        )}

        <StudioHeader 
          id={id} 
          title={dashboardTitle}
          onRename={() => setIsRenameModalOpen(true)}
          handleSave={handleSave} 
          saveLoading={saveLoading} 
          showShowMe={showShowMe} 
          setShowShowMe={setShowShowMe} 
        />

        <div className="flex-1 flex overflow-hidden">
          <DataSidebar 
            activeLeftTab={activeLeftTab} setActiveLeftTab={setActiveLeftTab} 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            loading={loading} dataFields={dataFields} 
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} 
            handleAiGenerate={handleAiGenerate} isAiGenerating={isAiGenerating}
            activeDataset={activeDataset}
            user={user}
            aiSuggestion={aiSuggestion}
          />
          
          <ShelfSidebar activeSheet={activeSheet} removePill={removePill} isMarksOpen={isMarksOpen} setIsMarksOpen={setIsMarksOpen} currentMarkType={currentMarkType} updateActiveSheet={updateActiveSheet} />

          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            <CanvasHeader activeSheet={activeSheet} removePill={removePill} />
            <div className="flex-1 p-4 flex flex-col min-h-0 bg-[#020617] relative">
               
               {/* Quality Insight Alert */}
               {qualityScore < 85 && (
                 <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                       <AlertCircle size={20} />
                     </div>
                     <div>
                       <h4 className="text-sm font-bold text-white">Smart Quality Suggestion</h4>
                       <p className="text-xs text-slate-400">Your dataset has a quality score of <span className="text-amber-400 font-bold">{qualityScore}%</span>. Missing values might skew your charts.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => setActiveLeftTab('quality')}
                     className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                   >
                     Fix Issues
                   </button>
                 </div>
               )}

               <VisualRenderer activeSheet={activeSheet} activeDataset={activeDataset} queryLoading={queryLoading} />
            </div>
          </div>

          <ShowMePanel showShowMe={showShowMe} setShowShowMe={setShowShowMe} activeSheet={activeSheet} updateActiveSheet={updateActiveSheet} hoveredChart={hoveredChart} setHoveredChart={setHoveredChart} handleAutoAiGenerate={handleAutoAiGenerate} />
        </div>
        
        <RenameModal 
          isOpen={isRenameModalOpen} 
          onClose={() => setIsRenameModalOpen(false)} 
          currentTitle={dashboardTitle} 
          onRename={(newTitle) => setDashboardTitle(newTitle)} 
        />

        <SuccessModal 
          isOpen={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)} 
          message="Dashboard saved safely!" 
        />
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
