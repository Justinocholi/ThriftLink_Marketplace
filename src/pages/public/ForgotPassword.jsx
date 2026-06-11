import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordReset } from '../../services/api';

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f9fafb', fontFamily: "'Inter', sans-serif" };
const card = { background: 'white', borderRadius: 16, padding: '2.5rem', maxWidth: 460, width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const input = { width: '100%', padding: '0.85rem 1rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem' };

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordReset.request(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Forgot your password?
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Enter the email address on your account and we'll send you a reset link.
        </p>

        {submitted ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            If that email is registered, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={input}
            />
            {error && (
              <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', marginTop: '1rem' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '0.9rem', marginTop: '1.25rem', background: loading ? '#86efac' : '#25D366', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
