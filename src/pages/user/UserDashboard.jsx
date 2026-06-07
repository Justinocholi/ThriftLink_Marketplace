import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Truck, Package, MessageCircle, ChevronRight, Clock } from 'lucide-react';
import { userMe } from '../../services/api';
import { Link } from 'react-router-dom';

const STATUS_STYLE = {
  pending:   { background: '#fef3c7', color: '#b45309', label: 'Pending' },
  confirmed: { background: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
  shipped:   { background: '#ede9fe', color: '#6d28d9', label: 'Shipped' },
  delivered: { background: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled: { background: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

const UserDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [o, s] = await Promise.all([userMe.getOrders(), userMe.getSaved()]);
        setOrders(o);
        setSaved(s);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingCount = orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;
  const recent = orders.slice(0, 5);

  return (
    <div style={{ padding: '1rem', fontFamily: "'Inter', sans-serif" }}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fecaca' }}>
          <span style={{ fontWeight: '600' }}>Error:</span> {error}
        </div>
      )}

      {/* Hero Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Welcome back! 👋</h2>
        <p style={{ color: '#64748b' }}>Here's what's happening with your account today.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Link to="/user/orders" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '14px', color: '#3b82f6' }}>
              <Package size={26} />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Total Orders</p>
              <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '—' : orders.length}</h4>
            </div>
          </div>
        </Link>

        <Link to="/user/saved" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ background: '#fff1f2', padding: '1rem', borderRadius: '14px', color: '#f43f5e' }}>
              <Heart size={26} />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Saved Items</p>
              <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '—' : saved.length}</h4>
            </div>
          </div>
        </Link>

        <Link to="/user/orders" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '14px', color: '#10b981' }}>
              <Truck size={26} />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Active Deliveries</p>
              <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '—' : pendingCount}</h4>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Recent Orders Section */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#64748b" /> Recent Purchases
            </h4>
            <Link to="/user/orders" style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>View All</Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px' }}>
              <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <p style={{ color: '#64748b', fontWeight: '500' }}>No orders yet. Start shopping!</p>
              <Link to="/categories" style={{ display: 'inline-block', marginTop: '1rem', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>Browse Marketplace →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recent.map(order => {
                const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                return (
                  <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={24} color="#64748b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Order #{order.id.slice(0, 8)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>₦{order.total_amount.toLocaleString()}</div>
                      <span style={{ ...st, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & Help */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem' }}>Quick Actions</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <Link to="/user/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Manage Profile <ChevronRight size={18} />
              </Link>
              <Link to="/user/messages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Your Messages <ChevronRight size={18} />
              </Link>
              <Link to="/user/support" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Help & Support <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '24px', padding: '2rem', color: 'white' }}>
            <h4 style={{ fontWeight: '800', marginBottom: '0.75rem' }}>Need Help?</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.5', marginBottom: '1.25rem' }}>Our customer success team is here to assist you with any questions or issues.</p>
            <button style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>Contact Support</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;

