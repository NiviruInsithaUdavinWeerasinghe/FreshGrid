import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, loginWithGoogle, loginWithFacebook, loginWithPasskey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);

  // Two-step login states
  const [step, setStep] = useState('email'); // 'email', 'password', 'passkey'
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [prefetchedPasskeyData, setPrefetchedPasskeyData] = useState(null);

  // Check query params for verification messages
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      setInfoMessage({
        type: 'success',
        text: 'Email verified successfully! You can now sign in.',
      });
    } else if (verified === 'false') {
      setInfoMessage({
        type: 'error',
        text: error === 'invalid_or_expired'
          ? 'Verification link was invalid or has expired.'
          : 'Email verification failed.',
      });
    }
  }, [searchParams]);

  // Determine redirection path
  const redirectPath = location.state?.from?.pathname || '/';

  const validateEmail = () => {
    const email = formData.email.trim();
    if (!email) {
      setErrors({ email: 'Email is required.' });
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return false;
    }
    return true;
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

  const handleEmailContinue = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsCheckingEmail(true);
    setErrors({});
    setInfoMessage(null);
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/passkey/login/begin', {
        email: formData.email.trim(),
      });
      if (res.data && res.data.options) {
        setPrefetchedPasskeyData(res.data);
        setStep('passkey');
      } else {
        setStep('password');
      }
    } catch (err) {
      // Fallback to password login step if no passkey found or on other errors
      setStep('password');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      setErrors({ password: 'Password is required.' });
      return;
    }

    setLoading(true);
    setErrors({});
    setInfoMessage(null);
    try {
      await login(formData.email.trim(), formData.password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Login failed. Please verify your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setErrors({});
    setInfoMessage(null);
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(formData.email.trim(), prefetchedPasskeyData);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const isCancellation = err.name === 'NotAllowedError' || err.message?.includes('NotAllowedError');
      setErrors({
        general: isCancellation ? 'Passkey sign-in was cancelled.' : (err.response?.data?.message || err.message || 'Passkey authentication failed.'),
      });
    } finally {
      setPasskeyLoading(false);
    }
  };

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Log in to manage your cart and orders</p>
          </div>

          {infoMessage && (
            <div
              className={`mb-5 p-3.5 border rounded-xl text-xs flex items-start gap-2 leading-relaxed ${
                infoMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-500'
              }`}
            >
              <span>{infoMessage.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{infoMessage.text}</span>
            </div>
          )}

          {errors.general && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailContinue} className="space-y-5 animate-slide-up">
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

              <button
                type="submit"
                disabled={isCheckingEmail}
                className="w-full py-3 bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isCheckingEmail ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          )}

          {step === 'passkey' && (
            <div className="space-y-5 animate-slide-up">
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/20 p-4 rounded-2xl text-center">
                <span className="text-2xl mb-1 block">🔑</span>
                <h3 className="text-sm font-bold text-green-800 dark:text-green-400">Passkey Detected</h3>
                <p className="text-xs text-green-750 dark:text-green-500/80 mt-1">
                  We found a passkey linked to <strong>{formData.email}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full py-3 bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {passkeyLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  'Sign In with Passkey'
                )}
              </button>

              <div className="flex flex-col gap-2.5 items-center">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  Use password instead
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Change Email
                </button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleSubmitPassword} className="space-y-5 animate-slide-up">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 px-4 py-2.5 rounded-xl">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                  {formData.email}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs font-bold text-primary hover:text-primary-light"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] ${errors.password ? 'border-red-400 bg-red-50/20' : 'border-gray-200 dark:border-white/10'}`}
                  autoFocus
                />
                {errors.password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="flex flex-col gap-2.5 items-center">
                {prefetchedPasskeyData && (
                  <button
                    type="button"
                    onClick={() => setStep('passkey')}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    🔑 Sign in with Passkey instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {step === 'email' && (
            <>
              <div className="flex items-center my-6 gap-3">
                <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
                <span className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold tracking-wider">Or login with</span>
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
            </>
          )}

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
