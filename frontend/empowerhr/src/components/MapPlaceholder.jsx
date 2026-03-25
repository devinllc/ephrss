import React from 'react';
import { FiMapPin, FiCrosshair, FiMaximize2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MapPlaceholder = ({ points = [], center = { lat: 0, lng: 0 }, zoom = 10 }) => {
  return (
    <div className="w-full h-[450px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
      {/* Radar Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(#22d3ee 0.5px, transparent 0.5px), linear-gradient(90deg, #22d3ee 0.5px, transparent 0.5px)', 
          backgroundSize: '40px 40px' 
        }}></div>
      </div>
      
      {/* Radar Scanning Sweep */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-cyan-500/20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [1, 1.2], 
          opacity: [0.1, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Concentric Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-cyan-500/10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-cyan-500/5"></div>

      {/* Crosshair Animation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-30"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-cyan-400"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-cyan-400"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-cyan-400"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-cyan-400"></div>
      </motion.div>

      {/* Content */}
      <div className="z-10 text-center flex flex-col items-center">
        <div className="bg-cyan-500/20 p-4 rounded-full mb-4 border border-cyan-500/30 backdrop-blur-sm">
          <FiCrosshair className="text-4xl text-cyan-400 animate-pulse" />
        </div>
        <h3 className="text-white font-bold text-xl tracking-wider uppercase mb-2">Live Node Monitoring</h3>
        <p className="text-cyan-400/60 text-xs font-mono mb-4">COORDINATES: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | ZOOM: {zoom}.0</p>
        
        {points.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 px-6 max-w-md">
            {points.slice(0, 4).map((p, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="px-3 py-1.5 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 text-[10px] text-cyan-300 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                {p.name || `Node-${i+1}`}: {p.lat.toFixed(2)}, {p.lng.toFixed(2)}
              </motion.div>
            ))}
            {points.length > 4 && (
              <div className="px-3 py-1.5 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 text-[10px] text-cyan-500">
                +{points.length - 4} more nodes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Interface Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[10px] text-slate-400 font-mono">ENCRYPTED FEED ACTIVE</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-[10px] font-mono">
            <span>CHRG: 98%</span>
            <span>SIG: 5/5</span>
        </div>
      </div>
      
      <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition bg-slate-800/50 p-2 rounded-lg backdrop-blur">
        <FiMaximize2 />
      </button>
    </div>
  );
};

export default MapPlaceholder;
