import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await register(formData.name, formData.email, formData.password);
      if (res.success) {
        setIsSent(true);
      } else {
        setErrors({ general: res.message || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-charcoal flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -ml-16 -mb-16" />

          <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ✉️
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Verify Your Email</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            We have sent a verification link to <strong className="text-gray-800 dark:text-gray-200">{formData.email}</strong>.
            Please open the link to activate your account.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200/50 dark:border-yellow-500/20 rounded-xl p-3.5 mb-6 text-xs text-yellow-700 dark:text-yellow-400 text-left leading-relaxed">
            <strong>⚠️ Developer Tip:</strong> Since we are in development mode, check the backend terminal console for the verification link.
          </div>
          <Link
            to="/login"
            className="inline-block w-full py-3 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glowing background blobs (Static for zero compositing repaint cost) */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative group w-full max-w-md animate-scale-in">
        {/* Glowing animated border (Opacity pulsing only for GPU acceleration) */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-emerald-400 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300 animate-border-pulse"></div>

        <div className="relative w-full glass-panel rounded-3xl p-8 overflow-hidden bg-white/95 dark:bg-[#1c1c1c]/95">
          {/* Decorative background blurs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

          <div className="text-center mb-8 relative">
            <Link to="/" className="inline-block mb-3 text-3xl">🥬</Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join FreshGrid community today</p>
          </div>

          {errors.general && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-gray-200 dark:border-white/10'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] ${errors.email ? 'border-red-400 bg-red-50/20' : 'border-gray-200 dark:border-white/10'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] ${errors.password ? 'border-red-400 bg-red-50/20' : 'border-gray-200 dark:border-white/10'}`}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Confirm
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] ${errors.confirmPassword ? 'border-red-400 bg-red-50/20' : 'border-gray-200 dark:border-white/10'}`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="flex items-center my-6 gap-3">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
            <span className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold tracking-wider">Or register with</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.14-3.14C17.46 1.76 14.94 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.82 2.96c.9-2.7 3.42-4.64 6.94-4.64z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.56v2.96h3.82c2.23-2.05 3.59-5.07 3.59-8.61z" />
                <path fill="#FBBC05" d="M5.06 10.68c-.23-.69-.36-1.43-.36-2.18s.13-1.49.36-2.18L1.24 7.36C.45 8.95 0 10.72 0 12.5s.45 3.55 1.24 5.14l3.82-2.96z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.82-2.96c-1.1.74-2.5 1.18-4.14 1.18-3.52 0-6.04-1.94-6.94-4.64L1.24 16.58C3.2 20.57 7.24 23 12 23z" />
              </svg>
              Google
            </button>
            <button
              onClick={loginWithFacebook}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4 fill-blue-600" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
