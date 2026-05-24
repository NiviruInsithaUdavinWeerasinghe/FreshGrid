import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';
import ProductDetailModal from '../../components/ProductDetailModal';
import CustomDropdown from '../../components/CustomDropdown';

const Shop = () => {
  const { user } = useAuth();
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Sorting States
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [viewMode, setViewMode] = useState('grid');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Subscription State
  const [subLoading, setSubLoading] = useState(false);
  const [subMessage, setSubMessage] = useState('');
  const [subError, setSubError] = useState('');
  
  const [animClass, setAnimClass] = useState('');
  const isPaginating = !!animClass;
  const ITEMS_PER_PAGE = 6;
  const productSectionRef = useRef(null);

  // Read URL parameters on mount or when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const searchParam = params.get('search');
    
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // Reset page when filters change (no animation needed)
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortBy]);

  // Custom eased scroll — full control over duration and curve
  const smoothScrollTo = (targetY, duration = 700) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime = null;
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Direction-aware page transition:
  // going forward → current slides out-left, new slides in-from-right
  // going backward → current slides out-right, new slides in-from-left
  // Sequence: scroll ↑ first → slide out → update page → slide in
  const goToPage = (newPage) => {
    if (newPage === currentPage) return;
    const goingForward = newPage > currentPage;
    const SCROLL_DURATION = 700;

    // Step 1: scroll to top of product section first
    if (productSectionRef.current) {
      const elementPosition = productSectionRef.current.getBoundingClientRect().top + window.scrollY;
      smoothScrollTo(elementPosition - 100, SCROLL_DURATION);
    }

    // Step 2: after scroll finishes, slide current content out
    setTimeout(() => {
      setAnimClass(goingForward ? 'page-slide-out-left' : 'page-slide-out-right');

      // Step 3: after slide-out, update page and slide new content in
      setTimeout(() => {
        setCurrentPage(newPage);
        setAnimClass(goingForward ? 'page-slide-in-from-right' : 'page-slide-in-from-left');

        // Step 4: clear class so animation can replay on next page change
        setTimeout(() => setAnimClass(''), 300);
      }, 220); // matches page-slide-out duration
    }, SCROLL_DURATION);
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login?redirect=/shop');
      return;
    }
    
    if (!user.email) {
      setSubError('No email linked. Go to Profile.');
      setTimeout(() => navigate('/profile'), 2000);
      return;
    }

    setSubLoading(true);
    setSubMessage('');
    setSubError('');

    try {
      const response = await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/subscribe',
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        setSubMessage('Subscribed successfully! Check your inbox.');
      }
    } catch (err) {
      setSubError(err.response?.data?.message || 'Failed to subscribe.');
    } finally {
      setSubLoading(false);
    }
  };

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [resProducts, resOffers] = await Promise.all([
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/products'),
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/offers/active')
        ]);
        
        let allItems = [];
        if (resProducts.data.success) {
          allItems = [...resProducts.data.data];
        }

        if (resOffers.data.success) {
          const activeOffers = resOffers.data.data;
          // Extract bundles
          const bundles = activeOffers.filter(o => o.offerType === 'BUNDLE_PACKAGE').map(offer => ({
            _id: offer._id,
            name: offer.title,
            description: offer.config.description || 'Special Bundle Package',
            price: offer.config.bundlePackagePrice,
            images: [offer.config.image || 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600'],
            category: 'Special Offers',
            unit: 'package',
            isOffer: true,
            offerData: offer
          }));
          
          allItems = [...allItems, ...bundles];
        }
        setProducts(allItems);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Determine categories dynamically from loaded products
  const dynamicCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category match
      if (activeCategory !== 'All' && product.category !== activeCategory) return false;
      
      // Search query match
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [products, activeCategory, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low-high') {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === 'price-high-low') {
        return Number(b.price) - Number(a.price);
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      return 0; // 'featured' (default DB order)
    });
  }, [filteredProducts, sortBy]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(sortedProducts.length / ITEMS_PER_PAGE), [sortedProducts.length, ITEMS_PER_PAGE]);
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, idx) => idx + 1), [totalPages]);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage, ITEMS_PER_PAGE]);

  // Handle AI Pagination Event
  useEffect(() => {
    const handleAiPaginate = (e) => {
      const { action, page } = e.detail;
      let newPage = currentPage;
      if (action === 'next' && currentPage < totalPages) newPage = currentPage + 1;
      else if (action === 'prev' && currentPage > 1) newPage = currentPage - 1;
      else if (action === 'specific' && page >= 1 && page <= totalPages) newPage = page;
      
      if (newPage !== currentPage) {
        goToPage(newPage);
      }
    };
    window.addEventListener('ai_paginate', handleAiPaginate);
    return () => window.removeEventListener('ai_paginate', handleAiPaginate);
  }, [currentPage, totalPages]);

  const renderPagination = (extraClass = "") => {
    if (totalPages <= 0) return null;
    return (
      <div className={`flex items-center justify-center gap-2 ${extraClass}`}>
        <button 
          disabled={currentPage === 1 || !!animClass}
          onClick={() => goToPage(currentPage - 1)}
          className="p-2 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {pageNumbers.map(number => {
          const isActive = currentPage === number;
          return (
            <button
              key={number}
              onClick={() => goToPage(number)}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'background-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
                backgroundColor: isActive ? 'var(--color-primary, #059669)' : 'transparent',
                color: isActive ? '#ffffff' : '',
                borderColor: isActive ? 'transparent' : '',
                boxShadow: isActive ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none',
              }}
              className={isActive
                ? ''
                : 'border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }
            >
              {number}
            </button>
          );
        })}

        <button 
          disabled={currentPage === totalPages || !!animClass}
          onClick={() => goToPage(currentPage + 1)}
          className="p-2 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="pb-8">
      {/* Header Banner */}
      <div className="relative mb-10 rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 md:p-12 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20">
            Fresh Season Sale
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-2">Our Fresh Market</h1>
          <p className="text-emerald-100 text-sm md:text-base font-light">
            Enjoy premium organic products harvested and delivered locally. No artificial preservatives, just farm-fresh excellence.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
          
          {/* Categories Filter Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm border border-gray-200/50 dark:border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h12" />
              </svg>
              Categories
            </h3>
            <ul className="space-y-1.5">
              {dynamicCategories.map(category => (
                <li key={category}>
                  <button
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      activeCategory === category 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{category}</span>
                    {activeCategory === category && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Promotion Subscription Widget */}
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 text-center relative overflow-hidden">
            <span className="text-3xl mb-2 block animate-bounce">🎁</span>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Promotion Alerts</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Subscribe to get notified about our latest special offers!</p>
            
            {subMessage ? (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                {subMessage}
              </div>
            ) : (
              <>
                {subError && (
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">
                    {subError}
                  </div>
                )}
                
                {!user && (
                   <input 
                    type="email" 
                    placeholder="Your email" 
                    disabled
                    className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl mb-2 text-center opacity-50 cursor-not-allowed"
                  />
                )}
                
                <button 
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex justify-center items-center h-8"
                >
                  {subLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main Grid View */}
        <main ref={productSectionRef} className="flex-1 space-y-6">
          
          {/* Top Control Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input inside Shop */}
            <div className="relative w-full md:w-80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-charcoal/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Sorting & Layout View Mode Toggles */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">Sort By:</span>
                <div className="w-48">
                  <CustomDropdown
                    value={sortBy}
                    onChange={setSortBy}
                    buttonClassName="px-3 py-1.5 text-xs bg-white/50 dark:bg-charcoal/50"
                    options={[
                      { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
                      { value: 'price-low-high', label: 'Price: Low to High' },
                      { value: 'price-high-low', label: 'Price: High to Low' }
                    ]}
                  />
                </div>
              </div>

              {/* View Layout buttons */}
              <div className="flex items-center gap-1 border-l border-gray-200 dark:border-white/10 pl-4">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary dark:text-primary-light' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                  title="Grid View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary dark:text-primary-light' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Top Pagination Controls */}
          {renderPagination("pb-2")}

          {/* Catalog Render Panel — directional slide transition */}
          <div className={`overflow-hidden min-h-[600px] md:min-h-[800px] ${animClass}`}>
          {loading ? (
            /* Skeleton Loading Grid */
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/5 animate-pulse flex flex-col h-72">
                  <div className="h-44 bg-gray-200 dark:bg-white/5 w-full" />
                  <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-2/3" />
                      <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-lg w-full" />
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-5 bg-gray-200 dark:bg-white/5 rounded-lg w-16" />
                      <div className="h-8 bg-gray-200 dark:bg-white/5 rounded-lg w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 glass-panel rounded-3xl border border-gray-200/50 dark:border-white/5">
              <span role="img" aria-label="sad green" className="text-5xl mb-4 block">🥬</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-sm mx-auto">
                We couldn't find any products matching those parameters. Try adjusting your filters or category settings.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                /* Grid View */
                <motion.div 
                  key="grid-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25 }}
                  layout={!isPaginating} 
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                >
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map(product => (
                  <motion.div
                    key={product._id || product.id}
                    layout={!isPaginating}
                    initial={isPaginating ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={isPaginating ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product} onClick={setSelectedProduct} />
                  </motion.div>
                ))}
              </AnimatePresence>
                </motion.div>
              ) : (
                /* List View */
                <motion.div 
                  key="list-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25 }}
                  layout={!isPaginating} 
                  className="space-y-4"
                >
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map(product => (
                  <motion.div 
                    key={product._id || product.id} 
                    layout={!isPaginating}
                    initial={isPaginating ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={isPaginating ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedProduct(product)}
                    className="glass-panel rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-200 group flex flex-col sm:flex-row h-auto sm:h-44 border border-gray-200/50 dark:border-white/5 cursor-pointer"
                  >
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                    <img 
                      src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#1c1c1c]/95 px-3 py-1 rounded-full text-[10px] font-bold text-primary dark:text-primary-light border border-gray-200/50 dark:border-white/10 uppercase">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                        Rs. {Number(product.price).toFixed(2)}
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">/ {product.unit || 'kg'}</span>
                      </span>
                      {(() => {
                        const cartItem = getCartItem(product._id);
                        return cartItem ? (
                          <div className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 rounded-xl px-1 py-1">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product._id, cartItem.quantity - 1); }}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-charcoal text-primary dark:text-primary-light font-bold flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-sm"
                            >−</button>
                            <span className="w-6 text-center text-sm font-bold text-primary dark:text-primary-light">{cartItem.quantity}</span>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product._id); }}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-charcoal text-primary dark:text-primary-light font-bold flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-sm"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!user) { navigate('/login'); return; }
                              addToCart(product._id);
                            }}
                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary dark:text-primary-light dark:hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add to Cart
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          </div>

          {/* Bottom Pagination Controls */}
          {renderPagination("pt-6")}
        </main>

      </div>
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};

export default Shop;
