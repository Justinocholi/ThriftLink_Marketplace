import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, ShoppingBag, Heart, User, LifeBuoy, LogOut, Menu, X, MessageSquare, ShoppingCart } from 'lucide-react';
import logo from '../../assets/thriftlink-logo-.png';
import MobileTabBar from '../../components/MobileTabBar';
import ProfileDropdown from '../../components/ProfileDropdown';

const UserLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || (path === '/user' && location.pathname === '/user');
  };

  const navItems = [
    { path: '/user', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/user/orders', icon: <ShoppingBag size={20} />, label: 'My Orders' },
    { path: '/user/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
    { path: '/user/saved', icon: <Heart size={20} />, label: 'Saved Items' },
    { path: '/cart', icon: <ShoppingCart size={20} />, label: 'My Cart' },
    { path: '/user/profile', icon: <User size={20} />, label: 'Profile & Settings' },
    { path: '/user/support', icon: <LifeBuoy size={20} />, label: 'Support' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .sidebar, .sidebar-overlay {
              display: none !important;
            }
            .main-content {
              margin-left: 0 !important;
              padding: 1.25rem !important;
              padding-bottom: 96px !important;
            }
            .mobile-header {
              display: none !important;
            }
          }
          .mobile-header {
            display: none;
          }
          @media (max-width: 640px) {
            .user-welcome-title { font-size: 1.25rem !important; }
            .user-welcome-sub { font-size: 0.85rem !important; }
          }
        `}
      </style>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
        width: '260px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 0',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 10,
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid #f1f5f9', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="ThriftLink" style={{ height: '72px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(22, 184, 101, 0.6)) brightness(1.1)' }} />
            <h2 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 'bold' }}>ThriftLink</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: isActive(item.path) ? '#3b82f6' : '#64748b',
              background: isActive(item.path) ? '#eff6ff' : 'transparent',
              textDecoration: 'none',
              padding: '0.875rem 1.5rem',
              borderRight: `3px solid ${isActive(item.path) ? '#3b82f6' : 'transparent'}`,
              transition: 'all 0.2s',
              fontWeight: isActive(item.path) ? '600' : '500'
            }}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button onClick={handleLogout} style={{
            marginTop: 'auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#ef4444',
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
      <main className="main-content" style={{ marginLeft: '260px', flex: 1, padding: '2rem', transition: 'margin-left 0.3s ease-in-out' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-header"
              onClick={toggleSidebar}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="user-welcome-title" style={{ fontSize: '1.75rem', color: '#0f172a', fontWeight: '700', marginBottom: '0.25rem' }}>
                Welcome back! 👋
              </h1>
              <p className="user-welcome-sub" style={{ color: '#64748b' }}>Here's what's happening with your account.</p>
            </div>
          </div>
          <ProfileDropdown role="user" accent="#3b82f6" />
        </header>

        <Outlet />
      </main>

      <MobileTabBar
        accent="#25D366"
        primary={[
          { path: '/user', icon: <Home size={22} />, label: 'Home' },
          { path: '/user/orders', icon: <ShoppingBag size={22} />, label: 'Orders' },
          { path: '/user/messages', icon: <MessageSquare size={22} />, label: 'Messages' },
          { path: '/cart', icon: <ShoppingCart size={22} />, label: 'Cart' },
        ]}
        more={[
          { path: '/user/saved', icon: <Heart size={20} />, label: 'Saved Items' },
          { path: '/user/profile', icon: <User size={20} />, label: 'Profile & Settings' },
          { path: '/user/support', icon: <LifeBuoy size={20} />, label: 'Support' },
        ]}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default UserLayout;
