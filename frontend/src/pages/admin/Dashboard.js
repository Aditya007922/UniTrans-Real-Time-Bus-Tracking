import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { 
  Bus, Users, MapPin, UserCheck, AlertTriangle, Activity, Shield, 
  Navigation, Signal, Clock, ChevronRight, List, Info, Bell, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import MapComponent from '../../components/MapComponent';

// Geospatial Helpers
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activeBuses: 0,
    activeRoutes: 0,
    onlineDrivers: 0,
    sosAlerts: 0,
    fleetHealth: '98.2%'
  });

  const [selectedBus, setSelectedBus] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);

  // Fetch Stats via API
  useEffect(() => {
    const API_BASE = 'http://localhost:5000/api';

    const fetchLiveStats = async () => {
      console.log('📊 [DASHBOARD API] Syncing operational metrics...');
      try {
        const res = await fetch(`${API_BASE}/stats`);
        const json = await res.json();
        console.log('📈 [DASHBOARD API] System Snapshot:', json);

        if (json.success) {
          setStats(prev => ({
            ...prev,
            activeBuses: json.data.activeBuses,
            onlineDrivers: json.data.totalDrivers,
            totalBuses: json.data.totalBuses
          }));
        }
      } catch (err) {
        console.error('❌ [DASHBOARD API] Stat sync failure:', err.message);
      }
    };

    fetchLiveStats();

    // Listeners for real-time adjustments
    const unsubBuses = onSnapshot(collection(db, "buses"), (snapshot) => {
      const active = snapshot.docs.filter(doc => doc.data().status === 'online').length;
      setStats(prev => ({ ...prev, activeBuses: active }));
      console.log('🔄 [DASHBOARD SYNC] Fleet status updated');
    });

    const unsubRoutes = onSnapshot(collection(db, "routes"), (snapshot) => {
      setStats(prev => ({ ...prev, activeRoutes: snapshot.size }));
    });

    const unsubDrivers = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), (snapshot) => {
      setStats(prev => ({ ...prev, onlineDrivers: snapshot.size }));
    });

    return () => {
      unsubBuses();
      unsubRoutes();
      unsubDrivers();
    };
  }, []);

  // Sync Route Data for Selected Bus
  useEffect(() => {
    if (selectedBus?.routeId) {
      const unsubRoute = onSnapshot(doc(db, "routes", selectedBus.routeId), (snap) => {
        if (snap.exists()) setActiveRoute(snap.data());
      });
      return () => unsubRoute();
    } else {
      setActiveRoute(null);
    }
  }, [selectedBus?.routeId]);

  const routeInsights = useMemo(() => {
    if (!selectedBus?.latitude || !activeRoute?.stops?.length) return null;
    const stops = activeRoute.stops;
    const busPos = { lat: selectedBus.latitude, lng: selectedBus.longitude };
    
    let minD = Infinity;
    let closestIdx = 0;
    stops.forEach((s, i) => {
      const d = getDistance(busPos.lat, busPos.lng, s.lat, s.lng);
      if (d < minD) { minD = d; closestIdx = i; }
    });

    const speed = selectedBus.speed || 32;
    const dest = stops[stops.length - 1];
    const distToDest = getDistance(busPos.lat, busPos.lng, dest.lat, dest.lng);
    const eta = Math.round((distToDest / (speed || 1)) * 60);

    return {
      closestIdx,
      distance: distToDest.toFixed(1),
      eta: eta > 0 ? eta : 2,
      progress: (closestIdx / (stops.length - 1)) * 100
    };
  }, [selectedBus, activeRoute]);

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      
      {/* 60px HEADER */}
      <header className="h-[60px] bg-white border-b border-gray-100 px-6 flex items-center justify-between z-[1000] shadow-sm">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
              <Bus className="text-[#2563EB]" size={24} />
              <h1 className="text-xl font-black text-[#222222] tracking-tighter">UniTrans <span className="text-[#2563EB]">OPS</span></h1>
           </div>
           
           {/* Header Stats */}
           <div className="hidden lg:flex items-center gap-6 border-l border-gray-100 pl-8">
              <HeaderStat icon={<Bus size={14} />} label="Buses" value={stats.activeBuses} color="text-green-600" />
              <HeaderStat icon={<Navigation size={14} />} label="Routes" value={stats.activeRoutes} color="text-blue-600" />
              <HeaderStat icon={<UserCheck size={14} />} label="Drivers" value={stats.onlineDrivers} color="text-indigo-600" />
              <HeaderStat icon={<AlertTriangle size={14} />} label="SOS" value={stats.sosAlerts} color="text-red-500" />
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="p-2 hover:bg-gray-50 rounded-full relative">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
           </button>
           <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-black text-[#222222]">{currentUser?.name || 'Admin'}</p>
                 <p className="text-[10px] text-gray-400 font-bold uppercase">Controller</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-xs">
                 {currentUser?.name?.charAt(0) || 'A'}
              </div>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: LIVE MAP (70%) */}
        <div className="relative flex-[0.7] h-full bg-[#f8fbff]">
           <MapComponent 
             busIdFilter={null} 
             onBusSelect={setSelectedBus} 
             routeId={selectedBus?.routeId}
           />

           {/* FLOATING OPERATIONAL CARDS */}
           <div className="absolute top-6 left-6 z-[500] flex gap-4">
              <OpCard icon={<Activity />} title="System Status" value="Healthy" color="green" />
              <OpCard icon={<Shield />} title="Safety Score" value={stats.fleetHealth} color="blue" />
           </div>
        </div>

        {/* RIGHT: INSPECTION PANEL (30%) */}
        <aside className="w-[30%] h-full bg-white border-l border-gray-100 flex flex-col shadow-xl z-[600]">
           <AnimatePresence mode="wait">
              {selectedBus ? (
                <motion.div 
                  key={selectedBus.id}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
                >
                   {/* Bus Identity */}
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h2 className="text-3xl font-black text-[#222222]">Bus {selectedBus.busId || selectedBus.busNumber}</h2>
                         <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Unit</p>
                      </div>
                      <div className={`p-4 rounded-2xl ${selectedBus.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                         <Bus size={32} />
                      </div>
                   </div>

                   {/* Key Metrics Grid */}
                   <div className="grid grid-cols-2 gap-6 mb-10">
                      <Metric label="Current Speed" value={`${selectedBus.speed || 0} km/h`} icon={<Activity size={12} />} />
                      <Metric label="Signal Status" value="Excellent" icon={<Signal size={12} />} />
                      <Metric label="ETA to Dest" value={`${routeInsights?.eta || '--'} min`} icon={<Clock size={12} />} />
                      <Metric label="Remaining" value={`${routeInsights?.distance || '0'} km`} icon={<Navigation size={12} />} />
                   </div>

                   {/* Route Info */}
                   <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Navigation className="text-[#2563EB]" size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Route</p>
                            <p className="text-sm font-black text-[#222222]">{activeRoute?.routeName || 'Campus Connector'}</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400">Route Progress</span>
                            <span className="font-black text-[#222222]">{Math.round(routeInsights?.progress || 0)}%</span>
                         </div>
                         <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${routeInsights?.progress || 0}%` }}
                               className="h-full bg-[#2563EB]"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Progress Timeline */}
                   <div>
                      <h4 className="text-xs font-black text-[#222222] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                         <List size={14} /> 
                         Live Stop Sequence
                      </h4>
                      <div className="space-y-6 relative ml-2">
                         <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                         {activeRoute?.stops?.map((stop, i) => (
                            <div key={i} className="flex items-center gap-6 relative">
                               <div className={`w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${i <= (routeInsights?.closestIdx || 0) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                               <div className="flex-1">
                                  <p className={`text-sm font-black ${i <= (routeInsights?.closestIdx || 0) ? 'text-[#222222]' : 'text-gray-400'}`}>{stop.name}</p>
                                  {i === routeInsights?.closestIdx && (
                                     <p className="text-[10px] font-bold text-green-500 uppercase">Reached</p>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <button className="mt-12 w-full py-5 bg-[#222222] text-white rounded-3xl font-black text-sm hover:translate-y-[-2px] transition-transform shadow-xl shadow-gray-200">
                      Open Log Book
                   </button>
                   
                   <button 
                     onClick={() => setSelectedBus(null)}
                     className="mt-4 w-full py-5 border-2 border-gray-100 rounded-3xl font-black text-sm text-gray-400 hover:bg-gray-50 transition-all"
                   >
                      Deselect Unit
                   </button>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                   <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 mb-8 border border-gray-100 shadow-inner">
                      <Bus size={40} />
                   </div>
                   <h3 className="text-xl font-black text-[#222222]">Unit Inspection</h3>
                   <p className="text-sm text-gray-400 font-medium mt-3 max-w-[240px]">
                      Select a bus marker from the live map to initiate a detailed operational breakdown.
                   </p>
                   <div className="mt-10 flex flex-wrap justify-center gap-3">
                      <span className="px-5 py-2 bg-white rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-gray-100 shadow-sm">Real-time GPS</span>
                      <span className="px-5 py-2 bg-white rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-gray-100 shadow-sm">Staff Status</span>
                   </div>
                </div>
              )}
           </AnimatePresence>
        </aside>

      </main>
    </div>
  );
}

function HeaderStat({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3">
       <div className={`p-2 bg-gray-50 rounded-xl ${color}`}>
          {icon}
       </div>
       <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
          <p className={`text-sm font-black ${color}`}>{value}</p>
       </div>
    </div>
  );
}

function OpCard({ icon, title, value, color }) {
  const colors = {
     green: 'bg-green-500 shadow-green-200',
     blue: 'bg-[#2563EB] shadow-blue-200'
  };
  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2.5xl shadow-xl border border-white/50 flex items-center gap-4 min-w-[180px]">
       <div className={`p-3 rounded-2xl text-white ${colors[color]} shadow-lg`}>
          {React.cloneElement(icon, { size: 18 })}
       </div>
       <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-base font-black text-[#222222]">{value}</p>
       </div>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
       <div className="flex items-center gap-2 mb-2 text-gray-400">
          {icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-lg font-black text-[#222222]">{value}</p>
    </div>
  );
}
