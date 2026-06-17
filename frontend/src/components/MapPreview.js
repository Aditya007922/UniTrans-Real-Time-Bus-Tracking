import React from 'react';
import { motion } from 'framer-motion';

const MapPreview = () => {
  // SVG size constants
  const width = 800;
  const height = 600;

  // Modern stylized route path
  const routePath = "M 100,500 L 200,450 L 400,480 L 500,300 L 700,250 L 750,100";
  
  // Key points for GPS pulses
  const pulsePoints = [
    { x: 100, y: 500, label: "Campus Main Gate" },
    { x: 400, y: 480, label: "Academic Block" },
    { x: 750, y: 100, label: "Student Residence" }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0C10]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full opacity-40">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Route Background Line */}
        <path
          d={routePath}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated Progress Line */}
        <motion.path
          d={routePath}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ filter: 'url(#glow)' }}
        />

        {/* Animated Bus Icon */}
        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path("${routePath}")`, offsetRotate: "auto" }}
        >
          {/* Bus Shadow */}
          <circle cx="0" cy="0" r="15" fill="#2563eb" className="opacity-20 blur-md" />
          
          {/* Bus Body */}
          <rect x="-12" y="-8" width="24" height="16" rx="4" fill="white" className="shadow-lg" />
          <rect x="6" y="-6" width="4" height="12" rx="1" fill="#2563eb" />
          
          {/* Bus Windows */}
          <rect x="-8" y="-5" width="4" height="10" rx="1" fill="#e2e8f0" />
          <rect x="-2" y="-5" width="4" height="10" rx="1" fill="#e2e8f0" />
        </motion.g>

        {/* GPS Pulse Pulse indicators */}
        {pulsePoints.map((point, i) => (
          <g key={i}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="20"
              fill="#2563eb"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
            <circle cx={point.x} cy={point.y} r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
          </g>
        ))}
      </svg>

      {/* Floating Telemetry Cards (Simplified mockups) */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">42km/h</span>
          </div>
          <div>
            <p className="text-[8px] font-black text-white/40 uppercase">Current Velocity</p>
            <p className="text-xs font-bold text-white tracking-widest">STABLE SYNC</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 right-20 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-[8px] font-black text-white/40 uppercase">GPS Ping</p>
            <p className="text-xs font-bold text-white tracking-widest">LATENCY: 14MS</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapPreview;
