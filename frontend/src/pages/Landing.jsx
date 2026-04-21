import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { BarChart3, Database, Layers, Zap } from "lucide-react";

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* Background visual effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px]" />

      <header className="absolute top-0 w-full p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <BarChart3 size={24} strokeWidth={2.5} />
          </div>
          Smart Dash
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
          <Link to="/register" className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-medium hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Start Free Trial
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-40 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-blue-300 text-sm font-medium mb-8">
            <Zap size={16} className="text-amber-400" /> Smart Dash Studio v2.0 is live
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-6">
            Data visualization <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
              made beautiful.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-slate-400 max-w-2xl mb-12">
            Transform your raw datasets into stunning, interactive dashboards in a matter of minutes. No coding required. Just pure drag-and-drop magic.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex gap-4">
            <Link to="/register" className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1">
              Start Building Now
            </Link>
            <Link to="/studio/demo" className="px-8 py-4 rounded-full glass text-white font-semibold text-lg hover:bg-slate-800/80 transition-all flex items-center justify-center">
              View Examples
            </Link>
          </motion.div>
        </motion.div>

        {/* Mockup Presentation */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="mt-24 w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass rounded-t-3xl border-b-0 p-4 pb-0 max-w-5xl mx-auto overflow-hidden shadow-2xl relative">
            <div className="flex gap-2 mb-4 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="bg-slate-900 rounded-t-2xl w-full h-80 lg:h-[32rem] flex items-center justify-center border border-slate-800 border-b-0 overflow-hidden relative group">
               <div className="absolute inset-0 grid grid-cols-3 gap-6 p-6">
                  {/* Fake dashboard cards */}
                  {/* Large Chart Card */}
                  <div className="col-span-2 row-span-2 glass rounded-xl border border-slate-700/50 p-6 flex flex-col group-hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6 z-10 relative">
                      <div>
                        <div className="text-slate-400 text-sm font-medium mb-1">Monthly Revenue</div>
                        <div className="text-3xl font-bold text-white">$124,500</div>
                      </div>
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        +14.5%
                      </div>
                    </div>
                    
                    {/* SVG Line Chart Graphic */}
                    <div className="flex-1 w-full relative z-10 flex items-end">
                      <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible drop-shadow-lg" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M0,150 L0,80 C40,70 60,110 100,90 C140,70 160,40 200,60 C240,80 260,20 300,30 C340,40 370,10 400,0 L400,150 Z" 
                          fill="url(#chartGradient)" 
                        />
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
                          d="M0,80 C40,70 60,110 100,90 C140,70 160,40 200,60 C240,80 260,20 300,30 C340,40 370,10 400,0" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                        />
                        {/* Data Points */}
                        {[
                          { cx: 100, cy: 90 }, { cx: 200, cy: 60 }, { cx: 300, cy: 30 }, { cx: 400, cy: 0 }
                        ].map((point, i) => (
                          <motion.circle 
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 2 + (i * 0.2), duration: 0.5 }}
                            cx={point.cx} cy={point.cy} r="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" 
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                  <div className="glass rounded-xl border border-slate-700/50 p-6 flex flex-col justify-center items-center group-hover:scale-[1.02] transition-transform duration-500 delay-75">
                    <Database className="text-indigo-400 mb-4" size={40} />
                    <div className="text-3xl font-bold">12.4M</div>
                    <div className="text-slate-500">Rows Processed</div>
                  </div>
                  <div className="glass rounded-xl border border-slate-700/50 p-6 flex flex-col group-hover:scale-[1.02] transition-transform duration-500 delay-100">
                    <Layers className="text-purple-400 mb-4" size={32} />
                    <div className="flex items-end gap-2 mt-auto">
                      <div className="w-4 bg-purple-500/40 h-8 rounded-sm"></div>
                      <div className="w-4 bg-purple-500/60 h-16 rounded-sm"></div>
                      <div className="w-4 bg-purple-500/80 h-12 rounded-sm"></div>
                      <div className="w-4 bg-purple-500 h-24 rounded-sm"></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
