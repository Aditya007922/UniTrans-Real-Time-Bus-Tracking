import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Settings, Search, Moon, Sun, ChevronDown, Activity, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ darkMode, toggleDarkMode }) {
  const { currentUser, userRole, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 md:px-8 bg-transparent pointer-events-none`}>
      <div className="container mx-auto flex justify-between items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 px-6 py-3 rounded-[2.5rem] shadow-2xl pointer-events-auto">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <BusIcon />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter">
            UniTrans
          </span>
        </Link>

        <div className="hidden lg:flex flex-1 max-w-md mx-8">
           <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Secure system search..."
                className={`w-full pl-12 pr-4 py-3 rounded-2xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-gray-100/50 text-gray-900'} outline-none border-2 border-transparent focus:border-primary transition-all text-sm font-bold`}
              />
           </div>
        </div>

        <div className="flex items-center space-x-4 lg:space-x-6">
          <button
            onClick={toggleDarkMode}
            className={`${darkMode ? 'bg-slate-800 text-yellow-400 shadow-yellow-400/10' : 'bg-gray-100 text-gray-600'} p-3 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
             <button 
               onClick={() => setShowNotifications(!showNotifications)}
               className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 active:scale-95 relative"
             >
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
             </button>

             <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 glass rounded-3xl p-4 shadow-2xl overflow-hidden border-2 border-white dark:border-slate-800"
                  >
                     <h4 className="font-black dark:text-white px-2 mb-4 uppercase tracking-widest text-xs">Intelligence Feed</h4>
                     <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                           <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                           <div>
                              <p className="text-xs font-black dark:text-white">SOS Triggered: BUS-04</p>
                              <p className="text-[10px] text-red-400 font-bold">2 minutes ago</p>
                           </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                           <Activity className="text-primary flex-shrink-0" size={16} />
                           <div>
                              <p className="text-xs font-black dark:text-white">Bus WB-02 entered Route 4</p>
                              <p className="text-[10px] text-gray-400 font-bold">15 minutes ago</p>
                           </div>
                        </div>
                     </div>
                     <button className="w-full mt-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-primary transition-colors">
                        Clear All Feed
                     </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-1.5 pr-4 pl-1.5 bg-gray-50 dark:bg-slate-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black text-white text-lg shadow-lg">
                   {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                   <p className="text-xs font-black dark:text-white truncate max-w-[100px]">{currentUser.name}</p>
                   <p className="text-[10px] font-black text-primary uppercase opacity-70 tracking-widest">{userRole}</p>
                </div>
                <ChevronDown size={14} className={`dark:text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 glass rounded-3xl p-3 shadow-2xl overflow-hidden border-2 border-white dark:border-slate-800"
                  >
                     <div className="p-4 border-b border-gray-100 dark:border-slate-800 mb-2">
                        <p className="font-black dark:text-white truncate">{currentUser.email}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Authorized Account</p>
                     </div>
                     <Link 
                       to={userRole === 'admin' ? '/admin' : userRole === 'driver' ? '/driver' : '/passenger'}
                       className="flex items-center space-x-3 p-3 rounded-xl hover:bg-primary hover:text-white transition-all group font-bold text-sm"
                     >
                       <User size={18} className="text-primary group-hover:text-white" />
                       <span>Profile Portal</span>
                     </Link>
                     <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group font-bold text-sm">
                       <Settings size={18} className="text-gray-400 group-hover:text-primary" />
                       <span className="dark:text-white">Account Settings</span>
                     </button>
                     <div className="h-[2px] bg-gray-50 dark:bg-slate-800 my-2"></div>
                     <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-all font-bold text-sm"
                     >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex space-x-3">
              <Link
                to="/login"
                className="px-6 py-3 text-sm font-black text-gray-600 dark:text-gray-400 hover:text-primary transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 text-sm font-black bg-primary text-white rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/30"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const BusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="10" width="20" height="8" rx="2" ry="2" />
    <path d="M17 18h1.1c.5 0 .9-.4.9-.9V10" />
    <path d="M4 10V9.1c0-.5.4-.9.9-.9H19.1c.5 0 .9.4.9.9V10" />
    <path d="M7 18h1.1c.5 0 .9-.4.9-.9V10" />
    <path d="M12 2v2" />
    <path d="M12 18v2" />
  </svg>
);
