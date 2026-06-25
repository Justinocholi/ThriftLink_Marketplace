import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Settings, LogOut, Store, ShoppingBag, ShieldCheck, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LetterAvatar from './LetterAvatar';

/**
 * Avatar + caret button that opens a dropdown with profile menu items.
 * role: 'user' | 'vendor' | 'admin'
 */
const ProfileDropdown = ({ role = 'user', accent = '#3b82f6' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const name = user?.name || (role === 'admin' ? 'Admin' : role === 'vendor' ? 'Vendor' : 'Buyer');
  const email = user?.email || '';
  const avatarUrl = user?.avatar || user?.avatar_url || null;

  const RoleIcon = role === 'vendor' ? Store : role === 'admin' ? ShieldCheck : User;

  const profileLink = role === 'vendor' ? '/vendor/profile' : role === 'admin' ? '/admin/settings' : '/user/profile';
  const settingsLink = role === 'vendor' ? '/vendor/settings' : role === 'admin' ? '/admin/settings' : '/user/profile';
  const contextLink = role === 'vendor'
    ? { to: '/vendor', label: 'Visit storefront', icon: <Store size={16} /> }
    : role === 'admin'
      ? { to: '/admin', label: 'Admin overview', icon: <ShieldCheck size={16} /> }
      : { to: '/categories', label: 'Browse marketplace', icon: <ShoppingBag size={16} /> };

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.65rem 0.9rem', textDecoration: 'none',
    color: '#0f172a', fontSize: '0.9rem', fontWeight: 500,
    background: 'transparent', border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left'
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '999px', padding: '0.3rem 0.65rem 0.3rem 0.3rem',
          cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
        }}
      >
        <LetterAvatar
          name={name}
          src={avatarUrl}
          size={32}
          alt={name}
        />
        <RoleIcon size={14} color={accent} />
        <ChevronDown size={16} color="#64748b" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '14px', minWidth: 240, zIndex: 50,
            boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            {email && <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>}
          </div>
          <div style={{ padding: '0.35rem 0' }}>
            <Link to={profileLink} onClick={() => setOpen(false)} style={itemStyle}>
              <User size={16} color="#64748b" /> Profile
            </Link>
            <Link to={settingsLink} onClick={() => setOpen(false)} style={itemStyle}>
              <Settings size={16} color="#64748b" /> Settings
            </Link>
            <Link to={contextLink.to} onClick={() => setOpen(false)} style={itemStyle}>
              {React.cloneElement(contextLink.icon, { color: '#64748b' })} {contextLink.label}
            </Link>
            <Link to="/" onClick={() => setOpen(false)} style={itemStyle}>
              <Home size={16} color="#64748b" /> Back to marketplace
            </Link>
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.35rem 0' }}>
            <button onClick={handleLogout} style={{ ...itemStyle, color: '#dc2626' }}>
              <LogOut size={16} color="#dc2626" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
