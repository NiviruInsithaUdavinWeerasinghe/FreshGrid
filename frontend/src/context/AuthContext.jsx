import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('userToken'));
  const [loading, setLoading] = useState(true);

  // Set default auth headers for axios if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const fetchMe = async (authToken) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login', { email, password });
    if (res.data.success) {
      const newToken = res.data.token;
      localStorage.setItem('userToken', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      await fetchMe(newToken);
      return res.data;
    }
  };

  const register = async (name, email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/register', { name, email, password });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const loginWithGoogle = () => {
    window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/google';
  };

  const loginWithFacebook = () => {
    window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/facebook';
  };

  const handleOAuthLogin = (newToken) => {
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setLoading(true);
    fetchMe(newToken);
  };

  const updateProfileDetails = async (payload) => {
    const isFormData = payload instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};

    const res = await axios.put((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/profile', payload, { headers });
    if (res.data.success) {
      setUser(res.data.user);
      return res.data;
    }
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    const res = await axios.put((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/profile/password', {
      currentPassword,
      newPassword,
    });
    if (res.data.success) {
      await fetchMe(token);
    }
    return res.data;
  };

  const verifyCurrentPassword = async (currentPassword) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/profile/verify-password', {
      currentPassword,
    });
    return res.data;
  };

  // ─── WebAuthn / Passkeys Frontend Actions ───────────────────────────────────

  const registerPasskey = async () => {
    try {
      // 1. Fetch options from backend
      const optionsRes = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/register/begin');
      const options = optionsRes.data;

      // 2. Open browser passkey popup
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // 3. Post verification payload back to backend
      const verifyRes = await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/register/finish',
        registrationResponse
      );

      if (verifyRes.data.success) {
        // Refresh profile info to reflect passkey link
        await fetchMe(token);
        return verifyRes.data;
      }
      throw new Error(verifyRes.data.message || 'Passkey registration failed.');
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const unlinkPasskey = async () => {
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/unlink');
      if (res.data.success) {
        await fetchMe(token);
        return res.data;
      }
      throw new Error(res.data.message || 'Passkey unlinking failed.');
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithPasskey = async (email, prefetchedData = null) => {
    try {
      let options, userId;
      if (prefetchedData) {
        options = prefetchedData.options;
        userId = prefetchedData.userId;
      } else {
        // 1. Fetch authentication options
        const beginRes = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/login/begin', { email });
        options = beginRes.data.options;
        userId = beginRes.data.userId;
      }

      // 2. Run browser WebAuthn challenge dialog
      const assertionResponse = await startAuthentication({ optionsJSON: options });

      // 3. Verify assertion payload
      const finishRes = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/login/finish', {
        response: assertionResponse,
        userId,
      });

      if (finishRes.data.success) {
        const newToken = finishRes.data.token;
        localStorage.setItem('userToken', newToken);
        setToken(newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        await fetchMe(newToken);
        return finishRes.data;
      }
      throw new Error(finishRes.data.message || 'Passkey authentication failed.');
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithFacebook,
        handleOAuthLogin,
        registerPasskey,
        unlinkPasskey,
        loginWithPasskey,
        updateProfileDetails,
        changeUserPassword,
        verifyCurrentPassword,
        refreshProfile: () => fetchMe(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
