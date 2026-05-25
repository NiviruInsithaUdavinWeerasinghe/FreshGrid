import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

export const useAiAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const sessionIdRef = useRef(localStorage.getItem('ai_session_id') || Math.random().toString(36).substring(2, 15));
  const abortControllerRef = useRef(null);
  
  // Persist session id
  useEffect(() => {
    localStorage.setItem('ai_session_id', sessionIdRef.current);
  }, []);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, addToCart, removeItem, updateQuantity, setDeliveryType, paymentMethod, setPaymentMethod, deliveryType, fetchCart } = useCart();
  const { token, user } = useAuth();

  const smoothNavigate = useCallback((path, scrollTo) => {
    // Determine the base path vs any hash or query
    const targetPathname = path.split('#')[0].split('?')[0];
    const isSamePage = location.pathname === targetPathname || (location.pathname === '/' && targetPathname === '');

    const doScroll = () => {
      if (scrollTo === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else if (scrollTo === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (scrollTo) {
        const el = document.getElementById(scrollTo.replace('#', ''));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (isSamePage) {
      if (path !== targetPathname) {
        navigate(path);
      }
      doScroll();
      return;
    }
    
    // Fallback for browsers without View Transitions API
    if (!document.startViewTransition) {
      navigate(path);
      setTimeout(doScroll, 150);
      return;
    }

    // Modern smooth transition with view transition API
    document.startViewTransition(() => {
      navigate(path);
      setTimeout(doScroll, 150);
    });
  }, [location.pathname, navigate]);

  const handleAction = useCallback(async (actionData) => {
    const { type, payload } = actionData;
    
    switch (type) {
      case 'navigate':
        if (payload.path) smoothNavigate(payload.path, payload.scrollTo);
        break;
      case 'manage_cart':
        if (payload.action === 'add') {
          for (let i = 0; i < (payload.quantity || 1); i++) {
            await addToCart(payload.productId);
          }
        } else if (payload.action === 'remove') {
          await removeItem(payload.productId);
        } else if (payload.action === 'update') {
          await updateQuantity(payload.productId, payload.quantity);
        } else if (payload.action === 'clear') {
          for (const item of cartItems) {
            await removeItem(item.productId);
          }
        } else if (payload.action === 'set_delivery_type') {
          if (setDeliveryType && payload.deliveryType) {
            setDeliveryType(payload.deliveryType);
            if (location.pathname !== '/cart') {
              smoothNavigate('/cart');
            }
          }
        } else if (payload.action === 'set_payment_method') {
          if (setPaymentMethod && payload.paymentMethod) {
            setPaymentMethod(payload.paymentMethod);
            if (location.pathname !== '/cart') {
              smoothNavigate('/cart');
            }
          }
        } else if (payload.action === 'checkout') {
          // Trigger the cash checkout manually from the frontend hook
          if (paymentMethod === 'Cash' && cartItems.length > 0) {
            try {
              // Calculate simple subtotal
              const subtotal = cartItems.reduce((s, item) => s + (item.product.price * item.quantity), 0);
              
              // Simplistic fee structure for AI auto-checkout
              const totalDeliveryFee = deliveryType === 'live' ? 150 : 100;
              
              const orderItems = cartItems.map(item => ({
                product: item.product._id,
                name: item.product.name,
                image: item.product.images?.[0] || '',
                quantity: item.quantity,
                priceAtPurchase: item.product.price
              }));
              
              const orderPayload = {
                items: orderItems,
                deliveryDetails: {
                  address: deliveryType === 'live' ? 'Live Location (GPS)' : (user?.homeLocation?.address || 'Unknown'),
                  distanceKm: 0,
                  baseFee: totalDeliveryFee,
                  weightRate: 0,
                  totalWeight: 0
                },
                totals: {
                  subtotal: subtotal,
                  deliveryFee: totalDeliveryFee,
                  total: subtotal + totalDeliveryFee
                },
                paymentMethod: 'Cash',
                paymentStatus: 'Pending'
              };

              const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/orders', orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (res.data.success) {
                fetchCart(); // Clear local cart state
                smoothNavigate('/orders'); // Redirect them to orders page
              }
            } catch (err) {
              console.error("AI Checkout error:", err);
            }
          }
        }
        break;
      case 'search_products':
        navigate(`/shop?search=${encodeURIComponent(payload.query || '')}&category=${encodeURIComponent(payload.category || '')}`);
        break;
      case 'manage_subscription':
        if (payload.action === 'subscribe') {
          if (!token) {
            smoothNavigate('/login');
          } else {
            try {
              await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/subscribe', {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch(e) {
              console.error(e);
            }
          }
        }
        break;
      case 'close_chat':
        window.dispatchEvent(new Event('ai_close_chat'));
        break;
      case 'navigate_shop_pagination':
        if (location.pathname !== '/shop') {
          smoothNavigate('/shop');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ai_paginate', { detail: payload }));
        }, 300);
        break;
      default:
        console.log('Unknown action:', type);
    }
  }, [navigate, addToCart, removeItem, updateQuantity, cartItems]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(API, {
        message: text,
        sessionId: sessionIdRef.current,
        activePage: location.pathname,
        cartState: cartItems.map(item => ({ 
          id: item.productId, 
          name: item.product?.name || 'Unknown Product',
          qty: item.quantity 
        })),
        paymentMethod: paymentMethod // provide AI with current payment method context
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        signal: abortControllerRef.current.signal
      });

      const { data } = res.data;

      // Execute action if present
      if (data.text) {
        // Add AI text response
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: data.text }]);
      }

      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          await handleAction(action);
        }
        
        if (!data.text) {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'system', text: "I've handled your requests." }]);
        }
      } else if (data.action) {
        await handleAction(data.action);
        
        if (!data.text) {
          let actionFeedback = "I've handled that for you.";
          if (data.action.type === 'navigate') actionFeedback = `Navigating to ${data.action.payload.path}...`;
          if (data.action.type === 'manage_cart') actionFeedback = `Cart updated!`;
          if (data.action.type === 'search_products') actionFeedback = `Searching for products...`;
          
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'system', text: actionFeedback }]);
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled by user');
      } else {
        console.error('Chat error:', error);
        setMessages(prev => [...prev, { id: Date.now(), role: 'system', text: "Sorry, I couldn't process that request right now." }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), role: 'system', text: "Generation stopped." }]);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      // Use local sessionId for now as anonymous identifier if not logged in
      const res = await axios.get(`${API}/history?sessionId=${sessionIdRef.current}`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true 
      });
      if (res.data.success) {
        setChatSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  const loadSession = useCallback(async (sessionId) => {
    try {
      setIsTyping(true);
      const res = await axios.get(`${API}/${sessionId}`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true 
      });
      if (res.data.success) {
        setMessages(res.data.data);
        sessionIdRef.current = sessionId;
        localStorage.setItem('ai_session_id', sessionId);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    const newSessionId = Math.random().toString(36).substring(2, 15);
    sessionIdRef.current = newSessionId;
    localStorage.setItem('ai_session_id', newSessionId);
    setMessages([]);
  }, []);

  return { 
    messages, 
    isTyping, 
    sendMessage, 
    chatSessions, 
    fetchSessions, 
    loadSession, 
    startNewChat,
    stopGeneration
  };
};
