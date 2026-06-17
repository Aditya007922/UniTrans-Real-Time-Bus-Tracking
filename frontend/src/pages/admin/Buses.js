import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Bus, User, Navigation, Plus, Hash, Clock, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminBuses({ darkMode }) {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [newBus, setNewBus] = useState({ 
    busNumber: '', 
    driverId: '', 
    routeId: '',
    status: 'offline'
  });

  useEffect(() => {
    const API_BASE = 'http://localhost:5000/api';

    const loadAdminData = async () => {
      try {
        console.log('📦 [ADMIN API] Syncing fleet management data...');
        const endpoints = ['buses', 'routes'];
        const [bRes, rRes] = await Promise.all(
          endpoints.map(ep => fetch(`${API_BASE}/${ep}`).then(res => res.json()))
        );

        console.log('📦 [ADMIN API] Buses load:', bRes);
        console.log('📦 [ADMIN API] Routes load:', rRes);

        if (bRes.success) setBuses(bRes.data);
        if (rRes.success) setRoutes(rRes.data);

        // Drivers currently fetched from direct collection query (as per original logic)
        // We will stick to initial logic but ensure it's logged
      } catch (err) {
        console.error('📦 [ADMIN API] Load failure:', err.message);
        toast.error('System synchronization issue');
      }
    };

    loadAdminData();

    // Listeners for modifications
    const unsubBuses = onSnapshot(collection(db, "buses"), (snap) => {
        setBuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        console.log('🔄 [ADMIN SYNC] Fleet list updated');
    });

    const unsubDrivers = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), (snapshot) => {
      setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRoutes = onSnapshot(collection(db, "routes"), (snapshot) => {
      setRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
       unsubBuses();
       unsubDrivers();
       unsubRoutes();
    };
  }, []);

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!newBus.busNumber || !newBus.driverId || !newBus.routeId) {
      return toast.error('Check all registration inputs');
    }

    try {
      await addDoc(collection(db, "buses"), {
        ...newBus,
        lastUpdated: new Date().toISOString()
      });
      setNewBus({ busNumber: '', driverId: '', routeId: '', status: 'offline' });
      toast.success('Vehicle registered successfully');
    } catch (err) {
      toast.error('Registration failure');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black dark:text-white">Fleet Management</h1>
            <p className="text-gray-400 font-bold mt-2 font-medium">Coordinate and register transport units.</p>
          </div>
          <div className="bg-primary/10 px-6 py-4 rounded-3xl border border-primary/20 flex items-center">
             <ShieldCheck className="text-primary mr-3" />
             <span className="text-primary font-black text-sm uppercase tracking-widest">{buses.length} TOTAL UNITS</span>
          </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-2xl font-black mb-10 flex items-center dark:text-white">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-4 text-primary">
            <Plus size={20} strokeWidth={3} />
          </div>
          Register New Vehicle
        </h3>
        
        <form onSubmit={handleAddBus} className="grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">License Plate</label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={newBus.busNumber}
                onChange={e => setNewBus({...newBus, busNumber: e.target.value.toUpperCase()})}
                className={`w-full py-4 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all font-bold ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-primary text-white' : 'bg-gray-50 border-gray-100 focus:border-primary'
                }`}
                placeholder="e.g. WB-01-1234"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Assign Host</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <select 
                value={newBus.driverId}
                onChange={e => setNewBus({...newBus, driverId: e.target.value})}
                className={`w-full py-4 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all font-bold appearance-none bg-transparent ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-primary text-white' : 'bg-gray-50 border-gray-100 focus:border-primary'
                }`}
              >
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d.id} value={d.uid}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Network Route</label>
            <div className="relative group">
              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <select 
                value={newBus.routeId}
                onChange={e => setNewBus({...newBus, routeId: e.target.value})}
                className={`w-full py-4 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all font-bold appearance-none bg-transparent ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-primary text-white' : 'bg-gray-50 border-gray-100 focus:border-primary'
                }`}
              >
                <option value="">Select Route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <button className="btn-primary h-[60px] self-end shadow-primary/30 font-black">
            Register Unit
          </button>
        </form>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {buses.map(bus => (
          <motion.div 
            whileHover={{ y: -8 }}
            key={bus.id} 
            className="card relative group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Bus size={28} />
              </div>
              <div className="flex items-center space-x-2">
                 <div className={`w-2.5 h-2.5 rounded-full ${bus.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${
                   bus.status === 'online' ? 'text-green-500' : 'text-gray-400'
                 }`}>
                   {bus.status}
                 </span>
              </div>
            </div>
            
            <h4 className="text-3xl font-black dark:text-white mb-8 tracking-tighter group-hover:text-primary transition-colors">{bus.busNumber}</h4>
            
            <div className="space-y-6 border-t border-gray-50 dark:border-slate-800 pt-8 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mr-4">
                   <User className="text-gray-400" size={14} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase">Operator</p>
                   <p className="text-sm font-bold dark:text-white">{drivers.find(d => d.uid === bus.driverId)?.name || 'Redacting...'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mr-4">
                   <Navigation className="text-gray-400" size={14} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase">Registered Route</p>
                   <p className="text-sm font-bold dark:text-white">{routes.find(r => r.id === bus.routeId)?.name || 'Central Hub'}</p>
                </div>
              </div>
            </div>

            {bus.status === 'online' ? (
              <div className="p-4 bg-primary/10 rounded-[1.5rem] border border-primary/20 flex justify-between items-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <div className="flex items-center">
                   <Clock size={16} className="mr-2" />
                   <span className="text-[10px] font-black uppercase">LIVE NOW</span>
                </div>
                <MoreHorizontal size={20} className="opacity-40" />
              </div>
            ) : (
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] flex justify-between items-center text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Start</span>
                    <MoreHorizontal size={20} className="opacity-20" />
                </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
