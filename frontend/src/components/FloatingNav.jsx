import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';

const getPageName = (path) => {
  if (path === '/') return 'Home';
  if (path.startsWith('/about')) return 'Our Story';
  if (path.startsWith('/shop')) return 'Shop';
  if (path.startsWith('/cart')) return 'Cart';
  if (path.startsWith('/account')) return 'Profile';
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/login')) return 'Login';
  if (path.startsWith('/register')) return 'Register';
  if (path.startsWith('/admin/dashboard')) return 'Admin Dashboard';
  if (path.startsWith('/admin')) return 'Admin';
  return 'Page';
};

export default function FloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  
  const [{ history, currentIndex }, setHistoryState] = useState({ history: [], currentIndex: -1 });

  useEffect(() => {
    setHistoryState(prevState => {
      const { history: prevHistory, currentIndex: prevIndex } = prevState;
      
      if (navType === 'POP') {
        const existingIndex = prevHistory.findIndex(h => h.key === location.key);
        if (existingIndex !== -1) {
          return { history: prevHistory, currentIndex: existingIndex };
        } else {
          // Initial load or unknown history entry
          return {
            history: [{ key: location.key, pathname: location.pathname, name: getPageName(location.pathname) }],
            currentIndex: 0
          };
        }
      } else if (navType === 'REPLACE') {
        const newHistory = [...prevHistory];
        const newEntry = { key: location.key, pathname: location.pathname, name: getPageName(location.pathname) };
        if (prevIndex >= 0) {
          newHistory[prevIndex] = newEntry;
        } else {
          newHistory.push(newEntry);
        }
        return { history: newHistory, currentIndex: Math.max(0, prevIndex) };
      } else {
        // PUSH
        const newHistory = prevHistory.slice(0, prevIndex + 1);
        newHistory.push({ 
          key: location.key, 
          pathname: location.pathname, 
          name: getPageName(location.pathname) 
        });
        return { history: newHistory, currentIndex: newHistory.length - 1 };
      }
    });
  }, [location.key, location.pathname, navType]);

  const goBack = () => {
    // Always use native navigate(-1) as a robust safety net and to preserve actual browser history stack.
    navigate(-1);
  };

  const goForward = () => {
    navigate(1);
  };

  // Determine button labels based on tracked history array
  const prevPage = currentIndex > 0 ? history[currentIndex - 1].name : null;
  const nextPage = currentIndex < history.length - 1 ? history[currentIndex + 1].name : null;

  const isHome = location.pathname === '/';

  return (
    <div className="mt-4 sticky top-24 z-40 container mx-auto px-4 sm:px-6 lg:px-8 pb-2 pointer-events-none">
      <div className="flex items-center gap-2 w-max pointer-events-auto">
        {!isHome && (
          <button 
            onClick={() => navigate('/')} 
            title="Go to Home"
            className="bg-white/95 dark:bg-[#2a2a2a]/95 border border-gray-200/80 dark:border-white/10 shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-[#333] hover:shadow-xl hover:-translate-y-0.5 hover:text-primary dark:hover:text-primary-light transition-all duration-300 p-2.5 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 group"
          >
            <HomeIcon size={16} className="transition-transform group-hover:scale-110" />
          </button>
        )}

        {prevPage && (
          <button 
            onClick={goBack} 
            title={`Go back to ${prevPage}`}
            className="bg-white/95 dark:bg-[#2a2a2a]/95 border border-gray-200/80 dark:border-white/10 shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-[#333] hover:shadow-xl hover:-translate-y-0.5 hover:text-primary dark:hover:text-primary-light transition-all duration-300 px-4 py-2.5 flex items-center gap-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> 
            <span className="hidden sm:inline">Back to {prevPage}</span>
          </button>
        )}

        {nextPage && (
          <button 
            onClick={goForward} 
            title={`Go forward to ${nextPage}`}
            className="bg-white/95 dark:bg-[#2a2a2a]/95 border border-gray-200/80 dark:border-white/10 shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-[#333] hover:shadow-xl hover:-translate-y-0.5 hover:text-primary dark:hover:text-primary-light transition-all duration-300 px-4 py-2.5 flex items-center gap-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 group"
          >
            <span className="hidden sm:inline">To {nextPage}</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
