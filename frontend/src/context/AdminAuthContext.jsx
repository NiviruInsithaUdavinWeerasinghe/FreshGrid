import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);

// Configure global Axios Request Interceptor to send the correct JWT token
axios.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');

    // Use admin token for dashboard requests, otherwise user token for customer shop requests
    if (window.location.pathname.startsWith('/admin')) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AdminAuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => !!localStorage.getItem('adminToken')
  );

  const login = async (username, password, recaptchaToken) => {
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/admin/login', {
        username,
        password,
        recaptchaToken,
      });

      if (res.data.success) {
        const token = res.data.token;
        localStorage.setItem('adminToken', token);
        setIsAdminLoggedIn(true);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};
      if (status === 429) {
        return { success: false, status: 429, retryAfter: data.retryAfter };
      }
      console.error('Admin login error:', error);
      return { success: false, status };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
