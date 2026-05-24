import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleOAuthLogin(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=oauth_token_missing', { replace: true });
    }
  }, [searchParams, handleOAuthLogin, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Completing secure sign-in...</span>
      </div>
    </div>
  );
};

export default OAuthCallback;
