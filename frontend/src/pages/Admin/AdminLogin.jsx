import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutInterval = useRef(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutInterval.current = setInterval(() => {
        setLockoutSeconds((s) => {
          if (s <= 1) {
            clearInterval(lockoutInterval.current);
            setError('');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(lockoutInterval.current);
  }, [lockoutSeconds]);

  // Load Google reCAPTCHA v3 script dynamically if siteKey is provided
  useEffect(() => {
    if (siteKey) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge) badge.remove();
      };
    }
  }, [siteKey]);

  const formatCountdown = (secs) => {
    if (secs >= 86400) return `${Math.ceil(secs / 86400)} day(s)`;
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setError('');
    setLoading(true);

    setTimeout(async () => {
      try {
        let recaptchaToken = null;
        if (siteKey && window.grecaptcha) {
          try {
            await new Promise((resolve) => window.grecaptcha.ready(resolve));
            recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'admin_login' });
          } catch (recaptchaErr) {
            console.error('Failed to execute reCAPTCHA:', recaptchaErr);
          }
        }

        const result = await login(username, password, recaptchaToken);
        if (result.success) {
          navigate('/admin/dashboard');
        } else if (result.status === 429) {
          const secs = result.retryAfter || 120;
          setLockoutSeconds(secs);
          setError(`Too many failed attempts. Try again in ${formatCountdown(secs)}.`);
        } else if (result.status === 403) {
          setError('Bot activity suspected. reCAPTCHA verification failed.');
        } else {
          setError('Invalid username or password. Please try again.');
        }
      } catch (err) {
        setError('Invalid username or password. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Static ambient background — no blur/animate-pulse to avoid GPU drain */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-emerald-400/8 rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary dark:text-primary-light mb-2 hover:opacity-80 transition-opacity">
            <span role="img" aria-label="sprout">🌱</span> FreshGrid
          </Link>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Admin Portal</p>
            <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="glass-panel rounded-2xl p-8 space-y-5 shadow-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="admin-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-charcoal/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-white/50 dark:bg-charcoal/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={`flex items-start gap-2 p-3 border rounded-lg text-sm ${
              lockoutSeconds > 0
                ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 animate-shake'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p>{lockoutSeconds > 0 ? 'Too many failed attempts. Account temporarily locked.' : error}</p>
                {lockoutSeconds > 0 && (
                  <p className="mt-1 font-bold text-lg tabular-nums">
                    Try again in: {formatCountdown(lockoutSeconds)}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </>
            ) : lockoutSeconds > 0 ? (
              <>🔒 Locked — {formatCountdown(lockoutSeconds)}</>
            ) : (
              <>
                Sign In
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to main site
          </Link>
        </div>

        {siteKey && (
          <>
            <style>{`
              .grecaptcha-badge { visibility: hidden !important; }
            `}</style>
            <div className="mt-8 text-center text-[10px] text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed border-t border-gray-200/50 dark:border-white/5 pt-4">
              Protected by **reCAPTCHA v3** to prevent unauthorized access. <br />
              Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline font-semibold transition-colors">Privacy</a> & <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline font-semibold transition-colors">Terms</a> apply.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
