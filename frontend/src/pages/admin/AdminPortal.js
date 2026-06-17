import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Dashboard from './Dashboard';
import Routes from './Routes';
import Buses from './Buses';
import MapComponent from '../../components/MapComponent';
import { Users } from 'lucide-react';

export default function AdminPortal({ darkMode }) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard darkMode={darkMode} />;
      case 'tracking':
        return (
          <div className="h-[calc(100vh-160px)] space-y-8">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black dark:text-white">Live Operations</h2>
                  <p className="text-gray-400 font-medium mt-2">Real-time status of all active fleet units</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-xl text-green-600 text-xs font-black border border-green-100 dark:border-green-900/20">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     LIVE UPDATES
                  </div>
               </div>
            </div>
            <div className="h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 relative group">
               <MapComponent darkMode={darkMode} />
               <div className="absolute top-6 left-6 z-[1000] space-y-4">
                  <div className="glass-card !rounded-2xl !p-4 flex items-center space-x-4">
                     <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white">4</div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-500">Active Units</p>
                        <p className="text-sm font-black dark:text-white">Deploying Fleet</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'routes':
        return <Routes darkMode={darkMode} />;
      case 'buses':
        return <Buses darkMode={darkMode} />;
      case 'students':
        return (
          <div className="min-h-[500px] flex items-center justify-center card p-20 text-center">
            <div>
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Users size={40} />
              </div>
              <h3 className="text-2xl font-black dark:text-white mb-2">Student Directory</h3>
              <p className="text-gray-400 font-medium">Management system coming soon in V2.0</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="card max-w-2xl">
             <h3 className="text-2xl font-black mb-8 dark:text-white">System Preferences</h3>
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                   <div>
                      <p className="font-bold dark:text-white">Real-time Synchronization</p>
                      <p className="text-xs text-gray-400">Push updates every 2 seconds</p>
                   </div>
                   <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                      <div className="absolute right-1 w-4 h-4 bg-white rounded-full"></div>
                   </div>
                </div>
             </div>
          </div>
        );
      default:
        return <Dashboard darkMode={darkMode} />;
    }
  };

  return (
    <Layout 
      darkMode={darkMode} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
}
