import React, { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Users, Store, Package, MessageSquare, ShoppingBag, ShieldCheck, ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    admin.stats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const s = stats || { totalVendors: 0, pendingVerifications: 0, totalUsers: 0, totalProducts: 0, totalReviews: 0, totalOrders: 0 };

  const cards = [
    { label: 'Total Users', value: s.totalUsers, icon: <Users size={20} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Vendors', value: s.totalVendors, icon: <Store size={20} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Total Products', value: s.totalProducts, icon: <Package size={20} />, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Orders', value: s.totalOrders, icon: <ShoppingBag size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Total Reviews', value: s.totalReviews, icon: <MessageSquare size={20} />, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Pending Verif.', value: s.pendingVerifications, icon: <ShieldCheck size={20} />, color: '#ef4444', bg: '#fef2f2' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Platform Overview</h2>
        <p style={{ color: '#64748b' }}>High-level performance metrics and system-wide statistics.</p>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>{error}</div>}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: card.bg, color: card.color, padding: '0.75rem', borderRadius: '12px' }}>{card.icon}</div>
              <TrendingUp size={16} color="#cbd5e1" />
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{card.label}</p>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{card.value.toLocaleString()}</h4>
          </div>
        ))}
      </div>

      {/* Quick Access Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="#f59e0b" /> Critical Tasks
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#fffbeb', borderRadius: '16px', border: '1px solid #fef3c7' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.95rem' }}>{s.pendingVerifications} Pending Verifications</div>
                <div style={{ fontSize: '0.8rem', color: '#b45309' }}>New vendors waiting for approval.</div>
              </div>
              <Link to="/admin/vendors" style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>Review Now</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#166534', fontSize: '0.95rem' }}>System Health: Optimal</div>
                <div style={{ fontSize: '0.8rem', color: '#15803d' }}>All background jobs running smoothly.</div>
              </div>
              <Link to="/admin" style={{ color: '#166534', fontSize: '0.8rem', fontWeight: '700' }}><ArrowUpRight size={18} /></Link>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '24px', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '1rem' }}>Admin Control Center</h4>
          <p style={{ opacity: 0.8, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>Use the sidebar or profile menu to navigate between platform management, user moderation, and system settings.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/admin/users" style={{ flex: 1, padding: '0.8rem', background: 'white', color: '#0f172a', borderRadius: '12px', textAlign: 'center', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>User Mgmt</Link>
            <Link to="/admin/vendors" style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', textAlign: 'center', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>Vendor Mgmt</Link>
          </div>
        </div>
      </div>
    </div>
  );  
};

export default AdminOverview;
