import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProductDetailModal = ({ product, onClose }) => {
  const { user } = useAuth();
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);
  const [added, setAdded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!product) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  const cartItem = getCartItem(product._id || product.id);
  const inCart = !!cartItem;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await addToCart(product._id || product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleIncrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product._id || product.id);
  };

  const handleDecrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem.quantity <= 1) {
      await updateQuantity(product._id || product.id, 0);
    } else {
      await updateQuantity(product._id || product.id, cartItem.quantity - 1);
    }
  };

  const isBundle = product.isOffer && product.offerData?.offerType === 'BUNDLE_PACKAGE';
  const bundleItems = isBundle ? product.offerData.config.bundleProducts : [];

  const originalPrice = isBundle
    ? bundleItems.reduce((acc, item) => acc + (item.quantity * (item.productId?.price || 0)), 0)
    : product.originalPrice || 0; // fallback if single product has originalPrice passed down
    
  const savings = originalPrice > product.price ? originalPrice - product.price : 0;

  const modalContent = (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ${closing ? "animate-fade-out" : "animate-fade-in"}`}>
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />
      
      <div 
        className={`relative w-full max-w-4xl mx-auto flex flex-col md:flex-row bg-white dark:bg-[#111315] rounded-[1.5rem] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-white/10 max-h-[80vh] md:max-h-[550px] ${closing ? "animate-scale-out" : "animate-scale-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 bg-black/40 text-white md:bg-gray-100 hover:bg-black/60 md:hover:bg-gray-200 dark:md:bg-white/5 dark:md:hover:bg-white/10 md:text-gray-600 dark:md:text-gray-300 backdrop-blur-md md:backdrop-blur-none rounded-full transition-all duration-200 hover:rotate-90 hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Side (Left) */}
        <div className="w-full md:w-[45%] relative bg-gray-100 dark:bg-[#16181a] flex-shrink-0 h-52 sm:h-64 md:h-auto">
          <img 
            src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-black/50 backdrop-blur-md text-primary dark:text-primary-light uppercase tracking-wider shadow-sm border border-white/20">
              {product.category}
            </span>
          </div>

          {isBundle && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                Bundle Package
              </span>
            </div>
          )}
        </div>

        {/* Content Side (Right) */}
        <div className="w-full md:w-[55%] flex flex-col relative bg-white dark:bg-charcoal overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 md:p-8 flex-grow flex flex-col">
            <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight pr-0 md:pr-8 leading-tight">
              {product.name}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-[11px] md:text-sm mb-4 md:mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Offer Details (Deadline) */}
            {product.isOffer && product.offerData?.validTo && (
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Offer ends: {new Date(product.offerData.validTo).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}

            {/* Price Block */}
            <div className="flex items-end gap-2 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200 dark:border-white/5 flex-wrap">
              <span className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                <span className="text-sm md:text-base text-gray-400 mr-1 font-bold">Rs.</span>
                {Number(product.price).toFixed(2)}
              </span>
              
              {savings > 0 && (
                <span className="text-base md:text-lg text-gray-400 dark:text-gray-500 line-through font-bold mb-0.5 ml-1">
                  Rs. {Number(originalPrice).toFixed(2)}
                </span>
              )}
              
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md ml-1">
                / {product.unit || 'kg'}
              </span>

              {savings > 0 && (
                <div className="w-full mt-2">
                  <span className="inline-block bg-primary/10 text-primary dark:text-primary-light font-bold text-xs px-2.5 py-1 rounded-md border border-primary/20">
                    Save Rs. {Number(savings).toFixed(2)}!
                  </span>
                </div>
              )}
            </div>

            {/* Bundle Contents */}
            {isBundle && bundleItems && bundleItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  </span>
                  Package Includes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bundleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 group hover:border-primary/30 transition-colors">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-white dark:bg-black/20 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-white/5">
                          {item.productId?.images?.[0] ? (
                             <img src={item.productId.images[0]} alt={item.productId.name} className="w-6 h-6 object-cover rounded" />
                          ) : (
                             <span className="text-sm">📦</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-1 group-hover:text-primary transition-colors">
                          {item.productId?.name || 'Product'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded shadow-sm">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Area */}
            <div className="mt-auto pt-2">
              {inCart ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 shadow-sm">
                  <button
                    onClick={handleDecrement}
                    className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xl flex items-center justify-center hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700 transition-colors shadow-sm"
                  >−</button>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-primary dark:text-primary-light leading-none">
                      {cartItem.quantity}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">In Cart</span>
                  </div>
                  <button
                    onClick={handleIncrement}
                    className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xl flex items-center justify-center hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700 transition-colors shadow-sm"
                  >+</button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md overflow-hidden relative group ${
                    added
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-primary text-white shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 w-0 group-hover:w-full transition-all duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {added ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Added!
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ProductDetailModal;
