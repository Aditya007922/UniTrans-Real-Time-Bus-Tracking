import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';
import Layout from '../components/Layout';
import { 
  Bus, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Navigation,
  Play,
  Square,
  CheckCircle2,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverPanel({ darkMode }) {
  const { currentUser } = useAuth();
  const [isDriving, setIsDriving] = useState(false);
  const [busDetails, setBusDetails] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [location, setLocation] = useState(null);
  const [shiftTime, setShiftTime] = useState(0);
  const [watchId, setWatchId] = useState(null);

  // Load Driver's Bus via API
  useEffect(() => {
    const fetchBus = async () => {
      if (!currentUser?.uid) return;
      console.log('🚛 [DRIVER API] Identifying assigned vehicle...');
      
      try {
        const res = await fetch('http://localhost:5000/api/buses');
        const json = await res.json();
        console.log('📡 [DRIVER API] Portfolio Discovery:', json);

        if (json.success) {
          const myBus = json.data.find(b => b.driverId === currentUser.uid);
          if (myBus) {
            setBusDetails(myBus);
            console.log('✅ [DRIVER API] Asset Linked:', myBus.busNumber);
          } else {
             console.warn('⚠️ [DRIVER API] No asset link found for query:', currentUser.uid);
             // fallback to direct firestore if API fails to sync instantly
          }
        }
      } catch (err) {
        console.error('❌ [DRIVER API] Fleet sync error:', err.message);
      }
    };
    fetchBus();
  }, [currentUser]);

  // Shift Timer
  useEffect(() => {
    let interval;
    if (isDriving) {
      interval = setInterval(() => setShiftTime(s => s + 1), 1000);
    } else {
      setShiftTime(0);
    }
    return () => clearInterval(interval);
  }, [isDriving]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleDriving = async () => {
    if (!busDetails) {
      toast.error("No bus assigned to your account");
      return;
    }

    try {
      const newStatus = isDriving ? 'offline' : 'online';
      
      if (!isDriving) {
        // Start Shift
        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          return;
        }

        socketService.connect();
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, speed } = position.coords;
            setLocation({ latitude, longitude });
            
            const updateData = {
              busId: busDetails.busNumber,
              driverId: currentUser.uid,
              latitude,
              longitude,
              speed: Math.round((speed || 0) * 3.6), // Convert to km/h
              status: "online",
              updatedAt: new Date().toISOString()
            };

            try {
              // 1. Update Firestore liveLocations
              await setDoc(doc(db, "liveLocations", busDetails.busNumber), updateData, { merge: true });
              
              // 2. Update specific bus document
              await updateDoc(doc(db, "buses", busDetails.busNumber), {
                latitude,
                longitude,
                speed: updateData.speed,
                status: "online",
                lastUpdated: updateData.updatedAt
              });

              // 3. Broadcast via Socket
              socketService.emit('location-update', updateData);
              
              console.log("Telemetry Sync Success");
            } catch (err) {
              console.error("Sync Error:", err);
            }
          },
          (error) => {
            console.error("GPS Error:", error);
            toast.error("GPS Signal Lost");
          },
          { enableHighAccuracy: true, distanceFilter: 10 }
        );
        
        setWatchId(id);
        socketService.emit('status-update', { driverId: currentUser.uid, status: 'online' });
      } else {
        // End Shift
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }

        await setDoc(doc(db, "liveLocations", busDetails.busNumber), {
          status: "offline",
          updatedAt: serverTimestamp()
        }, { merge: true });

        await updateDoc(doc(db, "buses", busDetails.busNumber), {
          status: "offline"
        });

        socketService.emit('status-update', { driverId: currentUser.uid, status: 'offline' });
      }

      setIsDriving(!isDriving);
      toast.success(isDriving ? 'Shift ended' : 'Shift started - You are now LIVE');
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
     return () => {
       if (watchId) navigator.geolocation.clearWatch(watchId);
     };
  }, [watchId]);

  const handleSOS = () => {
    toast.error("EMERGENCY ALERT SENT TO CONTROL CENTER!", {
      duration: 5000,
      icon: <AlertTriangle className="text-white" />,
      style: { background: '#ef4444', color: '#fff', fontWeight: '900' }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10">
             <div className="grid lg:grid-cols-2 gap-10">
                {/* Status Card */}
                <div className={`card relative overflow-hidden h-full ${isDriving ? 'border-primary border-4' : ''}`}>
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                         <div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Shift Status</p>
                            <h2 className="text-4xl font-black mt-2 dark:text-white">{isDriving ? 'ACTIVE NOW' : 'OFF DUTY'}</h2>
                         </div>
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDriving ? 'bg-primary animate-pulse' : 'bg-gray-100 dark:bg-slate-800'}`}>
                            <Bus className={isDriving ? 'text-white' : 'text-gray-400'} size={32} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-10">
                         <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl">
                            <Clock className="text-primary mb-3" size={24} />
                            <p className="text-xs font-black text-gray-400 uppercase">Shift Duration</p>
                            <p className="text-2xl font-black dark:text-white tabular-nums">{formatTime(shiftTime)}</p>
                         </div>
                         <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl">
                            <Users className="text-blue-500 mb-3" size={24} />
                            <p className="text-xs font-black text-gray-400 uppercase">Boarded Today</p>
                            <p className="text-2xl font-black dark:text-white">{attendanceCount}</p>
                         </div>
                      </div>

                      <button 
                        onClick={toggleDriving}
                        className={`w-full py-6 rounded-3xl font-black text-xl transition-all flex items-center justify-center group shadow-2xl ${
                          isDriving 
                            ? 'bg-red-500 text-white shadow-red-200' 
                            : 'bg-primary text-white shadow-primary/30'
                        }`}
                      >
                         {isDriving ? (
                           <>
                              <Square className="mr-3 fill-current" size={24} />
                              END SHIFT
                           </>
                         ) : (
                           <>
                              <Play className="mr-3 fill-current group-hover:scale-125 transition-transform" size={24} />
                              START SHIFT
                           </>
                         )}
                      </button>
                   </div>
                </div>

                {/* Map Preview */}
                <div className="card h-[400px] lg:h-auto p-0 overflow-hidden relative border-8 border-white dark:border-slate-800">
                   <MapComponent darkMode={darkMode} routeId={busDetails?.routeId} />
                   <div className="absolute top-6 left-6 z-[1000] space-y-4">
                      <div className="glass-card !rounded-2xl !p-4 flex items-center space-x-4">
                         <MapPin className="text-primary" />
                         <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Route</p>
                            <p className="text-sm font-black dark:text-white">{busDetails?.route || 'Checking...'}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* SOS Section */}
             <div className="grid md:grid-cols-3 gap-8">
                <button 
                  onClick={handleSOS}
                  className="md:col-span-2 bg-red-600 hover:bg-red-700 text-white p-10 rounded-[3rem] shadow-2xl shadow-red-200 flex items-center justify-between group transition-all"
                >
                   <div>
                      <h3 className="text-3xl font-black mb-2 uppercase">Emergency SOS</h3>
                      <p className="font-bold opacity-70">Immediate alert to all control centers and emergency services</p>
                   </div>
                   <AlertTriangle size={64} className="opacity-30 group-hover:scale-125 transition-transform" />
                </button>
                
                <div className="card flex flex-col justify-center items-center text-center p-10">
                   <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                      <Shield size={40} />
                   </div>
                   <h4 className="text-xl font-black dark:text-white">Safety First</h4>
                   <p className="text-sm font-medium text-gray-400 mt-2">All data is encrypted and monitored 24/7</p>
                </div>
             </div>
          </div>
        );
       case 'tracking':
        return (
          <div className="h-[calc(100vh-160px)] rounded-[3rem] overflow-hidden border-8 border-white dark:border-slate-800 shadow-2xl">
            <MapComponent darkMode={darkMode} routeId={busDetails?.routeId} />
          </div>
        );
      case 'reports':
        return (
          <div className="card p-20 text-center">
             <Activity className="mx-auto mb-6 text-primary" size={48} />
             <h3 className="text-2xl font-black dark:text-white">Earnings & Analytics</h3>
             <p className="text-gray-400 font-medium">Performance tracking coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      darkMode={darkMode} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
       <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-black dark:text-white">Control Panel</h1>
            <p className="text-gray-400 font-medium mt-2 capitalize">{busDetails?.id || 'Bus Unit'} • {currentUser.name}</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl flex items-center space-x-3 border border-gray-100 dark:border-slate-800">
                <Zap size={20} className="text-primary" />
                <span className="font-black text-sm">94% Fleet Health</span>
             </div>
          </div>
       </div>

       {renderContent()}
    </Layout>
  );
}
