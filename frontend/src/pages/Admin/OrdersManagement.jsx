import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusIcon = ({ status, ...props }) => {
  switch (status) {
    case 'Processing': return <Clock {...props} />;
    case 'Shipped': return <Truck {...props} />;
    case 'Delivered': return <CheckCircle {...props} />;
    case 'Cancelled': return <XCircle {...props} />;
    default: return <Package {...props} />;
  }
};

const StatusBadge = ({ status }) => {
  let styles = '';
  switch (status) {
    case 'Processing':
      styles = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      break;
    case 'Shipped':
      styles = 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      break;
    case 'Delivered':
      styles = 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      break;
    case 'Cancelled':
      styles = 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      break;
    default:
      styles = 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${styles}`}>
      <StatusIcon status={status} size={14} />
      <span className="text-xs font-bold">{status}</span>
    </div>
  );
};

const PaymentBadge = ({ method, status }) => {
  const isPaid = status === 'Paid';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400'}`}>
      {method === 'Cash' ? '💵 Cash' : '💳 Card'} • {status || 'Pending'}
    </div>
  );
};

/* ─── Custom Animated Dropdown ─── */
const CustomDropdown = ({ value, onChange, options, error }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={ref} className="relative w-40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"
        }`}
      >
        <span>{selectedOption?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl animate-slide-up">
          <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  opt.value === value
                    ? "bg-primary/10 text-primary dark:text-primary-light font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
                {opt.value === value && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering state
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [animClass, setAnimClass] = useState('');
  const ITEMS_PER_PAGE = 5;

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrder = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? res.data.data : o));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/payment`, 
        { paymentStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? res.data.data : o));
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
      alert('Failed to update payment status');
    }
  };

  const containerRef = React.useRef(null);

  const smoothScrollTo = (targetY, duration = 700) => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;
    
    const startY = scrollContainer.scrollTop;
    const distance = targetY - startY;
    let startTime = null;
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      scrollContainer.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const goToPage = (newPage) => {
    if (newPage === currentPage) return;
    const goingForward = newPage > currentPage;
    const SCROLL_DURATION = 700;

    if (containerRef.current) {
      const scrollContainer = document.querySelector('main');
      if (scrollContainer) {
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        const elementRect = containerRef.current.getBoundingClientRect();
        const elementPosition = elementRect.top - scrollContainerRect.top + scrollContainer.scrollTop;
        smoothScrollTo(elementPosition - 30, SCROLL_DURATION);
      }
    }

    setTimeout(() => {
      setAnimClass(goingForward ? 'page-slide-out-left' : 'page-slide-out-right');

      setTimeout(() => {
        setCurrentPage(newPage);
        setExpandedOrders({}); // Automatically contract expanded items
        setAnimClass(goingForward ? 'page-slide-in-from-right' : 'page-slide-in-from-left');

        setTimeout(() => setAnimClass(''), 300);
      }, 220);
    }, SCROLL_DURATION);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeFilter !== 'All' && order.status !== activeFilter) return false;
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track, review, and update customer orders.</p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(filter => {
            const count = filter === 'All' ? orders.length : orders.filter(o => o.status === filter).length;
            return (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === filter
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className={`space-y-4 ${animClass}`}>
        {paginatedOrders.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
            No orders found.
          </div>
        ) : (
          paginatedOrders.map((order) => (
            <div key={order._id} className="glass-panel rounded-2xl shadow-sm transition-all hover:shadow-md border border-gray-200 dark:border-white/5">
              {/* Order Header */}
              <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-t-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Order Placed</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total</p>
                    <p className="text-sm font-bold text-primary dark:text-primary-light">
                      Rs. {order.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Customer</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {order.user?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                    <p className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded inline-block">
                      #{order._id.toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    
                    <CustomDropdown 
                      value={order.status}
                      onChange={(val) => handleStatusChange(order._id, val)}
                      options={[
                        { value: 'Processing', label: 'Processing' },
                        { value: 'Shipped', label: 'Shipped' },
                        { value: 'Delivered', label: 'Delivered' },
                        { value: 'Cancelled', label: 'Cancelled' }
                      ]}
                    />

                    <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
                    {order.paymentMethod?.toLowerCase() !== 'card' && (
                      <CustomDropdown 
                        value={order.paymentStatus || 'Pending'}
                        onChange={(val) => handlePaymentStatusChange(order._id, val)}
                        options={[
                          { value: 'Pending', label: 'Pending' },
                          { value: 'Paid', label: 'Paid' },
                          { value: 'Failed', label: 'Failed' },
                          { value: 'Refunded', label: 'Refunded' }
                        ]}
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleOrder(order._id)}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-gray-100 dark:bg-white/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
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
                          <div key={idx} className="flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-100 dark:border-white/5">
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
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Rs. {item.priceAtPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <Truck size={14} className="text-gray-500" /> Delivery Details
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 truncate">{order.deliveryDetails.address}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              Distance: {order.deliveryDetails.distanceKm}km | Weight: {order.deliveryDetails.totalWeight}kg
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm flex flex-col justify-center">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 mb-1">
                              <span>Subtotal</span>
                              <span>Rs. {order.totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 mb-2">
                              <span>Delivery Fee</span>
                              <span>Rs. {order.totals.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-white/10">
                              <span>Total</span>
                              <span className="text-primary">Rs. {order.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-4">
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
      )}
    </div>
  );
};

export default OrdersManagement;
