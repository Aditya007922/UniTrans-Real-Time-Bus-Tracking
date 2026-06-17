import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Route as RouteIcon, 
  Bus, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Sidebar({ darkMode, toggleDarkMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, path: '/dashboard' },
    { id: 'tracking', label: 'Live Tracking', icon: <Map />, path: '/passenger' },
    { id: 'routes', label: 'Routes', icon: <RouteIcon />, path: '/routes' },
    { id: 'buses', label: 'Buses', icon: <Bus />, path: '/buses' },
    { id: 'drivers', label: 'Drivers', icon: <UserCheck />, path: '/drivers' },
    { id: 'students', label: 'Students', icon: <Users />, path: '/students' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 />, path: '/reports' },
    { id: 'notifications', label: 'Notifications', icon: <Bell />, path: '/notifications' },
    { id: 'settings', label: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const SidebarContent = () => (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-black border-white/5' : 'bg-white border-gray-100'} border-r transition-all duration-300`}>
      {/* Logo Section */}
      <div className="p-8 flex items-center justify-between">
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                 <Bus className="text-white w-7 h-7" />
              </div>
              <span className="text-2xl font-black dark:text-white tracking-tighter">
                UniTrans
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed && (
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto">
             <Bus className="text-white w-7 h-7" />
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className={`px-4 py-8 mb-4 ${collapsed ? 'text-center' : ''}`}>
        <div className={`flex items-center space-x-4 ${collapsed ? 'justify-center' : 'bg-gray-50 dark:bg-white/5 p-5 rounded-[2rem]'}`}>
           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg">
             {currentUser?.name?.charAt(0) || 'U'}
           </div>
           {!collapsed && (
             <div className="overflow-hidden">
               <h4 className="font-black text-sm truncate dark:text-white leading-tight">{currentUser?.name || 'Vishwa'}</h4>
               <p className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500 mt-1">{userRole || 'Passenger'}</p>
             </div>
           )}
        </div>
      </div>

      {/* Menu Section */}
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => { if (mobileOpen) setMobileOpen(false); }}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${
              location.pathname === item.path 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : `${darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`
            } ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <div className={`${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
              {React.cloneElement(item.icon, { size: 24, strokeWidth: 2.5 })}
            </div>
            {!collapsed && <span className="font-black tracking-tight text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2">
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${darkMode ? 'text-yellow-400 hover:bg-white/5' : 'text-slate-600 hover:bg-gray-50'} ${collapsed ? 'justify-center px-0' : ''}`}
        >
          {darkMode ? <Sun size={24} strokeWidth={2.5} /> : <Moon size={24} strokeWidth={2.5} />}
          {!collapsed && <span className="font-black text-sm">Theme Mode</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center space-x-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={24} strokeWidth={2.5} />
          {!collapsed && <span className="font-black text-sm">Logout</span>}
        </button>
      </div>

      {/* Toggle Button (Desktop) */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-5 top-24 w-10 h-10 bg-blue-600 text-white rounded-full items-center justify-center shadow-xl z-50 hover:scale-110 transition-transform border-4 border-white dark:border-black"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {!mobileOpen && (
        <div className="lg:hidden fixed top-6 left-6 z-[60]">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-4 rounded-2xl bg-blue-600 text-white shadow-2xl"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className={`hidden lg:block h-screen sticky top-0 transition-all duration-500 ${collapsed ? 'w-24' : 'w-[260px]'}`}>
        <SidebarContent />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-[260px] z-[56] lg:hidden"
      >
        <SidebarContent />
        <button onClick={() => setMobileOpen(false)} className="absolute top-8 right-[-50px] p-2 text-white bg-black/40 rounded-full">
           <X size={20} />
        </button>
      </motion.div>
    </>
  );
}
