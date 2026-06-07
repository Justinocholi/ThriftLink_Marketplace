import React, { useState, useEffect } from 'react';
import { vendorMe } from '../../services/api';
import { Eye, MessageSquare, TrendingUp, Star, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [a, o] = await Promise.all([
          vendorMe.getAnalytics(),
          vendorMe.getOrders()
        ]);
        setAnalytics(a);
        setRecentOrders(o.slice(0, 5));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totals = analytics?.totals || { profile_views: 0, whatsapp_clicks: 0, rating: 0, total_reviews: 0 };
  const conversionRate = totals.profile_views > 0
    ? ((totals.whatsapp_clicks / totals.profile_views) * 100).toFixed(1) + '%'
    : '0%';

  const stats = [
    { label: 'Profile Views', value: totals.profile_views, icon: <Eye size={20} />, color: '#3b82f6', bg: '#eff6ff', trend: '+12%', isUp: true },
    { label: 'WhatsApp Clicks', value: totals.whatsapp_clicks, icon: <MessageSquare size={20} />, color: '#10b981', bg: '#f0fdf4', trend: '+5%', isUp: true },
    { label: 'Conversion', value: conversionRate, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: '#fffbeb', trend: '-2%', isUp: false },
    { label: 'Store Rating', value: totals.rating > 0 ? totals.rating.toFixed(1) : 'New', icon: <Star size={20} />, color: '#8b5cf6', bg: '#f5f3ff', trend: '0%', isUp: true },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Store Overview</h2>
          <p style={{ color: '#64748b' }}>Manage your thrift business and track your performance.</p>
        </div>
        <Link to="/vendor/products" style={{ background: '#25D366', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} /> Add New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ background: s.bg, color: s.color, padding: '0.75rem', borderRadius: '12px' }}>{s.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700', color: s.isUp ? '#10b981' : '#ef4444' }}>
                {s.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {s.trend}
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{s.label}</p>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{s.value}</h4>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Orders */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#64748b" /> Recent Orders
            </h4>
            <Link to="/vendor/orders" style={{ fontSize: '0.875rem', color: '#25D366', fontWeight: '700', textDecoration: 'none' }}>Manage All</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#f8fafc', borderRadius: '16px' }}>
              <ShoppingCart size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <p style={{ color: '#64748b' }}>No orders received yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Order #{order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>₦{order.total_amount.toLocaleString()}</div>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', background: '#fef3c7', color: '#b45309' }}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Health / Quick Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem' }}>Store Health</h4>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Profile Completion</span>
                  <span style={{ color: '#10b981', fontWeight: '700' }}>85%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
              <Link to="/vendor/settings" style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: '700', textDecoration: 'none' }}>Complete your profile →</Link>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: '24px', padding: '2rem', color: 'white' }}>
            <h4 style={{ fontWeight: '800', marginBottom: '0.75rem' }}>Pro Tip! 💡</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.5' }}>Verified vendors receive 3x more clicks than unverified ones. Submit your ID for verification today.</p>
            <button style={{ marginTop: '1.25rem', width: '100%', padding: '0.8rem', background: 'white', border: 'none', borderRadius: '10px', color: '#128C7E', fontWeight: '700', cursor: 'pointer' }}>Verify Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

