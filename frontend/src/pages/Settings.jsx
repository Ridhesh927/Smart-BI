import { User, Bell, Shield, Palette, Globe, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  const sections = [
    { title: "Profile", icon: <User size={20} className="text-blue-400" />, desc: "Manage your personal information and profile picture." },
    { title: "Notifications", icon: <Bell size={20} className="text-purple-400" />, desc: "Configure how you want to be alerted about your data updates." },
    { title: "Security", icon: <Shield size={20} className="text-emerald-400" />, desc: "Update your password and manage two-factor authentication." },
    { title: "Appearance", icon: <Palette size={20} className="text-pink-400" />, desc: "Customize the look and feel of your Smart Dash workspace." },
    { title: "Language", icon: <Globe size={20} className="text-orange-400" />, desc: "Set your preferred language and regional date formats." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account settings and application preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="glass p-8 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{user?.displayName || 'Smart Dash User'}</h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                Pro Account
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-700">
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group cursor-pointer">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  {section.icon}
                </div>
                <h3 className="font-bold text-white">{section.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{section.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-800 flex items-center justify-between bg-blue-600/5">
          <div>
            <h3 className="font-bold text-white mb-1">Save Changes</h3>
            <p className="text-xs text-slate-500">Any changes made will take effect immediately across all devices.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
            <Save size={18} /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
