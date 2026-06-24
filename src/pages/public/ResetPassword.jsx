import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { passwordReset } from '../../services/api';
import PasswordField from '../../components/PasswordField';

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f9fafb', fontFamily: "'Inter', sans-serif" };
const card = { background: 'white', borderRadius: 16, padding: '2.5rem', maxWidth: 460, width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const input = { width: '100%', padding: '0.85rem 1rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem' };

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get('uid') || '';
  const token = params.get('token') || '';
  // Supabase's resetPasswordForEmail returns its own session — when that flow is used,
  // Supabase redirects with `access_token`/`type=recovery` in the URL fragment (#).
  // We support both: if uid+token are present we hit our local endpoint; otherwise
  // we tell the user to follow the Supabase email link, which lands them logged in
  // and from there they should change password via the dashboard.

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // After successful reset, auto-redirect to login after a moment.
    if (done) {
      const t = setTimeout(() => navigate('/login', { replace: true }), 2500);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6) return setError('Password must be at least 6 characters.');
    if (pw !== pw2) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await passwordReset.complete(uid, token, pw);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not reset your password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Password updated
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            You can now sign in with your new password. Redirecting you to login…
          </p>
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  if (!uid || !token) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Open the link from your email
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            This page needs to be opened from the reset link we sent to your email. The link expires after one hour.
          </p>
          <Link to="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Set a new password
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Choose something you haven't used before. Minimum 6 characters.
        </p>
        <form onSubmit={submit}>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
            New password
          </label>
          <div style={{ marginBottom: '1rem' }}>
            <PasswordField required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="New password" minLength={6} />
          </div>

          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
            Confirm new password
          </label>
          <PasswordField required value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="Confirm password" />

          {error && (
            <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', marginTop: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.9rem', marginTop: '1.25rem', background: loading ? '#86efac' : '#25D366', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
