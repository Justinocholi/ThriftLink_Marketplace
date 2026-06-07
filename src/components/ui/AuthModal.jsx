import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

const AuthModal = ({ open, intent, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const intentLabel = intent?.label || 'continue';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register({ ...form, role: 'user' });

      if (!res.success) {
        setError(res.error || 'Something went wrong');
        toast.error(res.error || 'Authentication failed');
        return;
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully');
      onSuccess?.(res);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="tl-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="tl-modal" role="dialog" aria-modal="true">
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="#25D366" />
            <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem 0' }}>
          <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '1rem' }}>
            Please {mode === 'login' ? 'sign in' : 'register'} to {intentLabel}. We'll bring you
            right back to where you were.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mode === 'signup' && (
              <Field icon={<User size={16} />}>
                <input
                  required
                  className="tl-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
            )}
            <Field icon={<Mail size={16} />}>
              <input
                required
                type="email"
                className="tl-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            {mode === 'signup' && (
              <input
                className="tl-input"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            )}
            <Field icon={<Lock size={16} />}>
              <input
                required
                type="password"
                className="tl-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
              />
            </Field>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="tl-btn tl-btn-primary tl-btn-block">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', marginTop: '1rem' }}>
            {mode === 'login' ? "New to ThriftLink? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#25D366',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div style={{ padding: '1rem 1.5rem 1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          By continuing you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

const Field = ({ icon, children }) => (
  <div style={{ position: 'relative' }}>
    <span
      style={{
        position: 'absolute',
        left: '0.85rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#94a3b8',
        display: 'flex',
      }}
    >
      {icon}
    </span>
    {children}
  </div>
);

export default AuthModal;
