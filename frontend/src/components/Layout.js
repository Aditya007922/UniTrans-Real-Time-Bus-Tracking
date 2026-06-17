import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, darkMode, toggleDarkMode, fullScreen = false }) {

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-500`}>
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 w-full relative overflow-y-auto custom-scrollbar">
          <div className={`${fullScreen ? 'p-0' : 'p-2 md:p-4 max-w-[1700px]'} mx-auto animate-fadeIn h-full`}>
            {children}
          </div>
          
          {/* Subtle background glow elements */}
          {!fullScreen && (
            <>
              <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-1"></div>
              <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -z-1"></div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
