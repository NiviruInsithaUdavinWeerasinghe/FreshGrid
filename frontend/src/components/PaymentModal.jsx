import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, Loader2, CheckCircle, Wifi, Info, Navigation, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PaymentModal({ isOpen, onClose, amount, deliveryFee = 0, deliveryDetails = null, logisticsError = null, onSuccess, cartItems = [], deliveryAddress = '', isCashCheckout = false }) {
  const { user } = useAuth();
  const storageKey = `freshgrid_saved_card_${user?.id || 'guest'}`;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  // Dummy form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [rememberCard, setRememberCard] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
      }, 300); // Wait for exit animation to finish
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCardNumber(parsed.cardNumber || '');
        setExpiry(parsed.expiry || '');
        setCvc(parsed.cvc || '');
        setName(parsed.name || '');
        setRememberCard(true);
      }
    } catch (e) {
      console.error('Could not load saved card', e);
    }
  }, [storageKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create the order payload
      const token = localStorage.getItem('token');
      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0] || '',
        quantity: item.quantity,
        priceAtPurchase: item.product.price
      }));

      const payload = {
        items: orderItems,
        deliveryDetails: {
          address: deliveryAddress || 'Live Location',
          distanceKm: deliveryDetails?.distanceKm || 0,
          baseFee: deliveryDetails?.baseFee || 0,
          weightRate: deliveryDetails?.weightRate || 0,
          totalWeight: deliveryDetails?.weight || 0
        },
        totals: {
          subtotal: amount,
          deliveryFee: deliveryFee,
          total: amount + deliveryFee
        },
        paymentMethod: isCashCheckout ? 'Cash' : 'Card',
        paymentStatus: isCashCheckout ? 'Pending' : 'Paid'
      };

      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/orders', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        if (rememberCard) {
          localStorage.setItem(storageKey, JSON.stringify({
            cardNumber, expiry, cvc, name
          }));
        } else {
          localStorage.removeItem(storageKey);
        }

        setIsProcessing(false);
        setIsSuccess(true);

        // Wait a bit to show the success checkmark
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Order creation failed', err);
      alert('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length >= 2) {
      let month = parseInt(value.slice(0, 2), 10);
      if (month > 12) month = 12;
      if (month === 0) month = 1;
      const monthStr = month.toString().padStart(2, '0');
      
      // Year validation
      let yearStr = value.slice(2);
      if (yearStr.length === 2) {
        const currentYear = parseInt(new Date().getFullYear().toString().slice(-2), 10);
        let year = parseInt(yearStr, 10);
        if (year < currentYear) year = currentYear;
        yearStr = year.toString().padStart(2, '0');
      }
      
      if (value.length > 2) {
        value = `${monthStr} / ${yearStr}`;
      } else {
        value = monthStr;
      }
    } else if (value.length === 1 && parseInt(value, 10) > 1) {
      value = `0${value} / `;
    }
    
    setExpiry(value);
  };

  const handleCvcChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCvc(value);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div key="payment-modal-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && !isSuccess && onClose()}
            className="absolute inset-0 bg-black/60 dark:bg-black/80"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-6 py-5 flex justify-between items-center relative z-10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                {isCashCheckout ? (
                  <><CheckCircle size={18} className="text-primary" /> Confirm Order</>
                ) : (
                  <><Lock size={18} className="text-primary" /> Secure Checkout</>
                )}
              </h3>
              {!isProcessing && !isSuccess && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="p-5 md:p-6">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <CheckCircle size={70} className="text-primary mb-4 drop-shadow-[0_0_15px_rgba(5,150,105,0.4)]" />
                  </motion.div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed!</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    {isCashCheckout ? 'Your order is placed. You can pay with cash upon delivery.' : 'Your secure transfer is verified.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Total Payment Info */}
                  <div className="flex justify-between items-start mb-4 px-1">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Payment</p>
                      <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                        Rs. {(amount + deliveryFee)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {deliveryFee > 0 && (
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setShowFeeDetails(!showFeeDetails)}
                            className="text-primary text-[9px] font-bold mt-1 uppercase tracking-tighter hover:text-primary-light transition-colors flex items-center gap-1 group"
                          >
                            Includes Delivery Fee <Info size={10} className="opacity-70 group-hover:opacity-100" />
                          </button>

                          {/* Fee Breakdown Popup */}
                          <AnimatePresence>
                            {showFeeDetails && deliveryDetails && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute left-0 top-full mt-2 z-[60] w-64 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden"
                              >
                                <h5 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                  Fee Breakdown
                                </h5>
                                
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Lock size={12} className="text-gray-500" />
                                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase">Base Fee</span>
                                    </div>
                                    <span className="text-[10px] text-gray-900 dark:text-white font-mono flex items-center gap-1.5">
                                      {deliveryDetails.baseFee === 0 ? (
                                        <>
                                          <span className="line-through text-gray-400 text-[9px]">Rs.{deliveryDetails.originalBase || 150}</span>
                                          <span className="text-emerald-500 font-bold uppercase text-[9px] bg-emerald-500/10 px-1 rounded">Waived!</span>
                                          <span>Rs.0</span>
                                        </>
                                      ) : (
                                        `Rs. ${deliveryDetails.baseFee || 150}`
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Navigation size={12} className="text-gray-500" />
                                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase">Distance ({deliveryDetails.distanceKm}km)</span>
                                    </div>
                                    <span className="text-[10px] text-gray-900 dark:text-white font-mono">+{((deliveryDetails.distanceKm || 0) * (deliveryDetails.distanceRate || 20)).toLocaleString()}</span>
                                  </div>

                                  <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Scale size={12} className="text-gray-500" />
                                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase">Weight ({deliveryDetails.weight}kg)</span>
                                    </div>
                                    <span className="text-[10px] text-gray-900 dark:text-white font-mono flex items-center gap-1.5">
                                      {deliveryDetails.weightRate < (deliveryDetails.originalWeightRate || 30) ? (
                                        <>
                                          <span className="line-through text-gray-400 text-[9px]">Rs.{((deliveryDetails.weight || 0) * (deliveryDetails.originalWeightRate || 30)).toLocaleString()}</span>
                                          <span className="text-emerald-500 font-bold uppercase text-[9px] bg-emerald-500/10 px-1 rounded">Discounted</span>
                                          <span>+{(deliveryDetails.weightCost || ((deliveryDetails.weight || 0) * (deliveryDetails.weightRate || 30))).toLocaleString()}</span>
                                        </>
                                      ) : (
                                        `+${(deliveryDetails.weightCost || ((deliveryDetails.weight || 0) * (deliveryDetails.weightRate || 30))).toLocaleString()}`
                                      )}
                                    </span>
                                  </div>
                                  
                                  <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-[10px] text-primary font-black uppercase">Total Delivery</span>
                                    <span className="text-xs text-primary font-black font-mono">Rs. {deliveryFee.toLocaleString()}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    {deliveryFee > 0 && (
                      <div className="text-right">
                        <div className="text-gray-500 text-[10px] font-bold decoration-gray-300 dark:decoration-gray-700">
                          Base: Rs. {amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-primary text-[10px] font-bold">
                          Delivery: Rs. {deliveryFee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Popup */}
                  {logisticsError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                    >
                      <div className="bg-red-500/20 p-1.5 rounded-lg text-red-500">
                        <Wifi size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-500 dark:text-red-400">Notice</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400/80 leading-tight mt-0.5">{logisticsError}</p>
                      </div>
                    </motion.div>
                  )}
                  {/* Form or Cash Button */}
                  {isCashCheckout ? (
                    <div className="mt-8 space-y-4">
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-sm font-bold text-primary dark:text-primary-light">
                          💵 Cash on Delivery Selected
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          You will pay the total amount directly to our delivery agent when your order arrives.
                        </p>
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="w-full mt-2 bg-primary hover:bg-primary-light text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_30px_rgba(5,150,105,0.5)] disabled:opacity-70 disabled:cursor-not-allowed text-base"
                      >
                        {isProcessing ? (
                          <><Loader2 size={18} className="animate-spin" /> Processing...</>
                        ) : (
                          `Confirm Order for Rs. ${(amount + deliveryFee)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Beautiful Card UI - Adapted to Emerald Theme */}
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 text-white shadow-xl overflow-hidden mb-5 transition-all duration-300 transform preserve-3d group"
                      >
                        {/* Abstract Glass shapes */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

                        {/* Card Header: Chip and Brand */}
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-center gap-2">
                            {/* Golden Chip */}
                            <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-600 p-px shadow-sm">
                              <div className="w-full h-full border border-yellow-700/30 rounded-sm relative overflow-hidden flex flex-col justify-evenly">
                                <div className="w-full h-px bg-yellow-700/30"></div>
                                <div className="w-full h-px bg-yellow-700/30"></div>
                                <div className="absolute inset-y-0 left-1/3 w-px bg-yellow-700/30"></div>
                                <div className="absolute inset-y-0 right-1/3 w-px bg-yellow-700/30"></div>
                              </div>
                            </div>
                            <Wifi className="rotate-90 ml-1 opacity-80" size={20} strokeWidth={2.5} />
                          </div>
                          <div className="font-black italic text-xl tracking-widest opacity-95 drop-shadow-md">VISA</div>
                        </div>

                        {/* Card Content */}
                        <div className="mt-5 sm:mt-6 relative z-10">
                          <div className="font-mono text-lg sm:text-xl tracking-[0.15em] sm:tracking-[0.2em] mb-4 text-shadow-sm font-medium">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="opacity-90">
                              <p className="text-[8px] uppercase tracking-widest mb-1 opacity-70">Card Holder</p>
                              <p className="font-bold tracking-wide truncate max-w-[150px] sm:max-w-[180px] text-sm">{name || 'YOUR NAME'}</p>
                            </div>
                            <div className="opacity-90 text-right">
                              <p className="text-[8px] uppercase tracking-widest mb-1 opacity-70">Expires</p>
                              <p className="font-bold tracking-wide font-mono text-sm">{expiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <div className="border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all shadow-inner">
                            <div className="flex items-center px-4 py-2.5 border-b border-gray-200 dark:border-white/10 w-full group">
                              <CreditCard size={18} className="text-gray-400 mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
                              <input
                                type="text"
                                placeholder="Card number"
                                required
                                className="w-full text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none bg-transparent font-mono text-base"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                              />
                            </div>
                            <div className="flex">
                              <input
                                type="text"
                                placeholder="MM / YY"
                                required
                                className="w-1/2 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none border-r border-gray-200 dark:border-white/10 bg-transparent font-mono text-base"
                                value={expiry}
                                onChange={handleExpiryChange}
                              />
                              <input
                                type="text"
                                placeholder="CVC"
                                required
                                className="w-1/2 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none bg-transparent font-mono text-base"
                                value={cvc}
                                onChange={handleCvcChange}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Name on card"
                            required
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium shadow-inner text-base"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-3 mt-3 mb-1 ml-1">
                          <input
                            type="checkbox"
                            id="rememberCard"
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-charcoal text-primary focus:ring-primary focus:ring-offset-white dark:focus:ring-offset-charcoal cursor-pointer accent-primary transition-colors"
                            checked={rememberCard}
                            onChange={(e) => setRememberCard(e.target.checked)}
                          />
                          <label htmlFor="rememberCard" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors tracking-wide">
                            Save securely for faster checkout
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full mt-5 bg-primary hover:bg-primary-light text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_30px_rgba(5,150,105,0.5)] disabled:opacity-70 disabled:cursor-not-allowed text-base"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Processing...
                            </>
                          ) : (
                            `Confirm & Pay Rs. ${(amount + deliveryFee)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
