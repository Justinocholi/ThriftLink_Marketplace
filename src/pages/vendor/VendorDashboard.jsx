import React from 'react';
import { vendorMe } from '../../services/api';
import { Eye, MessageSquare, TrendingUp, Star, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFetch, useFocusRefetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const VendorDashboard = () => {
  const { data, error, loading, retry } = useFetch(async () => {
    const [a, o, p, pr] = await Promise.all([
      vendorMe.getAnalytics(),
      vendorMe.getOrders(),
      vendorMe.getProfile().catch(() => null),
      vendorMe.getProducts().catch(() => [])
    ]);
    return {
      analytics: a,
      recentOrders: (o || []).slice(0, 5),
      profile: p,
      products: Array.isArray(pr) ? pr : []
    };
  }, []);
  useFocusRefetch(retry);
  const analytics = data?.analytics || null;
  const recentOrders = data?.recentOrders || [];
  const profile = data?.profile || null;
  const products = data?.products || [];

  // Onboarding checklist
  const profileDone = Boolean(profile && profile.business_name && profile.business_description);
  const kycDone = profile && (profile.kyc_status === 'pending' || profile.kyc_status === 'approved');
  const productDone = products.length > 0;
  const isFreePlan = !profile?.subscription_plan || profile.subscription_plan === 'free' || profile.subscription_plan === 'Free';

  const requiredSteps = [
    {
      key: 'profile',
      title: 'Complete your shop profile',
      desc: 'Add your business name and description so buyers know who you are.',
      done: profileDone,
      to: '/vendor/profile'
    },
    {
      key: 'kyc',
      title: 'Submit KYC verification',
      desc: 'Upload your NIN and a valid ID document to get verified.',
      done: Boolean(kycDone),
      to: '/vendor/profile'
    },
    {
      key: 'product',
      title: 'Add your first product',
      desc: 'List at least one item so buyers can start discovering you.',
      done: productDone,
      to: '/vendor/products'
    }
  ];
  const optionalStep = {
    key: 'plan',
    title: 'Upgrade your plan (optional)',
    desc: 'Premium plans get more visibility and unlock advanced tools.',
    done: !isFreePlan,
    to: '/vendor/subscription',
    soft: true
  };

  const requiredDoneCount = requiredSteps.filter(s => s.done).length;
  const allRequiredDone = requiredDoneCount === requiredSteps.length;
  const checklistSteps = [...requiredSteps, optionalStep];

  const totals = analytics?.totals || { profile_views: 0, whatsapp_clicks: 0, rating: 0, total_reviews: 0 };
  const conversionRate = totals.profile_views > 0
    ? ((totals.whatsapp_clicks / totals.profile_views) * 100).toFixed(1) + '%'
    : '0%';

  const stats = [
    { label: 'Profile Views',   value: totals.profile_views,   icon: <Eye size={24} />,           tone: 'sky',      trend: '+12%', isUp: true },
    { label: 'WhatsApp Clicks', value: totals.whatsapp_clicks, icon: <MessageSquare size={24} />, tone: 'green',    trend: '+5%',  isUp: true },
    { label: 'Conversion',      value: conversionRate,         icon: <TrendingUp size={24} />,    tone: 'sun',      trend: '-2%',  isUp: false },
    { label: 'Store Rating',    value: totals.rating > 0 ? totals.rating.toFixed(1) : 'New', icon: <Star size={24} />, tone: 'lavender', trend: '0%', isUp: true },
  ];

  if (error) return <ErrorState error={error} onRetry={retry} title="Couldn't load your dashboard" />;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .vd-main-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .vd-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; margin-bottom: 1.25rem !important; }
          .vd-card { padding: 1.25rem !important; border-radius: 16px !important; }
          .vd-stat-value { font-size: 1.4rem !important; }
        }
        @media (max-width: 400px) {
          .vd-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Onboarding checklist — shown until all required steps done */}
      {!loading && !allRequiredDone && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #25D366',
          boxShadow: '0 8px 24px -12px rgba(37,211,102,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Get your shop ready</h3>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#25D366' }}>
              {requiredDoneCount} of {requiredSteps.length} steps complete
            </span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{
              width: `${(requiredDoneCount / requiredSteps.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #25D366, #3b82f6)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {checklistSteps.map(step => (
              <div key={step.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                background: step.done ? '#f0fdf4' : '#fafafa'
              }}>
                {step.done
                  ? <CheckCircle2 size={22} color="#25D366" style={{ flexShrink: 0 }} />
                  : <Circle size={22} color="#cbd5e1" style={{ flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {step.title}
                    {step.soft && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.15rem 0.5rem', borderRadius: 999, textTransform: 'uppercase' }}>
                        Optional
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{step.desc}</div>
                </div>
                {!step.done && (
                  <Link to={step.to} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#25D366',
                    color: 'white',
                    padding: '0.5rem 0.9rem',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}>
                    Go <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Header — gradient brand banner with CTA */}
      <div className="tl-dash-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Store Overview</h2>
          <p>Manage your thrift business and track your performance.</p>
        </div>
        <Link to="/vendor/products" style={{ background: 'rgba(255,255,255,0.95)', color: '#0e9a52', padding: '0.85rem 1.5rem', borderRadius: '999px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.2)', position: 'relative', zIndex: 1 }}>
          <Package size={20} /> Add New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="vd-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className={`tl-stat-tile brand-${s.tone}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div className={`tl-stat-icon ${s.tone}`}>{s.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700', color: s.isUp ? '#10b981' : '#ef4444', background: s.isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: '999px' }}>
                {s.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {s.trend}
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{s.label}</p>
            <h4 className="vd-stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="vd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Orders */}
        <div className="vd-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
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
          <div className="vd-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
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
            <h4 style={{ fontWeight: '800', marginBottom: '0.75rem' }}>Pro Tip!</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.5' }}>Verified vendors receive 3x more clicks than unverified ones. Submit your ID for verification today.</p>
            <button style={{ marginTop: '1.25rem', width: '100%', padding: '0.8rem', background: 'white', border: 'none', borderRadius: '10px', color: '#128C7E', fontWeight: '700', cursor: 'pointer' }}>Verify Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

