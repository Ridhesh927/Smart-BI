import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Database, Layers, Zap, ArrowRight, CheckCircle2, TrendingUp, Shield, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  {
    icon: <TrendingUp size={22} className="text-blue-400" />,
    title: "Smart Chart Recommendations",
    description: "AI-powered engine analyzes your dataset schema and automatically recommends the best chart types for maximum insight.",
    color: "blue"
  },
  {
    icon: <Shield size={22} className="text-emerald-400" />,
    title: "Automated Data Cleaning",
    description: "Instantly detect and report duplicates, missing values, outliers, and low-variance columns. Clean data, beautiful results.",
    color: "emerald"
  },
  {
    icon: <Layers size={22} className="text-purple-400" />,
    title: "Drag-and-Drop Studio",
    description: "Build pixel-perfect dashboards with a powerful visual editor. Resize, reorder, and style your charts without writing a line of code.",
    color: "purple"
  },
];

const stats = [];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2.5 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <BarChart3 size={22} strokeWidth={2.5} />
          </div>
          SmartDash
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-slate-300 hover:text-white transition font-medium">Login</Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            Start Free Trial
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-44 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-blue-300 text-sm font-medium mb-8 border border-blue-500/20">
            <Zap size={15} className="text-amber-400" />
            SmartDash Studio v2.0 is live — Try it free
          </motion.div>

          {/* Hero Headline */}
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6">
            Data visualization <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
              made beautiful.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
            Transform your raw datasets into stunning, interactive dashboards in minutes. Upload CSV, Excel, or JSON — SmartDash handles the rest.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-6">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 flex items-center gap-2 group"
            >
              Start Building Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-full glass text-white font-semibold text-lg hover:bg-slate-800/80 transition-all flex items-center justify-center border border-slate-700 hover:border-slate-500"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={itemVariants} className="flex items-center gap-6 text-sm text-slate-500 mb-20">
            {["No credit card required", "Free forever plan", "Cancel anytime"].map(text => (
              <span key={text} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Minimal Hero Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="w-full max-w-4xl mx-auto mt-20 relative"
        >
          <div className="glass rounded-2xl p-8 border border-slate-800 shadow-2xl overflow-hidden relative group">
            <div className="flex gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-amber-400/50" />
              <div className="w-3 h-3 rounded-full bg-green-400/50" />
            </div>
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
               <Database size={48} className="text-slate-600 mb-4 animate-pulse" />
               <p className="text-slate-500 font-medium">Connect your data to get started</p>
            </div>
          </div>
        </motion.div>
      </main>


      {/* Features Section */}
      <section className="relative z-10 py-20 px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-4">Everything you need to go from data to insight</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">SmartDash gives you a professional analytics workflow right in the browser — no setup, no code.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass-hover rounded-2xl p-7 border border-slate-800"
            >
              <div className={`w-12 h-12 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-5`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-20 px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center border border-blue-500/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none" />
          <Users size={40} className="text-blue-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your data?</h2>
          <p className="text-slate-300 mb-8 text-lg">Join thousands of analysts building beautiful dashboards with SmartDash.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all group"
          >
            Get started for free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-8 border-t border-slate-800/60 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 size={16} className="text-blue-500" />
          <span className="font-bold text-slate-400">SmartDash</span>
        </div>
        <p>© {new Date().getFullYear()} SmartDash. Built for data-driven teams.</p>
      </footer>
    </div>
  );
}
