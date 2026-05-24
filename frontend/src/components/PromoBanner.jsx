import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Tag, Truck, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PromoBanner = () => {
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/offers/active');
        if (res.data.success) {
          // Filter to only those where showBanner is true
          const bannerOffers = res.data.data.filter(offer => offer.showBanner);
          
          // Filter out ones the user has dismissed
          const dismissedIds = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
          const activeBanners = bannerOffers.filter(o => !dismissedIds.includes(o._id));
          
          setOffers(activeBanners);
        }
      } catch (err) {
        console.error('Failed to fetch promo banners', err);
      }
    };
    fetchOffers();
  }, []);

  // Rotate through banners if there are multiple
  useEffect(() => {
    if (offers.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % offers.length);
      }, 7000); // 7 seconds per banner
      return () => clearInterval(timer);
    }
  }, [offers.length]);

  const handleDismiss = (offerId) => {
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    dismissedIds.push(offerId);
    localStorage.setItem('dismissedBanners', JSON.stringify(dismissedIds));
    
    // Remove the current offer from state
    const newOffers = offers.filter(o => o._id !== offerId);
    setOffers(newOffers);
    if (newOffers.length === 0) {
      setDismissed(true);
    } else {
      // Adjust index
      setCurrentIndex(0);
    }
  };

  const handleAddToCart = async (offerId) => {
    setAddingId(offerId);
    await addToCart(offerId);
    setAddingId(null);
  };

  if (offers.length === 0 || dismissed) return null;

  const currentOffer = offers[currentIndex];

  // Helper to generate a smart description based on the offer type
  const getSmartDescription = (offer) => {
    const conf = offer.config;
    if (offer.offerType === 'DELIVERY_SUBSIDY_OR_WEIGHT') {
      let desc = '';
      if (conf.waiveBaseFee) desc += 'Enjoy a completely WAIVED base delivery fee (normally Rs. 150)!';
      if (conf.discountedWeightRate) desc += ` Plus, heavily discounted weight rates at just Rs. ${conf.discountedWeightRate}/kg (down from Rs. 30/kg).`;
      if (conf.minCartValue) desc += ` Valid on orders over Rs. ${conf.minCartValue}.`;
      return desc;
    }
    if (offer.offerType === 'MULTI_BUY') {
      const productName = conf.targetProductId?.name || 'select products';
      const originalPrice = conf.targetProductId?.price;
      const originalPriceText = originalPrice ? ` (down from Rs. ${originalPrice})` : '';
      return `Stock up and save! Buy ${conf.minQuantity} or more ${productName} and get them for just Rs. ${conf.discountedUnitPrice} each${originalPriceText}.`;
    }
    if (offer.offerType === 'BUNDLE_PACKAGE') {
      return `Grab our special ${offer.title} for an unbelievable price of Rs. ${conf.bundlePackagePrice}!`;
    }
    return 'Check out this amazing special offer today!';
  };

  const getIcon = (type) => {
    if (type === 'DELIVERY_SUBSIDY_OR_WEIGHT') return <Truck size={18} className="text-yellow-300 animate-bounce" />;
    if (type === 'MULTI_BUY') return <Tag size={18} className="text-yellow-300 animate-pulse" />;
    return <Package size={18} className="text-yellow-300 animate-pulse" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative z-50 overflow-hidden"
      >
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between py-2.5 sm:py-3">
              <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4 md:gap-6 text-center sm:text-left">
                <span className="hidden sm:flex p-1.5 bg-white/20 rounded-lg backdrop-blur-md shadow-inner">
                  {getIcon(currentOffer.offerType)}
                </span>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentOffer._id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={14} className="text-yellow-300 sm:hidden" />
                      <span className="font-black tracking-wide text-sm sm:text-base text-yellow-300 drop-shadow-md uppercase">
                        {currentOffer.title}
                      </span>
                    </div>
                    <span className="hidden sm:inline text-white/50">|</span>
                    <span className="text-xs sm:text-sm font-medium text-emerald-50 drop-shadow-sm max-w-xl">
                      {getSmartDescription(currentOffer)}
                    </span>
                    {currentOffer.offerType === 'BUNDLE_PACKAGE' && (
                      <button
                        onClick={() => handleAddToCart(currentOffer._id)}
                        disabled={addingId === currentOffer._id}
                        className="ml-2 sm:ml-4 px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-teal-900 text-xs font-black uppercase rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {addingId === currentOffer._id ? (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        ) : (
                          <Package size={12} />
                        )}
                        {addingId === currentOffer._id ? 'Adding...' : 'Add to Cart'}
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismiss(currentOffer._id)}
                className="flex-shrink-0 ml-4 p-1.5 rounded-full bg-black/10 hover:bg-black/30 transition-colors text-white/80 hover:text-white"
                aria-label="Dismiss banner"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromoBanner;
