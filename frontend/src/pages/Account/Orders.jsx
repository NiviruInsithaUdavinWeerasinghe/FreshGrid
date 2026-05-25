import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [animClass, setAnimClass] = useState('');
  const orderSectionRef = useRef(null);
  const ORDERS_PER_PAGE = 5;

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

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

  const goToPage = (newPage) => {
    if (newPage === currentPage) return;
    const goingForward = newPage > currentPage;
    const SCROLL_DURATION = 700;

    if (orderSectionRef.current) {
      const elementPosition = orderSectionRef.current.getBoundingClientRect().top + window.scrollY;
      smoothScrollTo(elementPosition - 100, SCROLL_DURATION);
    }

    setTimeout(() => {
      setAnimClass(goingForward ? 'page-slide-out-left' : 'page-slide-out-right');

      setTimeout(() => {
        setCurrentPage(newPage);
        setExpandedOrders({});
        setAnimClass(goingForward ? 'page-slide-in-from-right' : 'page-slide-in-from-left');

        setTimeout(() => setAnimClass(''), 300);
      }, 220);
    }, SCROLL_DURATION);
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Processing':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
      case 'Shipped':
        return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
      case 'Delivered':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
      case 'Cancelled':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' };
      default:
        return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-500/10' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8 px-4 sm:px-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Order History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and track your previous purchases</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-charcoal rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Looks like you haven't made any purchases.</p>
        </div>
      ) : (
        <div ref={orderSectionRef} className={`space-y-6 overflow-hidden ${animClass}`} style={{ willChange: 'transform, opacity' }}>
          {paginatedOrders.map((order) => {
            const StatusIcon = getStatusConfig(order.status).icon;
            const statusColor = getStatusConfig(order.status).color;
            const statusBg = getStatusConfig(order.status).bg;

            return (
              <div key={order._id} className="bg-white dark:bg-charcoal rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex flex-wrap justify-between items-center gap-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order Placed</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                      <p className="text-sm font-bold text-primary dark:text-primary-light">
                        Rs. {order.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-300">#{order._id.toString().slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusBg}`}>
                      <StatusIcon size={14} className={statusColor} />
                      <span className={`text-xs font-bold ${statusColor}`}>{order.status}</span>
                    </div>
                    
                    <button
                      onClick={() => toggleOrder(order._id)}
                      className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-gray-100 dark:bg-white/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
                    >
                      {expandedOrders[order._id] ? (
                        <>Hide Items <ChevronUp size={16} /></>
                      ) : (
                        <>View {order.items.length} Items <ChevronDown size={16} /></>
                      )}
                    </button>
                  </div>

                  {/* Items List Accordion */}
                  <AnimatePresence>
                    {expandedOrders[order._id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Rs. {(item.priceAtPurchase * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 px-2">
          <button
            disabled={currentPage === 1 || !!animClass}
            onClick={() => goToPage(currentPage - 1)}
            className="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            Previous
          </button>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages || !!animClass}
            onClick={() => goToPage(currentPage + 1)}
            className="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
