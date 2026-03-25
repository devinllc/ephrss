import React from 'react';
import { motion } from 'framer-motion';

const PerformanceChart = ({ data = [], type = 'bar' }) => {
  // Simple custom chart simulation using SVG/HTML
  const maxVal = Math.max(...data.map(d => d.value), 100);
  
  return (
    <div className="w-full h-64 flex items-end gap-2 px-4 pb-8 pt-4 relative overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100">
      {/* Target markers */}
      <div className="absolute left-0 right-0 h-px bg-slate-200" style={{ bottom: '25%' }}></div>
      <div className="absolute left-0 right-0 h-px bg-slate-200" style={{ bottom: '50%' }}></div>
      <div className="absolute left-0 right-0 h-px bg-slate-200" style={{ bottom: '75%' }}></div>
      
      {data.map((item, i) => {
        const heightPercent = (item.value / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`w-full max-w-[40px] rounded-t-lg shadow-sm transition-all group-hover:brightness-110 ${item.color || 'bg-indigo-500'}`}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                {item.value}%
              </div>
            </motion.div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate w-full text-center">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PerformanceChart;
