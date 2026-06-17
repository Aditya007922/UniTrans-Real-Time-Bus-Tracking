import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout & Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import DriverPanel from './pages/DriverPanel';
import PassengerPanel from './pages/PassengerPanel';

// Admin & Management Pages (Existing)
import Dashboard from './pages/admin/Dashboard';
import RoutesPage from './pages/admin/Routes';
import BusesPage from './pages/admin/Buses';

// Placeholder Pages for missing components
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <h1 className="text-4xl font-black mb-4 dark:text-white">{title}</h1>
    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Module Under Development</p>
  </div>
);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false; 
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <AuthProvider>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-[#F8FAFC] text-gray-900'}`}>
          <Toaster position="top-right" />
          
          <Routes>
            {/* Primary Guest Entry Point */}
            <Route path="/" element={<PassengerPanel toggleDarkMode={toggleDarkMode} darkMode={darkMode} />} />
            <Route path="/passenger" element={<PassengerPanel toggleDarkMode={toggleDarkMode} darkMode={darkMode} />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login darkMode={darkMode} />} />
            <Route path="/register" element={<Register darkMode={darkMode} />} />
            <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />

            {/* Roles-Based Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute><RoutesPage darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/buses" element={<ProtectedRoute><BusesPage darkMode={darkMode} /></ProtectedRoute>} />
            
            <Route path="/driver" element={
              <ProtectedRoute role="driver">
                <DriverPanel darkMode={darkMode} />
              </ProtectedRoute>
            } />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
