import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import thriftlinkLogo from '../assets/thriftlink-logo.png';
import magnifierIcon from '../assets/magnifier.png';
import whatsappIcon from '../assets/whatsapp (1).png';
import shieldIcon from '../assets/shield.png';
import cartIcon from '../assets/shopping-cart.png';
import briefcaseIcon from '../assets/briefcase.png';

const inputStyle = {
  width: '100%',
  padding: '0.9rem 1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '1rem',
  background: 'white',
  boxSizing: 'border-box',
};

const Login = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [signupRole, setSignupRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // When Supabase's confirmation link redirects back to /login?confirmed=1,
  // greet the user so they know to sign in normally now.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('confirmed') === '1') {
      setNotice('Email confirmed! You can sign in now.');
      setActiveTab('signin');
    }
  }, [location.search]);

  const redirectAfterAuth = (role) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
    } else {
      navigate(`/${role}`, { replace: true });
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      redirectAfterAuth(result.type);
    } else {
      setError(result.error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!regName || !regEmail || !regPassword) { setError('Name, email and password are required'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await register({ name: regName, email: regEmail, phone: regPhone, password: regPassword, role: signupRole });
    setLoading(false);
    if (result.success && result.requiresEmailConfirmation) {
      // Switch to sign-in tab and explain what's next. The user can't log in
      // until they click the Supabase confirmation link in their inbox.
      setActiveTab('signin');
      setNotice(result.message || 'Account created. Check your email to confirm before signing in.');
      setEmail(regEmail);
      return;
    }
    if (result.success) {
      redirectAfterAuth(result.type);
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center' }}>
      <style>{`
        @media (max-width: 768px) {
          .auth-container { flex-direction: column !important; padding: 1rem !important; gap: 2rem !important; }
          .info-section { order: 2; text-align: center; }
          .login-section { order: 1; width: 100% !important; flex: unset !important; max-width: 420px; margin: 0 auto; padding: 2rem !important; }
          .info-title { font-size: 2rem !important; }
        }
      `}</style>
      <div className="auth-container" style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '2rem', gap: '3rem', alignItems: 'center', width: '100%' }}>

        {/* Left info panel */}
        <div className="info-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h1 className="info-title" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem', lineHeight: 1.2 }}>
            Join Nigeria's Largest WhatsApp Marketplace
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem', lineHeight: 1.6 }}>
            Connect with thousands of verified vendors, shop safely, and grow your business on Thrift Link.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: magnifierIcon, title: 'Discover Trusted Vendors', desc: 'Browse verified sellers across 25+ categories' },
              { icon: whatsappIcon, title: 'Direct WhatsApp Connection', desc: 'Chat instantly with vendors — no downloads needed' },
              { icon: shieldIcon, title: 'Safe & Secure Platform', desc: 'All vendors verified with ratings and reviews' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '50px', height: '50px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={icon} alt="" style={{ width: '26px', height: '26px', filter: 'brightness(0) invert(1)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.2rem' }}>{title}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-section" style={{ flex: '0 0 450px', background: 'white', borderRadius: '16px', padding: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={thriftlinkLogo} alt="Thrift Link" style={{ height: '100px', objectFit: 'contain', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 12px rgba(22, 184, 101, 0.25))' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {activeTab === 'signin' ? 'Sign in to your Thrift Link account' : 'Join thousands of users on Thrift Link'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '0.3rem', marginBottom: '1.5rem' }}>
            {['signin', 'signup'].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setError(''); }}
                style={{ flex: 1, padding: '0.75rem', border: 'none', background: activeTab === tab ? 'white' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: activeTab === tab ? '#25D366' : '#6b7280', boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontSize: '0.9rem' }}>
                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {notice && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid #a7f3d0' }}>
              {notice}
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="Your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: loading ? '#86efac' : '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp}>
              {/* Role picker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[{ key: 'user', icon: cartIcon, label: 'I want to buy', sub: 'Browse and shop' }, { key: 'vendor', icon: briefcaseIcon, label: 'I want to sell', sub: 'Become a vendor' }].map(({ key, icon, label, sub }) => (
                  <div key={key} onClick={() => setSignupRole(key)} style={{ padding: '1rem', border: `2px solid ${signupRole === key ? '#25D366' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', background: signupRole === key ? '#f0fdf4' : 'white' }}>
                    <img src={icon} alt="" style={{ width: '28px', height: '28px', marginBottom: '0.4rem' }} />
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{label}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Full Name</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} placeholder="Your full name" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Email Address</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} style={inputStyle} placeholder="+234 800 000 0000" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} placeholder="Min 6 characters" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Confirm Password</label>
                <input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} style={inputStyle} placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: loading ? '#86efac' : '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
            By signing up you agree to our{' '}
            <a href="/legal/terms" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>Terms</a> and{' '}
            <a href="/legal/privacy" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
