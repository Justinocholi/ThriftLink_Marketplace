import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, User, Package, BarChart2, ShoppingCart, MessageCircle, Settings, Crown, LogOut, Menu, X } from 'lucide-react';
import logo from '../../assets/thriftlink-logo-.png';

const VendorLayout = () => {
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
    return location.pathname === path || (path === '/vendor' && location.pathname === '/vendor');
  };

  const navItems = [
    { path: '/vendor', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/vendor/profile', icon: <User size={20} />, label: 'Vendor Profile' },
    { path: '/vendor/products', icon: <Package size={20} />, label: 'Product Listing' },
    { path: '/vendor/analytics', icon: <BarChart2 size={20} />, label: 'Click Analytics' },
    { path: '/vendor/orders', icon: <ShoppingCart size={20} />, label: 'Orders Received' },
    { path: '/vendor/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
    { path: '/vendor/settings', icon: <Settings size={20} />, label: 'Settings' },
    { path: '/vendor/subscription', icon: <Crown size={20} />, label: 'Subscription' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s ease-in-out;
            }
            .sidebar.open {
              transform: translateX(0);
            }
            .main-content {
              margin-left: 0 !important;
            }
            .mobile-header-btn {
              display: block !important;
            }
          }
          .mobile-header-btn {
            display: none;
          }
        `}
      </style>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
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
        background: '#0f172a',
        color: 'white',
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
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="Logo" style={{ height: '40px', background: 'white', borderRadius: '4px' }} />
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>ThriftLink</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} className="mobile-header-btn">
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)} style={{
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
      <main className="main-content" style={{ marginLeft: '260px', flex: 1, padding: '2rem', transition: 'margin-left 0.3s ease-in-out' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          background: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-header-btn"
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#0f172a',
                padding: 0
              }}
            >
              <Menu size={24} />
            </button>
            <h3 style={{ fontSize: '1.75rem', color: '#0f172a', fontWeight: '700' }}>
              {navItems.find(i => isActive(i.path))?.label || 'Vendor Dashboard'}
            </h3>
          </div>
          <Link to="/" className="view-page-btn" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb',
            textDecoration: 'none'
          }}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Vendor" alt="Vendor" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </Link>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
