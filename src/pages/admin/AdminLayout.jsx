import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Store, Star, Users, LogOut, ShieldCheck, Settings, Flag, CreditCard } from 'lucide-react';
import logo from '../../assets/thriftlink-logo-.png';
import MobileTabBar from '../../components/MobileTabBar';
import ProfileDropdown from '../../components/ProfileDropdown';

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; padding: 1.25rem !important; padding-bottom: 96px !important; overflow-x: hidden !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Sidebar (desktop only) */}
      <aside className="admin-sidebar" style={{
        width: '260px',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 0',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logo} alt="ThriftLink" style={{ height: '72px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.55)) brightness(1.1)' }} />
          <span style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Admin</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} style={{
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
        <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
          <ProfileDropdown role="admin" accent="#3b82f6" />
        </header>
        <Outlet />
      </main>

      <MobileTabBar
        accent="#3b82f6"
        primary={[
          { path: '/admin', icon: <LayoutDashboard size={22} />, label: 'Overview' },
          { path: '/admin/vendors', icon: <Store size={22} />, label: 'Vendors' },
          { path: '/admin/reports', icon: <Flag size={22} />, label: 'Reports' },
          { path: '/admin/users', icon: <Users size={22} />, label: 'Users' },
        ]}
        more={[
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
