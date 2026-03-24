import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BsStars, 
  BsGraphUp, 
  BsLightningCharge, 
  BsShieldCheck, 
  BsExclamationTriangle 
} from 'react-icons/bs';
import { getCompanyIntelligence, triggerRootCause } from '../utils/api';

const IntelligenceDashboard = () => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCompanyIntelligence();
        setIntelligence(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <BsStars className="text-indigo-400" /> Intelligence Hub
          </h1>
          <p className="text-slate-400 mt-2 text-lg">AI-powered workforce intelligence & predictive analysis</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium">
            AI Active
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
            System Healthy
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <BsGraphUp size={24} />
            </div>
            <h2 className="text-2xl font-bold">Organizational Health</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Company Productivity</p>
              <p className="text-3xl font-bold text-white">87%</p>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[87%] rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>
            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Burnout Risk</p>
              <p className="text-3xl font-bold text-amber-400">Low</p>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[12%] rounded-full"></div>
              </div>
            </div>
            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Task Velocity</p>
              <p className="text-3xl font-bold text-cyan-400">+14%</p>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 w-[65%] rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <BsLightningCharge size={24} />
            </div>
            <h2 className="text-2xl font-bold">Action Engine</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">Recommendation</p>
              <p className="text-slate-200 text-sm font-medium mb-3">
                3 employees in Design Team are nearing capacity. Consider reassigning upcoming UI tasks.
              </p>
              <button className="text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm transition-all font-semibold">
                Auto-Reassign
              </button>
            </div>
            
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Insight</p>
              <p className="text-slate-200 text-sm font-medium">
                Predictive analysis shows a 12% boost in efficiency when tasks are started before 10 AM.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Critical Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-slate-900/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
              <BsExclamationTriangle size={24} />
            </div>
            <h2 className="text-2xl font-bold">Critical Intelligence Alerts</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-4 text-slate-400 font-medium px-4">Entity</th>
                  <th className="pb-4 text-slate-400 font-medium px-4">Alert Trigger</th>
                  <th className="pb-4 text-slate-400 font-medium px-4">Severity</th>
                  <th className="pb-4 text-slate-400 font-medium px-4">AI Sentiment</th>
                  <th className="pb-4 text-slate-400 font-medium px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr className="group">
                  <td className="py-4 px-4 font-medium text-white">Development Team</td>
                  <td className="py-4 px-4 text-slate-300">Unusual surge in late-night task completions (200% increase)</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20">Critical</span>
                  </td>
                  <td className="py-4 px-4 text-amber-400 italic font-medium">Risk of Impending Burnout</td>
                  <td className="py-4 px-4">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-2">
                      Analyze <BsStars />
                    </button>
                  </td>
                </tr>
                <tr className="group">
                  <td className="py-4 px-4 font-medium text-white">Marketing Pipeline</td>
                  <td className="py-4 px-4 text-slate-300">Stagnation detected in 'Lead Qualification' phase</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20">Warning</span>
                  </td>
                  <td className="py-4 px-4 text-cyan-400 italic font-medium">Bottleneck Identified</td>
                  <td className="py-4 px-4">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-2">
                      Analyze <BsStars />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
