import { useState } from "react";
import { UploadCloud, FileText, Search, Filter, MoreHorizontal, FileSpreadsheet, Trash2 } from "lucide-react";

export default function Datasets() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const mockDatasets = [
    { id: 1, name: "sales_data_2026_Q1.csv", size: "4.2 MB", rows: "45,210", date: "Oct 12, 2026", type: "csv" },
    { id: 2, name: "user_metrics_export.xlsx", size: "12.8 MB", rows: "128,400", date: "Oct 09, 2026", type: "xlsx" },
    { id: 3, name: "marketing_campaign_leads.csv", size: "1.1 MB", rows: "8,450", date: "Oct 01, 2026", type: "csv" },
    { id: 4, name: "product_inventory_master.csv", size: "845 KB", rows: "3,200", date: "Sep 25, 2026", type: "csv" },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFakeUpload();
  };
  
  const handleFakeUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      alert("Dataset uploaded successfully! (Mock)");
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Datasets Manager</h1>
          <p className="text-slate-400">Upload, organize, and prepare your data sources.</p>
        </div>
      </div>

      {/* Upload Wizard */}
      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900/80"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud size={40} className={`transition-colors ${isDragging ? "text-blue-400" : "text-slate-400"}`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {uploading ? "Uploading dataset..." : "Drag & drop your files here"}
        </h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Support for CSV, Excel (.xlsx), and JSON files up to 500MB. AutoBI will automatically detect your schema.
        </p>
        <button 
          className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          onClick={handleFakeUpload}
          disabled={uploading}
        >
          {uploading ? "Processing..." : "Browse Files"}
        </button>
      </div>

      {/* Datasets List */}
      <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search datasets..." 
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Filter size={16} /> Filter
            </button>
          </div>
          <div className="text-sm text-slate-400">
            {mockDatasets.length} datasets
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                <th className="p-4 font-medium rounded-tl-2xl">Name</th>
                <th className="p-4 font-medium">Size</th>
                <th className="p-4 font-medium">Rows</th>
                <th className="p-4 font-medium">Last Modified</th>
                <th className="p-4 font-medium rounded-tr-2xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockDatasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      {ds.type === 'csv' ? <FileText size={20} className="text-green-400" /> : <FileSpreadsheet size={20} className="text-emerald-500" />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{ds.name}</div>
                      <div className="text-xs text-slate-500 uppercase">{ds.type} File</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{ds.size}</td>
                  <td className="p-4 text-sm text-slate-400">{ds.rows}</td>
                  <td className="p-4 text-sm text-slate-400">{ds.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                        Preview
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
