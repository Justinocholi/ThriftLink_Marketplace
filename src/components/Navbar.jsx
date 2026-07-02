import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRealtime } from '../context/RealtimeContext';
import { ShoppingCart, User, LogOut, Settings, LayoutDashboard, MessageSquare, Users, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import logo from '../assets/thriftlink-logo-.png';
import gpsIcon from '../assets/gps.png';
import LetterAvatar from './LetterAvatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { connected, unreadNotifications } = useRealtime();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#334155',
    textDecoration: 'none',
    fontSize: '0.875rem',
    borderRadius: '8px',
    transition: 'background 0.2s',
    cursor: 'pointer'
  };

  const handleMenuItemMouseOver = (e) => {
    e.currentTarget.style.background = '#f8fafc';
  };

  const handleMenuItemMouseOut = (e) => {
    e.currentTarget.style.background = 'transparent';
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'vendor') return '/vendor';
    if (user.role === 'user') return '/user';
    return '/';
  };

  const getCTALink = () => {
    if (!user) return '/login';
    if (user.role === 'vendor') return '/vendor/products';
    if (user.role === 'admin') return '/admin';
    return '/categories';
  };

  const getCTAText = () => {
    if (!user) return 'Get Started';
    if (user.role === 'vendor') return 'Post Ad';
    if (user.role === 'admin') return 'Dashboard';
    return 'Start Shopping';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`header tl-glass ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src={logo} alt="Thrift Link Logo" className="logo-img" />
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu}
        >
          ☰
        </button>

        <nav>
          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/verified-vendors">Verified Vendors</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          {false && (
          <div className="location-selector" style={{ display: 'none', alignItems: 'center' }}>
            <img src={gpsIcon} alt="Location" className="location-icon" style={{ position: 'absolute', marginLeft: '10px', width: '16px', height: '16px' }} />
            <select
              style={{
                padding: '0.5rem 0.5rem 0.5rem 2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: '#f9fafb',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '120px'
              }}
            >
              <option value="">Select State</option>
              <option value="Abia">Abia</option>
              <option value="Adamawa">Adamawa</option>
              <option value="Akwa Ibom">Akwa Ibom</option>
              <option value="Anambra">Anambra</option>
              <option value="Bauchi">Bauchi</option>
              <option value="Bayelsa">Bayelsa</option>
              <option value="Benue">Benue</option>
              <option value="Borno">Borno</option>
              <option value="Cross River">Cross River</option>
              <option value="Delta">Delta</option>
              <option value="Ebonyi">Ebonyi</option>
              <option value="Edo">Edo</option>
              <option value="Ekiti">Ekiti</option>
              <option value="Enugu">Enugu</option>
              <option value="FCT">FCT - Abuja</option>
              <option value="Gombe">Gombe</option>
              <option value="Imo">Imo</option>
              <option value="Jigawa">Jigawa</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Kano">Kano</option>
              <option value="Katsina">Katsina</option>
              <option value="Kebbi">Kebbi</option>
              <option value="Kogi">Kogi</option>
              <option value="Kwara">Kwara</option>
              <option value="Lagos">Lagos</option>
              <option value="Nasarawa">Nasarawa</option>
              <option value="Niger">Niger</option>
              <option value="Ogun">Ogun</option>
              <option value="Ondo">Ondo</option>
              <option value="Osun">Osun</option>
              <option value="Oyo">Oyo</option>
              <option value="Plateau">Plateau</option>
              <option value="Rivers">Rivers</option>
              <option value="Sokoto">Sokoto</option>
              <option value="Taraba">Taraba</option>
              <option value="Yobe">Yobe</option>
              <option value="Zamfara">Zamfara</option>
            </select>
          </div>
          )}

          {user && (
            <span
              title={connected ? 'Live — data syncs in realtime' : 'Realtime offline — reconnecting'}
              aria-label={connected ? 'Live' : 'Offline'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.22rem 0.55rem',
                borderRadius: 999,
                fontSize: '0.7rem',
                fontWeight: 700,
                background: connected ? 'rgba(34,197,94,0.12)' : '#f1f5f9',
                color: connected ? '#15803d' : '#94a3b8',
              }}
            >
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? 'LIVE' : 'Offline'}
              {unreadNotifications > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.62rem',
                    padding: '0 5px',
                    borderRadius: 999,
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {unreadNotifications}
                </span>
              )}
            </span>
          )}

          {(!user || user.role === 'user') && (
            <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: '#4b5563', textDecoration: 'none' }}>
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  border: '2px solid white'
                }}>
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {!user ? (
            <Link to="/login" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LetterAvatar name="Guest" size={40} alt="Guest" />
            </Link>
          ) : (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#25D366',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  border: '2px solid #25D366',
                  overflow: 'hidden'
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
              </button>

              {isProfileOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.75rem',
                  width: '220px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f1f5f9',
                  zIndex: 1000,
                  overflow: 'hidden',
                  padding: '0.5rem'
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{user.role} Account</div>
                  </div>
                  
                  {/* --- Role-Specific Links --- */}

                  {/* Regular User Menu */}
                  {user.role === 'user' && (
                    <>
                      <Link to="/user" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <LayoutDashboard size={18} color="#64748b" />
                        User Dashboard
                      </Link>
                      <Link to="/user/profile" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <User size={18} color="#64748b" />
                        Profile
                      </Link>
                      <Link to="/cart" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <ShoppingCart size={18} color="#64748b" />
                        Cart
                      </Link>
                      <Link to="/user/profile" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <Settings size={18} color="#64748b" />
                        Settings
                      </Link>
                    </>
                  )}

                  {/* Vendor Menu */}
                  {user.role === 'vendor' && (
                    <>
                      <Link to="/vendor" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <LayoutDashboard size={18} color="#64748b" />
                        Vendor Dashboard
                      </Link>
                      <Link to="/vendor/profile" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <User size={18} color="#64748b" />
                        Profile
                      </Link>
                      <Link to="/vendor/messages" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <MessageSquare size={18} color="#64748b" />
                        Messages/Chats
                      </Link>
                      <Link to="/vendor/settings" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <Settings size={18} color="#64748b" />
                        Vendor Settings
                      </Link>
                    </>
                  )}

                  {/* Admin Menu */}
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <LayoutDashboard size={18} color="#64748b" />
                        Admin Dashboard
                      </Link>
                      <Link to="/admin/platform" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <ShieldCheck size={18} color="#64748b" />
                        Platform Management
                      </Link>
                      <Link to="/admin/users" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <Users size={18} color="#64748b" />
                        User Management
                      </Link>
                      <Link to="/admin/settings" onClick={() => setIsProfileOpen(false)} style={menuItemStyle} onMouseOver={handleMenuItemMouseOver} onMouseOut={handleMenuItemMouseOut}>
                        <Settings size={18} color="#64748b" />
                        Settings
                      </Link>
                    </>
                  )}

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>

                  <button 
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                      navigate('/login');
                    }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', borderRadius: '8px', textAlign: 'left', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          
          <Link to={getCTALink()} className="btn post-ad-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>{getCTAText()}</Link>
        </div>
      </div>
      
      {/* Mobile Menu Styles Injection for the button since it wasn't in original CSS */}
      <style>{`
        @media (max-width: 768px) {
          .logo-img { height: 48px !important; filter: none !important; }
          .mobile-menu-btn {
            display: block !important;
            z-index: 1100;
            position: relative;
          }
          .nav-links {
             flex-direction: column;
             position: absolute;
             top: 100%;
             left: 0;
             width: 100%;
             background: white;
             padding: 1rem;
             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
             display: none; /* Default hidden on mobile */
             z-index: 1000;
          }
          .nav-links.active {
            display: flex;
          }
          .header-actions {
            gap: 0.5rem;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .post-ad-btn { display: none !important; }
          .logo-img { height: 44px !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
