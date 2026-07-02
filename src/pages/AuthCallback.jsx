import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth as authAPI } from '../services/api';
import { supabase } from '../services/supabaseClient';

// Landing page for the Supabase OAuth redirect (Google/Facebook).
// supabase-js parses the URL hash into a session; we then exchange the
// Supabase access token for our own JWT via POST /api/auth/oauth.
const AuthCallback = () => {
  const [error, setError] = useState('');
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      try {
        if (!supabase) {
          setError('Social login is not configured.');
          return;
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const session = data?.session;
        if (!session?.access_token) {
          setError('No sign-in session found. Please try again.');
          return;
        }
        const { token, user } = await authAPI.oauthExchange(session.access_token);
        loginWithToken(token, user);
        navigate(`/${user.role || 'user'}`, { replace: true });
      } catch (err) {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    };
    run();
  }, [loginWithToken, navigate]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: '2.5rem 3rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}>
        {error ? (
          <>
            <p style={{ color: '#dc2626', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>
            <Link to="/login" style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
          </>
        ) : (
          <>
            <style>{'@keyframes spinAuth { to { transform: rotate(360deg) } }'}</style>
            <div style={{ width: 44, height: 44, border: '4px solid #e5e7eb', borderTopColor: '#25D366', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spinAuth 0.8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontWeight: 500 }}>Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
