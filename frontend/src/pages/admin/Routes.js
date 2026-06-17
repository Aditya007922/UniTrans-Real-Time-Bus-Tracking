import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { MapPin, Navigation, Plus, Trash2, ListOrdered, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminRoutes({ darkMode }) {
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({ name: '', description: '', stops: [] });
  const [stopInput, setStopInput] = useState({ name: '', lat: '', lng: '' });

  useEffect(() => {
    const API_BASE = 'http://localhost:5000/api';

    const loadNetworkData = async () => {
      try {
        console.log('🛤️ [NETWORK API] Aligning transit trajectories...');
        const res = await fetch(`${API_BASE}/routes`);
        const json = await res.json();
        
        console.log('🛤️ [NETWORK API] Path discovery:', json);
        if (json.success) setRoutes(json.data);
      } catch (err) {
        console.error('🛤️ [NETWORK API] Path sync error:', err.message);
        toast.error('Network alignment pending');
      }
    };

    loadNetworkData();

    const unsubRoutes = onSnapshot(collection(db, "routes"), (snapshot) => {
      setRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('🔄 [NETWORK SYNC] Trajectories recalibrated');
    });

    return () => unsubRoutes();
  }, []);

  const addStop = () => {
    if (!stopInput.name || !stopInput.lat || !stopInput.lng) {
      return toast.error('Check stop coordinates');
    }
    setNewRoute({
      ...newRoute,
      stops: [...newRoute.stops, { ...stopInput, lat: parseFloat(stopInput.lat), lng: parseFloat(stopInput.lng) }]
    });
    setStopInput({ name: '', lat: '', lng: '' });
    toast.success('Breakpoint added');
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!newRoute.name || newRoute.stops.length < 2) {
      return toast.error('Require at least 2 breakpoints');
    }

    try {
      await addDoc(collection(db, "routes"), {
        ...newRoute,
        createdAt: new Date().toISOString()
      });
      setNewRoute({ name: '', description: '', stops: [] });
      toast.success('Route deployed to network');
    } catch (err) {
      toast.error('Deployment failed');
    }
  };

  return (
    <div className="space-y-12">
       <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black dark:text-white">Transit Network</h1>
            <p className="text-gray-400 font-bold mt-2 font-medium">Design and calibrate transport trajectories.</p>
          </div>
          <div className="bg-secondary/10 px-6 py-4 rounded-3xl border border-secondary/20 flex items-center">
             <ShieldCheck className="text-secondary mr-3" />
             <span className="text-secondary font-black text-sm uppercase tracking-widest">{routes.length} ACTIVE PATHS</span>
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Create Route Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-2xl font-black mb-10 flex items-center dark:text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-4 text-primary">
               <Navigation size={20} strokeWidth={3} />
            </div>
            Compose Route
          </h3>
          
          <form onSubmit={handleCreateRoute} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Route Identity</label>
              <input 
                type="text" 
                value={newRoute.name}
                onChange={e => setNewRoute({...newRoute, name: e.target.value.toUpperCase()})}
                className={`w-full py-4 px-6 rounded-2xl outline-none border-2 transition-all font-bold ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-primary text-white' : 'bg-gray-50 border-gray-100 focus:border-primary'
                }`}
                placeholder="e.g. ALPHA-CENTRAL EXPRESS"
              />
            </div>

            {/* Stop Management */}
            <div className={`p-8 rounded-[2.5rem] border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/30' : 'border-gray-100 bg-gray-50'}`}>
               <h4 className="flex items-center text-sm font-black uppercase tracking-widest mb-6 dark:text-gray-400">
                 <ListOrdered size={16} className="mr-2" />
                 Path Breakpoints
               </h4>
               
               <div className="grid gap-6">
                 <input 
                   type="text" 
                   value={stopInput.name}
                   onChange={e => setStopInput({...stopInput, name: e.target.value})}
                   className={`w-full py-3 px-5 rounded-xl border-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary font-bold transition-all h-[55px]`}
                   placeholder="Major Landmark Name"
                 />
                 <div className="flex gap-4">
                   <input 
                     type="number" 
                     step="any"
                     value={stopInput.lat}
                     onChange={e => setStopInput({...stopInput, lat: e.target.value})}
                     className={`flex-1 py-3 px-5 rounded-xl border-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary font-bold transition-all h-[55px]`}
                     placeholder="Latitude"
                   />
                   <input 
                     type="number" 
                     step="any"
                     value={stopInput.lng}
                     onChange={e => setStopInput({...stopInput, lng: e.target.value})}
                     className={`flex-1 py-3 px-5 rounded-xl border-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary font-bold transition-all h-[55px]`}
                     placeholder="Longitude"
                   />
                 </div>
                 <button 
                   type="button"
                   onClick={addStop}
                   className="w-full py-4 bg-primary/10 text-primary rounded-xl font-black flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                 >
                   <Plus size={18} className="mr-2" strokeWidth={3} />
                   APPEND BREAKPOINT
                 </button>
               </div>

               {/* Stops List */}
               <div className="mt-8 space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                 {newRoute.stops.map((s, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                     <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs mr-4">{i + 1}</div>
                        <span className="font-bold dark:text-white text-sm">{s.name}</span>
                     </div>
                     <button 
                       onClick={() => setNewRoute({...newRoute, stops: newRoute.stops.filter((_, idx) => idx !== i)})}
                       className="text-red-400 hover:text-red-500 transition-colors p-2"
                     >
                        <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>

            <button type="submit" className="btn-primary w-full h-[70px] shadow-primary/30 font-black">
               DEPLOY NETWORK PATH
            </button>
          </form>
        </motion.div>

        {/* Existing Routes List */}
        <div className="space-y-8">
          {routes.map(route => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={route.id} 
              className="card group hover:translate-y-[-4px] transition-all"
            >
              <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-lg shadow-secondary/5">
                    <Navigation size={28} />
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Breakpoints</span>
                    <span className="text-xl font-black dark:text-white">{route.stops?.length || 0}</span>
                 </div>
              </div>
              
              <h4 className="text-3xl font-black dark:text-white mb-8 tracking-tighter group-hover:text-secondary transition-colors">{route.name}</h4>
              
              <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-50 dark:border-slate-800">
                {route.stops?.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center bg-gray-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                    <MapPin size={12} className="text-primary mr-2" />
                    <span className="text-xs font-bold dark:text-gray-300">{s.name}</span>
                  </div>
                ))}
                {(route.stops?.length > 3) && (
                   <div className="flex items-center px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 text-[10px] font-black">
                     + {route.stops.length - 3} MORE
                   </div>
                )}
              </div>

              <div className="mt-8">
                 <button className="w-full py-4 text-xs font-black uppercase text-gray-500 border-2 border-gray-50 dark:border-slate-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-secondary transition-all flex items-center justify-center group">
                    View Complete Telemetry
                    <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
