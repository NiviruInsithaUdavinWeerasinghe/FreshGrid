import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../../components/PaymentModal';

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 animate-pulse">
    <div className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-white/5 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-1/2" />
      <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-lg w-1/4" />
      <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-1/3" />
    </div>
    <div className="w-24 h-10 bg-gray-200 dark:bg-white/5 rounded-xl" />
    <div className="w-9 h-9 bg-gray-200 dark:bg-white/5 rounded-xl" />
  </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyCart = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="text-7xl mb-6">🛒</div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h2>
    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-sm">
      Looks like you haven't added anything yet. Head to the shop and discover fresh products!
    </p>
    <Link
      to="/shop"
      className="px-8 py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all"
    >
      Browse Products
    </Link>
  </div>
);

// ─── Cart Page ────────────────────────────────────────────────────────────────
const Cart = () => {
  const { 
    cartItems, 
    cartLoading, 
    fetchCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    deliveryType,
    setDeliveryType,
    paymentMethod,
    setPaymentMethod
  } = useCart();
  const { user } = useAuth();

  // Tracks which productId is pending removal confirmation (null = none)
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  // Tracks if the entire cart is pending clear
  const [pendingClearCart, setPendingClearCart] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  // Tracks items currently playing their exit animation
  const [exitingItems, setExitingItems] = useState(new Set());

  // Delivery Fee States
  const [deliveryData, setDeliveryData] = useState(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [feeError, setFeeError] = useState(null);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product?.price ?? 0) * item.quantity,
    0
  );
  const DELIVERY_FEE = deliveryData?.fee || 0;
  const total = subtotal + DELIVERY_FEE;

  useEffect(() => {
    if (cartItems.length === 0 || cartLoading) return;

    const calculateFee = async (lat, lng) => {
      setCalculatingFee(true);
      setFeeError(null);
      try {
        const token = localStorage.getItem('token');
        const items = cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        
        const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/delivery/calculate', 
          { destLat: lat, destLng: lng, cartItems: items, cartSubtotal: subtotal },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setDeliveryData(res.data.data);
      } catch (err) {
        setFeeError('Failed to calculate exact delivery fee.');
        setDeliveryData(null);
      } finally {
        setCalculatingFee(false);
      }
    };

    if (deliveryType === 'home') {
      if (user?.homeLocation?.lat && user?.homeLocation?.lng) {
        calculateFee(user.homeLocation.lat, user.homeLocation.lng);
      } else {
        setDeliveryData(null);
        setFeeError('No home location saved.');
      }
    } else if (deliveryType === 'live') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => calculateFee(pos.coords.latitude, pos.coords.longitude),
          () => {
            setFeeError('Location access denied. Using base estimation.');
            setDeliveryData(null);
          }
        );
      }
    }
  }, [cartItems, deliveryType, user?.homeLocation]);

  const handleRemoveClick = (productId) => {
    setPendingRemoveId(productId);
  };

  const confirmRemove = async () => {
    const idToRemove = pendingRemoveId;
    setPendingRemoveId(null);

    // 1. Mark item as exiting (triggers CSS animation)
    setExitingItems(prev => new Set(prev).add(idToRemove));

    // 2. Wait for animation to finish, then remove from server + state
    setTimeout(async () => {
      await removeItem(idToRemove);
      setExitingItems(prev => {
        const next = new Set(prev);
        next.delete(idToRemove);
        return next;
      });
    }, 440); // matches cart-item-exit duration
  };

  const cancelRemove = () => {
    setPendingRemoveId(null);
  };

  const confirmClearCart = async () => {
    setPendingClearCart(false);
    const allIds = cartItems.map(item => item.productId);
    setExitingItems(new Set(allIds));
    
    setTimeout(async () => {
      await clearCart();
      setExitingItems(new Set());
    }, 440);
  };

  const handlePaymentSuccess = () => {
    fetchCart();
    setIsPaymentModalOpen(false);
  };



  return (
    <div className="pb-8 max-w-6xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Your Cart</h1>
          {!cartLoading && cartItems.length > 0 && (
            <span className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-bold px-3 py-1 rounded-full">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          )}
        </div>

        {/* Empty Cart Section */}
        {!cartLoading && cartItems.length > 0 && (
          <div className="w-full sm:w-auto">
            {!pendingClearCart ? (
              <button
                onClick={() => setPendingClearCart(true)}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-transparent border-2 border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold rounded-xl transition-all duration-200"
              >
                Empty Cart
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 w-full sm:w-auto shadow-sm border border-red-100 dark:border-red-500/20 flex flex-col sm:flex-row items-center gap-3">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-0 whitespace-nowrap text-center sm:text-left">
                  Empty the entire cart?
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setPendingClearCart(false)}
                    className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg border border-red-200 dark:border-red-500/20 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearCart}
                    className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm shadow-red-500/20"
                  >
                    Yes, Empty
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left: Item List ── */}
        <div className="flex-1 space-y-4">
          {cartLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            cartItems.map((item) => {
              const product = item.product;
              const imageSrc = product?.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
              const isPendingRemove = pendingRemoveId === item.productId;
              const isExiting = exitingItems.has(item.productId);

              return (
                <div
                  key={item.productId}
                  className={`glass-panel rounded-2xl overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5 ${isExiting ? 'cart-item-exit' : ''}`}
                >
                  {/* ── Main item row ── */}
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Product Image */}
                    <img
                      src={imageSrc}
                      alt={product?.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                        {product?.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{product?.category}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <div className="text-primary dark:text-primary-light font-semibold text-xs sm:text-sm">
                          Rs. {Number(product?.price ?? 0).toFixed(2)} / {product?.unit || 'kg'}
                        </div>
                        {product?.originalPrice && product.originalPrice > product.price && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through">Rs. {Number(product.originalPrice).toFixed(2)}</span>
                            <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Vol. Discount</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Subtotal: <span className="text-gray-800 dark:text-gray-200 font-bold">Rs. {(Number(product?.price ?? 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 px-1 sm:px-0">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal rounded-xl px-1 py-1 border border-gray-200 dark:border-white/5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg font-bold text-lg text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-900 dark:text-gray-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg font-bold text-lg text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveClick(item.productId)}
                      className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                        isPendingRemove
                          ? 'bg-red-500/10 text-red-500'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                      }`}
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    </div>
                  </div>

                  {/* ── Inline confirmation bar (slides down when pending) ── */}
                  <div
                    style={{
                      maxHeight: isPendingRemove ? '80px' : '0',
                      opacity: isPendingRemove ? 1 : 0,
                      transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="px-4 pb-4 flex items-center justify-between gap-3 border-t border-red-100 dark:border-red-500/20 pt-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        Remove <span className="font-bold text-gray-900 dark:text-gray-100 max-w-[140px] truncate inline-block">{product?.name}</span> from cart?
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={cancelRemove}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmRemove}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm shadow-red-500/20"
                        >
                          Yes, Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: Order Summary ── */}
        {!cartLoading && cartItems.length > 0 && (
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="glass-panel p-6 rounded-2xl sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Order Summary</h3>

              {/* Delivery Location Selector */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Delivery Location</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="delivery_location" 
                        value="home"
                        checked={deliveryType === 'home'}
                        onChange={() => setDeliveryType('home')}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-primary checked:bg-transparent transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">🏠 Saved Home Address</div>
                      {user?.homeLocation?.address ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]" title={user.homeLocation.address}>
                          {user.homeLocation.address}
                        </div>
                      ) : (
                        <div className="text-xs text-red-500 mt-0.5">No home address saved.</div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="delivery_location" 
                        value="live"
                        checked={deliveryType === 'live'}
                        onChange={() => setDeliveryType('live')}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-primary checked:bg-transparent transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                      📍 Use Live Location (GPS)
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Payment Method</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="Card"
                        checked={paymentMethod === 'Card'}
                        onChange={() => setPaymentMethod('Card')}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-primary checked:bg-transparent transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                      💳 Credit / Debit Card
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="Cash"
                        checked={paymentMethod === 'Cash'}
                        onChange={() => setPaymentMethod('Cash')}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-primary checked:bg-transparent transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                      💵 Cash on Delivery
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span className="truncate max-w-[60%]">
                      {item.product?.name} <span className="text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">
                      Rs. {(Number(item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-300 items-start">
                    <div className="flex flex-col">
                      <span>Delivery Fee</span>
                      {deliveryData && (
                        <div className="relative inline-block mt-0.5">
                          <span 
                            className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors" 
                            onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                          >
                            {deliveryData.distanceKm} km • {deliveryData.totalWeightKg} kg
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {showFeeBreakdown && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowFeeBreakdown(false)}
                              />
                              <div className="absolute left-0 bottom-full mb-2 w-64 p-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl text-xs z-50">
                                <div className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-white/5 pb-2 mb-3 tracking-wide">Delivery Breakdown</div>
                                <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400">
                                  <span>Base Fee</span>
                                  <span>
                                    {deliveryData.breakdown?.base === 0 ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="line-through text-gray-400 text-[9px]">Rs.{deliveryData.breakdown?.originalBase?.toFixed(2) || '150.00'}</span>
                                        <span className="text-emerald-500 font-bold uppercase text-[9px] bg-emerald-500/10 px-1 rounded">Waived!</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">Rs.0.00</span>
                                      </span>
                                    ) : (
                                      `Rs. ${deliveryData.breakdown?.base?.toFixed(2) || '150.00'}`
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400"><span>Distance ({deliveryData.distanceKm}km)</span><span>Rs. {deliveryData.breakdown?.distanceCost?.toFixed(2) || (deliveryData.distanceKm * 20).toFixed(2)}</span></div>
                                <div className="flex justify-between mb-3 text-gray-600 dark:text-gray-400">
                                  <span>Weight ({deliveryData.totalWeightKg}kg)</span>
                                  <span>
                                    {deliveryData.breakdown?.weightRateUsed < deliveryData.breakdown?.originalWeightRate ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="line-through text-gray-400 text-[9px]">Rs.{(deliveryData.totalWeightKg * (deliveryData.breakdown?.originalWeightRate || 30)).toFixed(2)}</span>
                                        <span className="text-emerald-500 font-bold uppercase text-[9px] bg-emerald-500/10 px-1 rounded">Discounted</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">Rs.{deliveryData.breakdown?.weightCost?.toFixed(2)}</span>
                                      </span>
                                    ) : (
                                      `Rs. ${deliveryData.breakdown?.weightCost?.toFixed(2) || (deliveryData.totalWeightKg * 30).toFixed(2)}`
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-white/5 pt-3"><span>Total</span><span>Rs. {deliveryData.fee.toFixed(2)}</span></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {feeError && (
                        <span className="text-[10px] text-red-500 mt-0.5 max-w-[150px] leading-tight">
                          {feeError}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-right">
                      {calculatingFee ? (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Calc...
                        </span>
                      ) : deliveryData ? (
                        `Rs. ${DELIVERY_FEE.toFixed(2)}`
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-xl font-extrabold text-primary dark:text-primary-light">
                    {calculatingFee ? '...' : `Rs. ${total.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <button 
                disabled={calculatingFee || !deliveryData || !!feeError || (deliveryType === 'home' && !user?.homeLocation?.lat)}
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-3.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block text-center text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors"
              >
                ← Continue Shopping
              </Link>

            </div>
          </div>
        )}
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={subtotal}
        deliveryFee={DELIVERY_FEE}
        cartItems={cartItems}
        deliveryAddress={deliveryType === 'home' && user?.homeLocation ? user.homeLocation.address : 'Live Location (GPS)'}
        deliveryDetails={{
          distanceKm: deliveryData?.distanceKm,
          baseFee: deliveryData?.breakdown?.base,
          weightRate: deliveryData?.breakdown?.weightRateUsed,
          weight: deliveryData?.totalWeightKg,
          weightCost: deliveryData?.breakdown?.weightCost,
          distanceRate: 20,
          originalBase: deliveryData?.breakdown?.originalBase,
          originalWeightRate: deliveryData?.breakdown?.originalWeightRate,
        }}
        isCashCheckout={paymentMethod === 'Cash'}
        logisticsError={feeError}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Cart;
