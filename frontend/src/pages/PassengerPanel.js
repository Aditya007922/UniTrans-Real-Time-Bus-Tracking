import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, doc, onSnapshot, getDocs, query, where, orderBy } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';
import socketService from '../services/socket';
import axios from 'axios';
import {
   Search, Bus, Bell, Menu, Compass, Navigation, User, Home, Shield, LogOut, Clock, MapPin, Gauge
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const getDistance = (lat1, lon1, lat2, lon2) => {
   const R = 6371;
   const dLat = (lat2 - lat1) * Math.PI / 180;
   const dLon = (lon2 - lon1) * Math.PI / 180;
   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
};

export default function PassengerPanel({ darkMode, toggleDarkMode }) {
   const [searchId, setSearchId] = useState('');
   const [activeBus, setActiveBus] = useState(null);
   const [activeRoute, setActiveRoute] = useState(null);
   const [activeTab, setActiveTab] = useState('routes');

   useEffect(() => {
      console.log("ACTIVE TAB:", activeTab);
   }, [activeTab]);
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

   const [routes, setRoutes] = useState([]);
   const [buses, setBuses] = useState([]);
   const [alerts, setAlerts] = useState([]);
   useEffect(() => {
      console.log("ROUTES STATE:", routes);
      console.log("BUSES STATE:", buses);
      console.log("ALERTS STATE:", alerts);
   }, [routes, buses, alerts]);
   const [loading, setLoading] = useState(true);

   // Initialize Socket and Global Data
   const [userLocation, setUserLocation] = useState(null);

   useEffect(() => {
      if (!navigator.geolocation) return;
      const id = navigator.geolocation.watchPosition(
         (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
         (err) => console.warn("GPS Access Denied"),
         { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(id);
   }, []);

   useEffect(() => {
      socketService.connect();

      const fetchGlobalData = async () => {
         console.log('📡 [API] Initiating data sync...');
         try {
            setLoading(true);
            const endpoints = ['routes', 'buses', 'alerts'];
            const results = await Promise.all(
               endpoints.map(ep => fetch(`${API_BASE}/${ep}`).then(async res => {
                  const json = await res.json();
                  console.log(`📥 [API] ${ep.toUpperCase()} response:`, json);
                  if (!json.success) throw new Error(`API ${ep} failed`);
                  return json.data;
               }))
            );

            const [rData, bData, aData] = results;

            console.log("ROUTES RAW:", rData);
            console.log("BUSES RAW:", bData);
            console.log("ALERTS RAW:", aData);

            setRoutes(rData);
            setBuses(bData);
            setAlerts(aData);

            console.log('✅ [API] Data sequence established:', {
               routes: rData.length,
               buses: bData.length,
               alerts: aData.length
            });
         } catch (err) {
            console.error("❌ [API] Handshake failure:", err.message);
            toast.error("Network synchronization pending...");
         } finally {
            setLoading(false);
         }
      };

      fetchGlobalData();

      // Live Alerts Listener (Firestore for real-time reactivity)
      const unsubAlerts = onSnapshot(query(collection(db, "alerts"), orderBy("timestamp", "desc")), (snap) => {
         const liveAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         setAlerts(liveAlerts);
         console.log('🔔 [SYNC] Real-time alerts refresh:', liveAlerts.length);
      });

      return () => {
         socketService.disconnect();
         unsubAlerts();
      };
   }, []);

   const selectBus = async (busData) => {
      if (!busData) return;
      const bId = busData.busNumber || busData.id;
      setActiveBus(busData);
      setSearchId(bId);

      // Live Location Sync
      socketService.joinBusRoom(bId);
      onSnapshot(doc(db, "liveLocations", bId), (lsnap) => {
         if (lsnap.exists()) setActiveBus(prev => ({ ...prev, ...lsnap.data() }));
      });

      // Route Data Sync
      if (busData.routeId) {
         onSnapshot(doc(db, "routes", busData.routeId), (rsnap) => {
            if (rsnap.exists()) setActiveRoute(rsnap.data());
         });
      }
   };

   const handleSearch = async (e) => {
      if (e) e.preventDefault();
      if (!searchId) return;

      try {
         const q = query(collection(db, "buses"), where("busNumber", "==", searchId));
         const snapshot = await getDocs(q);

         if (!snapshot.empty) {
            const busDoc = snapshot.docs[0];
            const staticData = { id: busDoc.id, ...busDoc.data() };
            await selectBus(staticData);
            toast.success(`Tracking Bus ${searchId}`);
         } else {
            toast.error('Bus not found');
         }
      } catch (err) {
         toast.error('Search failed');
      }
   };

   const routeIntelligence = useMemo(() => {
      if (!activeBus?.latitude || !activeRoute?.stops?.length) return null;
      const stops = activeRoute.stops;
      if (stops.length === 0) return null;

      const busPos = { lat: activeBus.latitude, lng: activeBus.longitude };

      let minD = Infinity;
      let closestIdx = 0;
      stops.forEach((s, idx) => {
         if (s.lat && s.lng) {
            const d = getDistance(busPos.lat, busPos.lng, s.lat, s.lng);
            if (d < minD) { minD = d; closestIdx = idx; }
         }
      });

      const speed = activeBus.speed || 32;
      const lastStop = stops[stops.length - 1];
      const distToDest = (lastStop && lastStop.lat) ? getDistance(busPos.lat, busPos.lng, lastStop.lat, lastStop.lng) : 0;
      const eta = Math.round((distToDest / (speed || 1)) * 60);

      return {
         currentSpeed: speed,
         eta: eta > 0 ? eta : 5,
         closestIdx,
         distance: distToDest.toFixed(1)
      };
   }, [activeBus, activeRoute]);

   const nearestStop = useMemo(() => {
      if (!userLocation || !routes.length) return null;
      let closest = null;
      let minD = Infinity;

      routes.forEach(route => {
         route.stops?.forEach(stop => {
            const d = getDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
            if (d < minD) {
               minD = d;
               closest = { ...stop, distance: d.toFixed(1) };
            }
         });
      });
      return closest;
   }, [userLocation, routes]);

   const handleLogout = async () => {
      try {
         await auth.signOut();
         toast.success("Disconnected from UniTrans");
         window.location.reload();
      } catch (err) {
         toast.error("Logout failed");
      }
   };

   return (
      <div className="flex justify-center bg-[#F8FAFC] min-h-screen font-inter text-gray-900">
         {/* MOBILE VIEWPORT EMULATION */}
         <div className="w-full max-w-[390px] h-[844px] bg-white relative flex flex-col shadow-2xl overflow-hidden self-center border-[8px] border-gray-900 rounded-[3rem]">

            {/* SIDEBAR DRAWER */}
            <AnimatePresence>
               {isSidebarOpen && (
                  <>
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute inset-0 bg-black/60 z-[2000] backdrop-blur-sm"
                     />
                     <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-0 left-0 bottom-0 w-[280px] bg-white z-[2100] shadow-2xl p-8 flex flex-col"
                     >
                        <div className="flex items-center gap-3 mb-12">
                           <div className="w-10 h-10 bg-[#3DBE3D] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-green-100 text-xl">U</div>
                           <span className="text-2xl font-black text-gray-900 tracking-tighter">UniTrans</span>
                        </div>

                        <nav className="space-y-2">
                           {[
                              { icon: <Home size={20} />, label: 'Dashboard', id: 'home' },
                              { icon: <Compass size={20} />, label: 'All Routes', id: 'routes' },
                              { icon: <Bus size={20} />, label: 'Active Fleet', id: 'buses' },
                              { icon: <Shield size={20} />, label: 'Alert Center', id: 'alerts' },
                              { icon: <User size={20} />, label: 'My Account', id: 'profile' },
                           ].map((item) => (
                              <button
                                 key={item.id}
                                 onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                 className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-green-50 text-[#3DBE3D]' : 'text-gray-500 hover:bg-gray-50'}`}
                              >
                                 {item.icon}
                                 {item.label}
                              </button>
                           ))}
                        </nav>

                        <div className="mt-auto pt-8 border-t border-gray-100">
                           <button
                              onClick={handleLogout}
                              className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 group"
                           >
                              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                              SIGN OUT
                           </button>
                        </div>
                     </motion.div>
                  </>
               )}
            </AnimatePresence>

            {/* HEADER (80px) */}
            <header className="h-[80px] bg-white border-b border-[#f1f1f1] px-6 flex items-center justify-between z-[1100] shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
               <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 transition-transform active:scale-90 hover:bg-gray-50 rounded-xl"
               >
                  <Menu size={26} strokeWidth={2.5} className="text-[#111827]" />
               </button>
               <div className="flex flex-col items-center">
                  <span className="text-2xl font-black tracking-tight text-[#111827]">UniTrans</span>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.25em] -mt-1">Real-Time Tracking</span>
               </div>
               <button
                  onClick={() => setActiveTab('alerts')}
                  className="p-2 relative transition-transform active:scale-90 hover:bg-red-50 rounded-xl group"
               >
                  <Bell size={26} strokeWidth={2.5} className="text-[#111827] group-hover:text-red-500 transition-colors" />
                  {alerts.length > 0 && (
                     <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce shadow-md shadow-red-200"></div>
                  )}
               </button>
            </header>

            {/* VIEW CONTENT */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
               <AnimatePresence mode="wait">
                  {activeTab === 'home' ? (
                     <motion.div key="home" className="flex-1 flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* MAP AREA (70%) */}
                        <div className="flex-[0.7] relative">
                           <MapComponent busIdFilter={activeBus?.busNumber} onBusSelect={selectBus} />

                           {/* NEAREST STOP OVERLAY */}
                           {nearestStop && (
                              <div className="absolute top-24 left-6 right-6 z-[1000] pointer-events-none">
                                 <div className="bg-[#111827]/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-white/10 pointer-events-auto">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-[#3DBE3D] rounded-full flex items-center justify-center text-white shadow-lg">
                                          <Navigation size={14} fill="white" />
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nearest Stop</p>
                                          <p className="text-[11px] font-black text-white">{nearestStop.name}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[11px] font-black text-[#3DBE3D]">{nearestStop.distance} km</p>
                                       <p className="text-[9px] font-black text-gray-500 uppercase">Walking Distance</p>
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* OVERLAY SEARCH */}
                           <div className="absolute top-6 left-6 right-6 z-[1000]">
                              <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/50 flex items-center p-2">
                                 <div className="w-12 h-12 flex items-center justify-center text-[#3DBE3D]"><Search size={22} strokeWidth={3} /></div>
                                 <input
                                    placeholder="ENTER BUS NUMBER"
                                    className="flex-1 px-2 outline-none text-xs font-black bg-transparent tracking-widest uppercase"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                 />
                                 <button className="bg-[#3DBE3D] text-white p-3.5 rounded-full shadow-lg shadow-green-200 active:scale-95 transition-all outline-none border-none">
                                    <Navigation size={22} fill="white" />
                                 </button>
                              </form>
                           </div>
                        </div>

                        {/* BOTTOM DRAWER (30%) */}
                        <div className="flex-[0.3] bg-white rounded-t-[32px] relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] p-8 flex flex-col">
                           <AnimatePresence mode="wait">
                              {activeBus ? (
                                 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1.5">Unit {activeBus.busNumber}</span>
                                          <h2 className="text-2xl font-black text-[#111827] leading-none mb-1">{activeBus.driverName || 'UniTrans Driver'}</h2>
                                          <a href={`tel:${activeBus.driverPhone}`} className="text-[11px] font-black text-[#3DBE3D] hover:underline mb-3">
                                             {activeBus.driverPhone || '+91 00000 00000'}
                                          </a>
                                          <div className="flex items-center gap-2">
                                             <span className={`w-2.5 h-2.5 rounded-full ${activeBus.status === 'online' ? 'bg-[#3DBE3D]' : 'bg-red-500'} animate-pulse`}></span>
                                             <span className={`text-[11px] font-black uppercase tracking-widest ${activeBus.status === 'online' ? 'text-[#3DBE3D]' : 'text-red-500'}`}>
                                                {activeBus.status === 'online' ? 'Live on Route' : 'Service Offline'}
                                             </span>
                                          </div>
                                       </div>
                                       <div className="text-center">
                                          <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest block mb-1">Speed</span>
                                          <span className="text-2xl font-black text-[#111827]">{activeBus.speed || 0}<span className="text-xs ml-1 font-bold text-[#6B7280]">km/h</span></span>
                                       </div>
                                       <div className="text-center">
                                          <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest block mb-1 text-right">ETA</span>
                                          <span className="text-2xl font-black text-[#3DBE3D]">{routeIntelligence?.eta || '--'}<span className="text-xs ml-1 font-bold text-[#6B7280]">min</span></span>
                                       </div>
                                    </div>

                                    {/* ROUTE PROGRESS DIAGRAM */}
                                    <div className="relative mt-8 mb-4 px-2">
                                       <div className="flex justify-between items-center mb-3">
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Progress</span>
                                          <span className="text-[10px] font-black text-[#3DBE3D] bg-green-50 px-2 py-0.5 rounded-full">
                                             {Math.round(((routeIntelligence?.closestIdx || 0) / (activeRoute?.stops?.length - 1 || 1)) * 100)}%
                                          </span>
                                       </div>
                                       <div className="h-2 bg-gray-100 rounded-full w-full relative overflow-hidden">
                                          <motion.div
                                             initial={{ width: 0 }}
                                             animate={{ width: `${((routeIntelligence?.closestIdx || 0) / (activeRoute?.stops?.length - 1 || 1)) * 100}%` }}
                                             className="h-full bg-[#3DBE3D] rounded-full shadow-[0_0_10px_rgba(61,190,61,0.4)]"
                                          />
                                       </div>
                                       <div className="flex justify-between relative mt-4">
                                          <div className="flex flex-col items-start max-w-[100px]">
                                             <div className="w-4 h-4 bg-[#3DBE3D] rounded-full border-4 border-white shadow-md z-10 mb-1.5"></div>
                                             <span className="text-[10px] font-black text-[#111827] leading-tight truncate w-full">
                                                {activeRoute?.stops?.[0]?.name || 'Origin'}
                                             </span>
                                          </div>
                                          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                                             <div className="w-5 h-5 bg-white rounded-full border-2 border-[#3DBE3D] shadow-sm z-10 flex items-center justify-center mb-1">
                                                <div className="w-1.5 h-1.5 bg-[#3DBE3D] rounded-full"></div>
                                             </div>
                                             <span className="text-[9px] font-black text-[#3DBE3D] uppercase tracking-tighter">On Way</span>
                                          </div>
                                          <div className="flex flex-col items-end max-w-[100px]">
                                             <div className={`w-4 h-4 rounded-full border-4 border-white shadow-md z-10 mb-1.5 ${(routeIntelligence?.closestIdx || 0) >= (activeRoute?.stops?.length - 1) ? 'bg-[#3DBE3D]' : 'bg-gray-200'}`}></div>
                                             <span className="text-[10px] font-black text-[#111827] leading-tight truncate w-full text-right">
                                                {activeRoute?.stops?.[activeRoute?.stops?.length - 1]?.name || 'Terminal'}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                              ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-[#3DBE3D] mb-5 shadow-inner">
                                       <Bus size={36} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-xl font-black text-[#111827] tracking-tight uppercase">Enter Bus Number</h3>
                                    <p className="text-sm font-medium text-[#6B7280] tracking-tight mt-1 px-8">Track any campus bus in real-time. Try entering 12 or 29.</p>
                                 </div>
                              )}
                           </AnimatePresence>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div key="list" className="flex-1 bg-[#F8FAFC] p-6 overflow-y-auto" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                        <div className="flex items-end justify-between mb-8">
                           <div>
                              <h2 className="text-4xl font-black text-[#111827] tracking-tighter uppercase leading-none">{activeTab}</h2>
                              <div className="h-1.5 w-16 bg-[#3DBE3D] mt-4 rounded-full"></div>
                           </div>
                           {loading && <div className="w-6 h-6 border-4 border-[#3DBE3D] border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        <div className="grid gap-4">
                           <p style={{ color: 'red', fontSize: '20px' }}>
                              ROUTES COUNT: {routes.length}
                           </p>
                           {activeRoute && (
                              <div className="bg-white p-5 rounded-3xl border border-green-200 shadow-md mb-4">
                                 <h3 className="text-xl font-black text-green-600">
                                    {activeRoute.routeName}
                                 </h3>

                                 <p className="text-sm font-bold text-gray-500">
                                    Route Number: {activeRoute.routeNumber}
                                 </p>

                                 <p className="text-sm font-bold text-gray-500">
                                    Duration: {activeRoute.duration}
                                 </p>

                                 <div className="mt-4">
                                    <h4 className="font-black mb-2">Stops</h4>

                                    {activeRoute.stops?.map((stop, index) => (
                                       <div
                                          key={index}
                                          className="p-2 border-b text-sm"
                                       >
                                          {index + 1}. {stop.name}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                           {activeTab === 'routes' && routes.map((route) => (
                              <div key={route.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                 <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-100">
                                       {route.routeNumber || 'R'}
                                    </div>
                                    <div>
                                       <span className="font-black text-lg text-[#111827] block">{route.routeName}</span>
                                       <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{route.stops?.length || 0} Professional Stops</span>
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => {
                                       setActiveRoute(route);
                                       console.log("ROUTE CLICKED:", route);
                                    }}
                                    className="p-3 bg-gray-50 rounded-xl"
                                 >
                                    <Compass size={22} />
                                 </button>
                              </div>
                           ))}

                           {activeTab === 'buses' && buses.map((bus) => (
                              <div key={bus.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                       {bus.busNumber}
                                    </div>
                                    <div>
                                       <span className="font-black text-lg text-[#111827] block">{bus.driverName || 'UniTrans Driver'}</span>
                                       <div className="flex items-center gap-2 mt-1">
                                          <div className={`w-2 h-2 rounded-full ${bus.status === 'online' ? 'bg-[#3DBE3D]' : 'bg-red-500'}`}></div>
                                          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                                             {bus.status === 'online' ? `${bus.speed || 0} KM/H` : 'Offline'}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                                 <button onClick={() => { setActiveTab('home'); selectBus(bus); }} className="px-5 py-2 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all">
                                    Track
                                 </button>
                              </div>
                           ))}

                           {activeTab === 'alerts' && alerts.map((alert) => (
                              <div key={alert.id} className={`p-6 rounded-[2rem] border ${alert.type === 'emergency' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'} shadow-sm`}>
                                 <div className="flex items-center gap-3 mb-3">
                                    {alert.type === 'emergency' ? <Shield size={18} className="text-red-500" /> : <Bell size={18} className="text-[#3DBE3D]" />}
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${alert.type === 'emergency' ? 'text-red-600' : 'text-[#3DBE3D]'}`}>
                                       {alert.type || 'General Info'}
                                    </span>
                                 </div>
                                 <p className="font-bold text-[#111827] mb-2">{alert.message}</p>
                                 <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-widest">
                                    {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                                 </span>
                              </div>
                           ))}

                           {activeTab === 'profile' && auth.currentUser && (
                              <div className="flex flex-col gap-6">
                                 <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl shadow-green-100 uppercase">
                                       {auth.currentUser.displayName?.[0] || auth.currentUser.email?.[0]}
                                    </div>
                                    <h3 className="text-2xl font-black text-[#111827]">{auth.currentUser.displayName || 'UniTrans Student'}</h3>
                                    <p className="text-sm font-medium text-[#6B7280]">{auth.currentUser.email}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
                                       <Clock size={22} className="text-[#3DBE3D] mb-2" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Travel Time</span>
                                       <span className="font-black text-[#111827]">14.2 hrs</span>
                                    </div>
                                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
                                       <MapPin size={22} className="text-[#3DBE3D] mb-2" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Total Trips</span>
                                       <span className="font-black text-[#111827]">84</span>
                                    </div>
                                 </div>
                                 <button className="w-full bg-red-50 text-red-500 py-5 rounded-[2rem] font-bold uppercase tracking-widest active:scale-95 transition-all text-[11px]" onClick={handleLogout}>
                                    Delete Session
                                 </button>
                              </div>
                           )}

                           {!loading && ((activeTab === 'routes' && routes.length === 0) || (activeTab === 'buses' && buses.length === 0) || (activeTab === 'alerts' && alerts.length === 0)) && (
                              <div className="flex flex-col items-center justify-center py-20 text-center">
                                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                                    <Compass size={32} />
                                 </div>
                                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No dynamic data found</p>
                              </div>
                           )}
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </main>

            {/* BOTTOM NAVIGATION */}
            <nav className="h-[85px] bg-white border-t border-[#f1f1f1] flex items-center justify-around px-2 z-[1200] shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
               <NavItem icon={<Home size={28} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
               <NavItem icon={<Compass size={28} />} label="Routes" active={activeTab === 'routes'} onClick={() => setActiveTab('routes')} />
               <NavItem icon={<Bus size={28} />} label="Buses" active={activeTab === 'buses'} onClick={() => setActiveTab('buses')} />
               <NavItem icon={<Shield size={28} />} label="Alerts" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
               <NavItem icon={<User size={28} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </nav>
         </div>
      </div>
   );
}

function NavItem({ icon, label, active, onClick }) {
   return (
      <button
         onClick={onClick}
         className={`flex flex-col items-center flex-1 transition-all ${active ? 'text-[#3DBE3D]' : 'text-[#6B7280]'}`}
      >
         <div className={`p-1.5 rounded-2xl transition-all ${active ? 'bg-green-50' : 'bg-transparent'}`}>
            {icon}
         </div>
         <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-1">{label}</span>
      </button>
   );
}
