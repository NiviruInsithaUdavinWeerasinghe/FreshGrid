import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onClick }) => {
  const { user } = useAuth();
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

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
    // Brief "Added!" feedback
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
      await updateQuantity(product._id || product.id, 0); // 0 triggers removal on backend
    } else {
      await updateQuantity(product._id || product.id, cartItem.quantity - 1);
    }
  };

  return (
    <div 
      onClick={() => onClick && onClick(product)}
      className="glass-panel rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-200 group flex flex-col h-full cursor-pointer relative"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'} 
          alt={product.name} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#1c1c1c]/95 px-3 py-1 rounded-full text-xs font-semibold text-primary dark:text-primary-light border border-gray-200/50 dark:border-white/10">
          {product.category}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Rs. {Number(product.price).toFixed(2)}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">/ {product.unit || 'kg'}</span>
          </span>

          {inCart ? (
            /* Inline quantity stepper when item is already in cart */
            <div className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 rounded-xl px-1 py-1">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 rounded-lg bg-white dark:bg-charcoal text-primary dark:text-primary-light font-bold text-base flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors shadow-sm"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-bold text-primary dark:text-primary-light">
                {cartItem.quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 rounded-lg bg-white dark:bg-charcoal text-primary dark:text-primary-light font-bold text-base flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors shadow-sm"
              >
                +
              </button>
            </div>
          ) : (
            /* Add to cart button */
            <button 
              onClick={handleAddToCart}
              className={`p-2 rounded-lg transition-all duration-300 ${
                added
                  ? 'bg-primary text-white scale-110'
                  : 'bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary dark:text-primary-light dark:hover:text-white'
              }`}
              title="Add to cart"
            >
              {added ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
