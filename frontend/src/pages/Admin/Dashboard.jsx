import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductsManagement from './ProductsManagement';
import SpecialOffers from './SpecialOffers';
import OrdersManagement from './OrdersManagement';

/* ─── Sidebar Nav Item ─── */
const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
      active
        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
    }`}
  >
    <span className="h-5 w-5 flex-shrink-0">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {badge !== undefined && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${active ? 'bg-primary/20 text-primary dark:text-primary-light' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
        {badge}
      </span>
    )}
  </button>
);

/* ─── Overview Stats Panel ─── */
const OverviewPanel = ({ onNavigate, data, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Loading Data...</span>
      </div>
    );
  }

  const totalRevenue = data.orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.totals?.total || 0), 0);

  const activeOrdersCount = data.orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
  const pendingShipmentCount = data.orders.filter(o => o.status === 'Processing').length;

  const categoriesCount = new Set(data.products.map(p => p.category)).size;

  // Chart Data Prep
  const dailyData = {};
  data.orders.forEach(order => {
    const d = new Date(order.createdAt);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { date: dateStr, revenue: 0 };
    }
    if (order.status === 'Delivered') {
      dailyData[dateStr].revenue += order.totals?.total || 0;
    }
  });

  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = last7Days.map(date => {
    return dailyData[date] || { date, revenue: 0 };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: 'Total Revenue',
            value: `Rs. ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            sub: 'From delivered orders',
            subColor: 'text-primary dark:text-primary-light',
            iconBg: 'bg-primary/10 dark:bg-primary/20',
            iconColor: 'text-primary dark:text-primary-light',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'Active Orders',
            value: activeOrdersCount.toString(),
            sub: `${pendingShipmentCount} pending shipment`,
            subColor: 'text-blue-500 dark:text-blue-400',
            iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
            iconColor: 'text-blue-500 dark:text-blue-400',
            clickable: true,
            onClick: () => onNavigate('orders'),
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            ),
          },
          {
            label: 'Total Products',
            value: data.products.length.toString(),
            sub: `Across ${categoriesCount} categories`,
            subColor: 'text-purple-500 dark:text-purple-400',
            iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
            iconColor: 'text-purple-500 dark:text-purple-400',
            clickable: true,
            onClick: () => onNavigate('products'),
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={`glass-panel p-6 rounded-2xl ${stat.clickable ? 'cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 ${stat.iconBg} rounded-xl ${stat.iconColor}`}>{stat.icon}</div>
            </div>
            <p className={`text-sm ${stat.subColor} mt-4 font-medium`}>{stat.sub}</p>
            {stat.clickable && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                Click to manage →
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Graph */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Revenue Overview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 Days Performance</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(value) => `Rs.${value > 1000 ? (value/1000).toFixed(1)+'k' : value}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(156, 163, 175, 0.2)', backgroundColor: 'var(--bg-glass, rgba(255,255,255,0.9))' }}
                formatter={(value) => [`Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#059669" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ─── Sidebar ─── */
const Sidebar = ({ activePage, onNavigate, onLogout, productCount, orderCount, offerCount }) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'products',
      label: 'Products',
      badge: productCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'Orders',
      badge: orderCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: 'offers',
      label: 'Special Offers',
      badge: offerCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#161616] border-r border-gray-200 dark:border-white/5 hidden md:flex flex-col sticky top-0 h-screen">
      {/* Brand */}
      <div className="h-[84px] px-6 flex flex-col justify-center border-b border-gray-200 dark:border-white/5">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary dark:text-primary-light hover:opacity-80 transition-opacity">
          <span role="img" aria-label="sprout">🌱</span>
          FreshGrid
        </Link>
        <span className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mt-1 block">Admin Portal</span>
      </div>

      {/* Admin badge */}
      <div className="mx-4 my-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">A</div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Administrator</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-4 pb-1 pt-2">Menu</p>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            active={activePage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-1">
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Visit Storefront
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  );
};

/* ─── Dashboard Shell ─── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdminLoggedIn, logout } = useAdminAuth();
  
  const activePage = searchParams.get('tab') || 'overview';
  const setActivePage = (page) => {
    setSearchParams({ tab: page });
  };

  const [dashboardData, setDashboardData] = useState({
    products: [],
    orders: [],
    offers: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAdminLoggedIn) return;
      try {
        const token = localStorage.getItem('token');
        const [resProducts, resOrders, resOffers] = await Promise.all([
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/products'),
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/orders/all', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/offers', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setDashboardData({
          products: resProducts.data.success ? resProducts.data.data : [],
          orders: resOrders.data.success ? resOrders.data.data : [],
          offers: resOffers.data.success ? resOffers.data.data : []
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboardData();
  }, [isAdminLoggedIn]);

  // ─ Dark mode (shared with customer Navbar via localStorage) ────────────────
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        performThemeToggle();
      });
    } else {
      performThemeToggle();
    }
  };

  const performThemeToggle = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Redirect if not logged in
  if (!isAdminLoggedIn) {
    navigate('/admin');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const pageTitles = {
    overview: 'Dashboard Overview',
    products: 'Product Management',
    orders: 'Orders',
    offers: 'Special Offers',
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-charcoal flex">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        productCount={dashboardData.products.length}
        orderCount={dashboardData.orders.length}
        offerCount={dashboardData.offers.length}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/5 px-8 h-[84px] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{pageTitles[activePage]}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {activePage === 'overview' && <OverviewPanel onNavigate={setActivePage} data={dashboardData} loading={loadingStats} />}
          {activePage === 'products' && <ProductsManagement />}
          {activePage === 'offers' && <SpecialOffers />}
          {activePage === 'orders' && <OrdersManagement />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
