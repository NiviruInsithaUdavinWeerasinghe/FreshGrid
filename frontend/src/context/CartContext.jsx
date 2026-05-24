import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/cart';

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState([]); // [{ productId, quantity, product }]
  const [cartLoading, setCartLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('Card');

  // Total number of individual items in cart (sum of quantities)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Fetch cart from server ──────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!token) return;
    setCartLoading(true);
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setCartItems(res.data.data);
    } catch (err) {
      console.error('fetchCart error:', err);
    } finally {
      setCartLoading(false);
    }
  }, [token]);

  // Re-fetch whenever the user logs in/out
  useEffect(() => {
    if (user && token) {
      fetchCart();
    } else {
      setCartItems([]); // Clear local cart on logout
    }
  }, [user, token, fetchCart]);

  // ─── Add to cart (or increment quantity) ────────────────────────────────────
  const addToCart = async (productId) => {
    if (!token) return;
    try {
      const res = await axios.post(
        API,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setCartItems(res.data.data);
    } catch (err) {
      console.error('addToCart error:', err);
    }
  };

  // ─── Update item quantity (set to exact value; <= 0 removes item) ────────────
  const updateQuantity = async (productId, quantity) => {
    if (!token) return;
    try {
      const res = await axios.put(
        `${API}/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setCartItems(res.data.data);
    } catch (err) {
      console.error('updateQuantity error:', err);
    }
  };

  // ─── Remove item entirely ────────────────────────────────────────────────────
  const removeItem = async (productId) => {
    if (!token) return;
    try {
      const res = await axios.delete(`${API}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setCartItems(res.data.data);
    } catch (err) {
      console.error('removeItem error:', err);
    }
  };

  // ─── Clear cart entirely ─────────────────────────────────────────────────────
  const clearCart = async () => {
    if (!token) return;
    try {
      const res = await axios.delete(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setCartItems([]);
    } catch (err) {
      console.error('clearCart error:', err);
    }
  };

  // ─── Check if a product is in the cart ──────────────────────────────────────
  const getCartItem = (productId) =>
    cartItems.find(item => item.productId?.toString() === productId?.toString());

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartLoading,
        addToCart,
        updateQuantity,
        removeItem,
        getCartItem,
        fetchCart,
        clearCart,
        deliveryType,
        setDeliveryType,
        paymentMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
