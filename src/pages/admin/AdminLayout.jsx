import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Store, Star, Users, LogOut, ShieldCheck, Settings, Flag, CreditCard, Menu, X, Home, ArrowLeft } from 'lucide-react';
import logo from '../../assets/thriftlink-logo-.png';
import MobileTabBar from '../../components/MobileTabBar';
import ProfileDropdown from '../../components/ProfileDropdown';

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    }
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || (path === '/admin' && location.pathname === '/admin');
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { path: '/admin/vendors', icon: <Store size={20} />, label: 'Vendors' },
    { path: '/admin/reviews', icon: <Star size={20} />, label: 'Reviews' },
    { path: '/admin/reports', icon: <Flag size={20} />, label: 'Reports' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { path: '/admin/subscriptions', icon: <CreditCard size={20} />, label: 'Subscriptions' },
    { path: '/admin/platform', icon: <ShieldCheck size={20} />, label: 'Platform' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.25); }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; padding: 1.25rem !important; padding-bottom: 96px !important; overflow-x: hidden !important; max-width: 100% !important; }
          .admin-mobile-header { display: flex !important; }
          .admin-sidebar-close { display: inline-flex !important; }
        }
        .admin-mobile-header { display: none; }
        .admin-sidebar-close { display: none; }
      `}</style>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 19 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`} style={{
        width: '260px',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 0',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 20,
        transition: 'transform 0.3s ease-in-out'
      }}>
        <button
          onClick={() => setDrawerOpen(false)}
          className="admin-sidebar-close"
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logo} alt="ThriftLink" style={{ height: '72px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.55)) brightness(1.1)' }} />
          <span style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Admin</span>
        </div>

        <Link to="/" onClick={() => setDrawerOpen(false)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          margin: '0 1rem 1rem',
          padding: '0.625rem 0.875rem',
          color: '#60a5fa',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <ArrowLeft size={16} />
          <span>Back to ThriftLink</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: isActive(item.path) ? '#60a5fa' : '#94a3b8',
              background: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              textDecoration: 'none',
              padding: '0.875rem 1.5rem',
              borderLeft: `3px solid ${isActive(item.path) ? '#3b82f6' : 'transparent'}`,
              transition: 'all 0.2s'
            }}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <button onClick={handleLogout} style={{
            marginTop: 'auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#f87171',
            background: 'transparent',
            border: 'none',
            padding: '0.875rem 1.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500',
            width: '100%',
            textAlign: 'left'
          }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{
        marginLeft: '260px',
        flex: 1,
        padding: '2.5rem',
        width: '100%'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem' }}>
          <button
            className="admin-mobile-header"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#0f172a',
              alignItems: 'center'
            }}
          >
            <Menu size={22} />
          </button>
          <div style={{ flex: 1 }} />
          <ProfileDropdown role="admin" accent="#3b82f6" />
        </header>
        <Outlet />
      </main>

      <MobileTabBar
        accent="#3b82f6"
        primary={[
          { path: '/', icon: <Home size={22} />, label: 'Marketplace' },
          { path: '/admin', icon: <LayoutDashboard size={22} />, label: 'Overview' },
          { path: '/admin/vendors', icon: <Store size={22} />, label: 'Vendors' },
          { path: '/admin/reports', icon: <Flag size={22} />, label: 'Reports' },
        ]}
        more={[
          { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
          { path: '/admin/reviews', icon: <Star size={20} />, label: 'Reviews' },
          { path: '/admin/subscriptions', icon: <CreditCard size={20} />, label: 'Subscriptions' },
          { path: '/admin/platform', icon: <ShieldCheck size={20} />, label: 'Platform' },
          { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
        ]}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminLayout;
