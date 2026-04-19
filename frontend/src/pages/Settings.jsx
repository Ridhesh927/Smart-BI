import { useState } from "react";
import { User, Bell, Shield, Palette, Globe, Save, ChevronRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../context/ThemeContext";
import { updateProfile } from "firebase/auth";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [notifications, setNotifications] = useState({
    email: true,
    usage: false,
    security: true
  });

  const categories = [
    { id: "profile", title: "Profile", icon: <User size={20} />, color: "text-blue-400", desc: "Manage your personal information and profile picture." },
    { id: "notifications", title: "Notifications", icon: <Bell size={20} />, color: "text-[var(--accent)]", desc: "Configure how you want to be alerted about your data updates." },
    { id: "security", title: "Security", icon: <Shield size={20} />, color: "text-emerald-400", desc: "Update your password and account security settings." },
    { id: "appearance", title: "Appearance", icon: <Palette size={20} />, color: "text-[var(--primary)]", desc: "Customize the look and feel of your Smart Dash workspace." },
    { id: "language", title: "Language", icon: <Globe size={20} />, color: "text-orange-400", desc: "Set your preferred language and regional date formats." },
  ];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = await user?.getIdToken();
      
      // 1. Update Firebase Profile
      if (displayName !== user?.displayName) {
        await updateProfile(user, { displayName });
      }
      
      // 2. Update Backend
      await fetch(`${import.meta.env.VITE_API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ display_name: displayName })
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetailView = () => {
    switch (activeCategory) {
      case "profile":
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center gap-4 mb-8">
               <div className="relative group">
                 <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-4xl font-bold text-[var(--bg-main)] shadow-2xl">
                    {displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                 </div>
                 <button className="absolute -bottom-2 -right-2 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <User size={14} />
                 </button>
               </div>
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Syncing with Firebase Auth</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[var(--bg-main)]/50 border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email}
                  className="w-full bg-[var(--bg-main)]/20 border border-[var(--border)]/50 rounded-xl px-4 py-3 text-sm text-[var(--text-muted)] cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>
        );
      
      case "appearance":
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-[var(--text-muted)]">Choose a workspace theme that suits your analysis style.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: THEMES.NIGHT, name: "Night", color: "bg-[#0f172a]", accent: "bg-blue-500" },
                { id: THEMES.EMERALD, name: "Emerald", color: "bg-[#062016]", accent: "bg-emerald-500" },
                { id: THEMES.SUNSET, name: "Sunset", color: "bg-[#1c1917]", accent: "bg-[#ffa48e]" },
                { id: THEMES.OCEANIC, name: "Oceanic", color: "bg-[#082f49]", accent: "bg-cyan-500" },
                { id: THEMES.SNOW, name: "Snow", color: "bg-[#f8fafc]", accent: "bg-blue-500" }
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 text-left group ${theme === t.id ? "border-[var(--primary)] bg-[var(--bg-main)]" : "border-[var(--border)] hover:border-[var(--border)]/80 bg-transparent"}`}
                >
                  <div className={`w-full h-20 rounded-xl ${t.color} border border-white/5 relative overflow-hidden`}>
                     <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ${t.accent} shadow-lg`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{t.name}</span>
                    {theme === t.id && <Check size={16} className="text-[var(--primary)]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {Object.entries({
              email: { label: "Email Updates", desc: "Receive summary reports and workspace activity in your inbox." },
              usage: { label: "Usage Alerts", desc: "Get notified when you approach your AI generation or storage limits." },
              security: { label: "Security Activity", desc: "Important alerts about password changes or new device logins." }
            }).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-main)]/30 border border-[var(--border)]/50">
                <div className="max-w-[70%]">
                  <h4 className="text-sm font-bold text-white mb-1">{config.label}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{config.desc}</p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative ${notifications[key] ? "bg-[var(--primary)]" : "bg-[var(--bg-surface)]"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifications[key] ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] animate-in fade-in duration-300">
            <Globe size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Coming Soon</p>
            <p className="text-xs">Advanced {activeCategory} controls are in development.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeCategory && (
            <button 
              onClick={() => setActiveCategory(null)}
              className="p-2.5 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              {activeCategory ? categories.find(c => c.id === activeCategory).title : "Settings"}
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              {activeCategory ? "Adjust your preferences below." : "Manage your account settings and application preferences."}
            </p>
          </div>
        </div>
      </div>

      {!activeCategory ? (
        <div className="space-y-6">
          <div className="bg-[var(--bg-sidebar)]/40 p-8 rounded-3xl border border-[var(--border)] flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-3xl font-bold text-[var(--bg-main)] shadow-xl shadow-[var(--primary)]/20">
                {displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{displayName || 'Smart Dash User'}</h2>
                <p className="text-[var(--text-muted)] text-sm font-medium">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--primary)]/20">
                  Pro Account
                </div>
              </div>
            </div>
            <button 
              onClick={() => setActiveCategory('profile')}
              className="px-5 py-2.5 bg-[var(--bg-surface)] hover:text-white text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all border border-[var(--border)] active:scale-95"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <button 
                key={category.id} 
                onClick={() => setActiveCategory(category.id)}
                className="bg-[var(--bg-sidebar)]/40 p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-main)]/50 transition-all group text-left relative overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-3 relative z-10">
                  <div className={`w-11 h-11 rounded-xl bg-[var(--bg-main)] flex items-center justify-center group-hover:scale-110 transition-transform border border-[var(--border)] ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-white tracking-tight">{category.title}</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed relative z-10 pr-8">{category.desc}</p>
                <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[var(--bg-sidebar)]/40 rounded-3xl border border-[var(--border)] p-8 shadow-2xl">
            {renderDetailView()}
          </div>
          
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Check size={18} className="text-[var(--primary)]" />
                Auto-Sync Enabled
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Changes will be synced across your devices instantly using secure Firebase authentication.
              </p>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl active:scale-95 ${saveSuccess ? "bg-emerald-500 text-white" : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)]"}`}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : saveSuccess ? (
                <><Check size={20} /> Preferences Saved</>
              ) : (
                <><Save size={20} /> Save Preferences</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
