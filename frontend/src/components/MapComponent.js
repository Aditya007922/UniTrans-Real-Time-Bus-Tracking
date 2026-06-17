import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import socketService from '../services/socket';

// Custom icons and utilities
const createStopIcon = () => L.divIcon({
  className: 'custom-stop-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center"><svg width="32" height="32" viewBox="0 0 24 24" fill="#3DBE3D"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" /><circle cx="12" cy="9" r="2.5" fill="white" /></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const createBusIcon = (busNumber = "29") => L.divIcon({
  className: 'custom-bus-marker',
  html: `
    <div class="relative flex flex-col items-center">
      <div class="absolute -top-[72px] bg-white px-4 py-2 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-50 flex flex-col items-center min-w-[120px]">
        <span class="text-[11px] font-black text-gray-900 leading-tight">Bus No. ${busNumber}</span>
        <span class="text-[9px] font-bold text-[#3DBE3D] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 bg-[#3DBE3D] rounded-full animate-pulse"></span> 
          Moving
        </span>
        <div class="absolute -bottom-2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-50"></div>
      </div>
      <div class="absolute inset-0 w-12 h-12 bg-[#3DBE3D] rounded-full animate-ping opacity-20"></div>
      <div class="relative w-12 h-12 bg-[#3DBE3D] rounded-full shadow-[0_6px_20px_rgba(61,190,61,0.4)] flex items-center justify-center border-[3.5px] border-white overflow-hidden">
         <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M4 11V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V11M4 11V9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V11M4 11H20" stroke="white" stroke-width="1.5"/></svg>
      </div>
    </div>
  `,
  iconSize: [120, 120],
  iconAnchor: [60, 60]
});

const createLandmarkIcon = (type) => L.divIcon({
  className: 'landmark-marker',
  html: `
    <div class="p-2.5 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center text-lg">
       ${type === 'study' ? '📚' : type === 'sport' ? '🏀' : type === 'food' ? '☕' : type === 'gate' ? '🏛️' : type === 'hostel' ? '🏨' : type === 'admin' ? '🏢' : '📍'}
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 25]
});

const LANDMARKS = [
  { name: 'University Library', pos: [28.4735, 77.4855], type: 'study' },
  { name: 'Main Gate', pos: [28.4755, 77.4900], type: 'gate' },
  { name: 'Sports Complex', pos: [28.4710, 77.4810], type: 'sport' },
  { name: 'Central Cafeteria', pos: [28.4725, 77.4840], type: 'food' },
  { name: 'Hostel Block', pos: [28.4700, 77.4870], type: 'hostel' },
  { name: 'Engineering Building', pos: [28.4745, 77.4820], type: 'study' },
  { name: 'Administration Building', pos: [28.4760, 77.4835], type: 'admin' },
  { name: 'University Campus', pos: [28.4744, 77.4827], type: 'admin' }
];

function MapUpdater({ center, trackingActive, buses }) {
  const map = useMap();
  useEffect(() => {
    if (buses && buses.length > 0 && !center) {
      const bounds = L.latLngBounds(buses.map(b => [b.latitude, b.longitude]));
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
    } else if (center && trackingActive) {
      map.setView(center, map.getZoom() < 16 ? 16 : map.getZoom(), { animate: true });
    }
  }, [center, trackingActive, map, buses]);
  return null;
}

const snapToRoute = (lat, lng, stops) => {
  if (!stops || stops.length < 2) return [lat, lng];
  let minDist = Infinity;
  let snappedPoint = [lat, lng];
  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = stops[i];
    const p2 = stops[i+1];
    const closest = L.LineUtil.closestPointOnSegment(L.point(lat, lng), L.point(p1.lat, p1.lng), L.point(p2.lat, p2.lng));
    const d = L.latLng(lat, lng).distanceTo(L.latLng(closest.x, closest.y));
    if (d < minDist) { minDist = d; snappedPoint = [closest.x, closest.y]; }
  }
  return snappedPoint;
};

function SmoothBusMarker({ bus, routeStops, isFiltered, onSelect }) {
  const [currentPos, setCurrentPos] = useState([bus.latitude, bus.longitude]);
  const animationRef = useRef(null);
  const targetPos = useRef([bus.latitude, bus.longitude]);

  useEffect(() => {
    targetPos.current = snapToRoute(bus.latitude, bus.longitude, routeStops);
  }, [bus.latitude, bus.longitude, routeStops]);

  useEffect(() => {
    const animate = () => {
      setCurrentPos(prev => {
        const dx = targetPos.current[0] - prev[0];
        const dy = targetPos.current[1] - prev[1];
        if (Math.abs(dx) < 0.000001 && Math.abs(dy) < 0.000001) return prev;
        return [prev[0] + dx * 0.05, prev[1] + dy * 0.05];
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  if (!isFiltered && bus.status !== 'online') return null;

  return (
    <Marker position={currentPos} icon={createBusIcon(bus.busNumber)} eventHandlers={{ click: () => onSelect && onSelect(bus) }}>
      <Popup className="custom-popup" offset={[0, -40]}>
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-50 min-w-[140px] text-center">
          <p className="font-black text-gray-900 mb-1">Bus {bus.busNumber}</p>
          <div className="flex items-center justify-center gap-1.5">
             <div className="w-2 h-2 bg-[#3DBE3D] rounded-full"></div>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{bus.speed || 0} KM/H</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapControls({ onLocate, onTypeToggle }) {
  const map = useMap();
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-4">
       {/* Locate Me */}
       <button 
         onClick={onLocate}
         className="w-13 h-13 bg-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.1)] text-[#6B7280] hover:text-[#3DBE3D] hover:scale-110 active:scale-90 transition-all border border-white group"
         title="Center on me"
       >
          <Navigation size={24} className="group-hover:fill-[#3DBE3D]/10" />
       </button>

       {/* Map Layers Toggle */}
       <button 
         onClick={onTypeToggle}
         className="w-13 h-13 bg-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.1)] text-[#6B7280] hover:text-blue-500 hover:scale-110 active:scale-90 transition-all border border-white group"
         title="Toggle Layers"
       >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
       </button>

       {/* Zoom Cluster */}
       <div className="flex flex-col bg-white rounded-[2rem] shadow-[0_8px_25px_rgba(0,0,0,0.1)] overflow-hidden border border-white">
          <button 
            onClick={() => map.setZoom(map.getZoom() + 1)}
            className="w-13 h-13 flex items-center justify-center text-[#111827] hover:bg-gray-50 font-black text-2xl transition-colors active:bg-gray-100"
          >
            +
          </button>
          <div className="mx-4 border-t border-gray-100"></div>
          <button 
            onClick={() => map.setZoom(map.getZoom() - 1)}
            className="w-13 h-13 flex items-center justify-center text-[#111827] hover:bg-gray-50 font-black text-2xl transition-colors active:bg-gray-100"
          >
            -
          </button>
       </div>
    </div>
  );
}

export default function MapComponent({ busIdFilter, routeId, onBusSelect }) {
  const [buses, setBuses] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [mapType, setMapType] = useState('voyager'); // 'voyager' or 'osm'
  const mapRef = useRef(null);

  useEffect(() => {
    const API_BASE = 'http://localhost:5000/api';
    
    // Initial Boot via REST API
    const loadInitialData = async () => {
      try {
        console.log('🗺️ [MAP API] Fetching initial map state...');
        const [bRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/buses`),
          fetch(`${API_BASE}/routes`)
        ]);
        
        const bJson = await bRes.json();
        const rJson = await rRes.json();
        
        console.log('🗺️ [MAP API] Initial buses:', bJson);
        console.log('🗺️ [MAP API] Initial route context:', rJson);

        if (bJson.success) setBuses(bJson.data.filter(b => b.latitude && b.longitude));
        
        if (routeId && rJson.success) {
           const specificRoute = rJson.data.find(r => r.id === routeId);
           if (specificRoute) setRouteData(specificRoute);
        }
      } catch (err) {
        console.error('🗺️ [MAP API] Connectivity failure:', err.message);
      }
    };

    loadInitialData();

    // REST + Firestore Base Data
    const q = busIdFilter ? query(collection(db, "liveLocations"), where("busId", "==", busIdFilter)) : collection(db, "liveLocations");
    const unsubFirestore = onSnapshot(q, (snapshot) => {
      const snapData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(b => b.latitude && b.longitude);
      setBuses(prev => {
         const merged = [...prev];
         snapData.forEach(newBus => {
            const idx = merged.findIndex(b => b.id === (newBus.busNumber || newBus.id));
            if (idx === -1) merged.push(newBus);
            else merged[idx] = { ...merged[idx], ...newBus };
         });
         return merged;
      });
      console.log('📡 [MAP SYNC] Firestore update received');
    });

    if (routeId) {
      onSnapshot(doc(db, "routes", routeId), (docSnap) => { 
        if (docSnap.exists()) {
           setRouteData(docSnap.data());
           console.log('📡 [MAP SYNC] Route geometry updated');
        }
      });
    }

    // Socket.IO Real-Time Stream
    socketService.connect();
    socketService.on('location-update', (data) => {
      setBuses(prev => {
        const index = prev.findIndex(b => b.busId === data.busId || b.id === data.busId);
        if (index === -1) return [...prev, { ...data, id: data.busId }];
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      });
      
      // Update selected bus if it matches the current location broadcast
      if (busIdFilter === data.busNumber || (data.busId && data.busId === busIdFilter)) {
          // If we have a selection callback, we could update parent state here
      }
    });

    return () => {
      unsubFirestore();
      socketService.off('location-update');
    };
  }, [busIdFilter, routeId]);

  const polylinePositions = routeData?.stops?.map(s => [s.lat, s.lng]) || [];

  const handleLocate = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapRef.current) mapRef.current.setView([latitude, longitude], 16, { animate: true });
    }, () => toast.error("Location access denied"));
  };

  return (
    <div className="w-full h-full relative group bg-[#F8FAFC]">
      <MapContainer 
        center={[28.4744, 77.4827]} 
        zoom={15} 
        className="z-0 h-full w-full" 
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer 
          url={mapType === 'voyager' 
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          } 
        />
        {LANDMARKS.map((mark, i) => (
          <Marker 
            key={i} 
            position={mark.pos} 
            icon={createLandmarkIcon(mark.type)}
            eventHandlers={{ click: (e) => e.target.openPopup() }}
          >
            <Popup className="custom-popup" offset={[0, -10]}>
              <div className="bg-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-black text-gray-900 border border-gray-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full"></div>
                {mark.name}
              </div>
            </Popup>
          </Marker>
        ))}
        {polylinePositions.length > 0 && (
          <>
            <Polyline positions={polylinePositions} pathOptions={{ color: '#3DBE3D', weight: 12, opacity: 0.12, lineCap: 'round' }} />
            <Polyline positions={polylinePositions} pathOptions={{ color: '#3DBE3D', weight: 6, opacity: 1, lineJoin: 'round', lineCap: 'round' }} />
            {routeData.stops.map((stop, idx) => (
              <Marker key={`stop-${idx}`} position={[stop.lat, stop.lng]} icon={createStopIcon()} />
            ))}
          </>
        )}
        {buses.map((bus) => (
          <SmoothBusMarker key={bus.id} bus={bus} routeStops={routeData?.stops} isFiltered={!!busIdFilter} onSelect={onBusSelect} />
        ))}
        <MapUpdater center={busIdFilter && buses[0] ? [buses[0].latitude, buses[0].longitude] : null} trackingActive={!!busIdFilter} buses={buses} />
        
        <MapControls onLocate={handleLocate} onTypeToggle={() => setMapType(prev => prev === 'voyager' ? 'osm' : 'voyager')} />
      </MapContainer>

      {/* FIXED MAP HUD (Google Maps Style) */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
         <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-white flex items-center gap-3 pointer-events-auto cursor-help">
            <div className="relative flex items-center justify-center">
               <div className="w-2.5 h-2.5 bg-[#3DBE3D] rounded-full"></div>
               <div className="absolute inset-0 w-2.5 h-2.5 bg-[#3DBE3D] rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">Live Tracking</span>
         </div>
      </div>
    </div>
  );
}
