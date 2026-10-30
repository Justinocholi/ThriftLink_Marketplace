import React, { useState } from 'react';
import { vendorMe } from '../../services/api';
import { Eye, MessageSquare, TrendingUp, Star, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Circle, ArrowRight, Share2, Copy, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFetch, useFocusRefetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';
import VendorQuickPostBox from '../../components/VendorQuickPostBox';

const VendorDashboard = () => {
  const [copied, setCopied] = useState(false);
  const [hasSharedStore, setHasSharedStore] = useState(() => {
    try { return localStorage.getItem('tl_vendor_shared') === '1'; } catch { return false; }
  });
  const { data, error, loading, retry } = useFetch(async () => {
    const [a, o, p, pr, r] = await Promise.all([
      vendorMe.getAnalytics(),
      vendorMe.getOrders(),
      vendorMe.getProfile().catch(() => null),
      vendorMe.getProducts().catch(() => []),
      vendorMe.getReferral().catch(() => null)
    ]);
    return {
      analytics: a,
      recentOrders: (o || []).slice(0, 5),
      profile: p,
      products: Array.isArray(pr) ? pr : [],
      referral: r
    };
  }, []);
  useFocusRefetch(retry);
  const analytics = data?.analytics || null;
  const recentOrders = data?.recentOrders || [];
  const profile = data?.profile || null;
  const products = data?.products || [];
  const referral = data?.referral || null;

  const totals = analytics?.totals || {
    profile_views: 0,
    catalog_views: 0,
    followers: 0,
    whatsapp_clicks: 0,
    rating: 0,
    total_reviews: 0,
  };
  const catalogViewsCount = totals.catalog_views || products.reduce((sum, item) => sum + Number(item.views || 0), 0);

  // 6-Step Vendor Activation Checklist (Section 3 — Vendor Success)
  const profileDone = Boolean(profile && profile.business_name && profile.business_description);
  const kycDone = Boolean(profile && (profile.kyc_status === 'pending' || profile.kyc_status === 'approved' || profile.is_verified));
  const firstPostDone = products.length >= 1;
  const fiveCatalogDone = products.length >= 5;
  const sharedDone = Boolean(hasSharedStore || (referral?.totalVisits || 0) > 0);
  const enquiryDone = Boolean((totals.whatsapp_clicks || 0) > 0 || recentOrders.length > 0);
  const isFreePlan = !profile?.subscription_plan || profile.subscription_plan === 'free' || profile.subscription_plan === 'Free';

  const requiredSteps = [
    {
      key: 'profile',
      title: '1. Complete your business profile',
      desc: 'Add your shop name, bio, location, and WhatsApp contact so buyers know who you are.',
      done: profileDone,
      to: '/vendor/profile'
    },
    {
      key: 'kyc',
      title: '2. Complete verification (KYC)',
      desc: 'Submit your NIN and ID document to earn the Verified Vendor badge and appear in main recommendations.',
      done: kycDone,
      to: '/vendor/profile'
    },
    {
      key: 'catalog5',
      title: `3. Upload at least 5 catalog items (${Math.min(products.length, 5)}/5)`,
      desc: 'Vendors with 5+ catalog items receive higher recommendation visibility and buyer engagement.',
      done: fiveCatalogDone,
      to: '/vendor/products'
    },
    {
      key: 'first_post',
      title: '4. Publish your first catalog post',
      desc: 'Publish at least one active thrift item with clear photos and pricing.',
      done: firstPostDone,
      to: '/vendor/products'
    },
    {
      key: 'share',
      title: '5. Share your ThriftLink profile',
      desc: 'Share your personal storefront link on WhatsApp Status, Instagram, or TikTok to bring your audience.',
      done: sharedDone,
      actionLabel: 'Copy Link',
      onAction: () => {
        if (!profile?.id) return;
        const url = `${window.location.origin}/vendor/${profile.id}?ref=${referral?.referralCode || profile.id}`;
        navigator.clipboard.writeText(url).catch(() => {});
        try { localStorage.setItem('tl_vendor_shared', '1'); } catch {}
        setHasSharedStore(true);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    {
      key: 'enquiry',
      title: '6. Respond to your first customer enquiry',
      desc: 'Reply promptly when buyers reach out via in-app messages or WhatsApp enquiries.',
      done: enquiryDone,
      to: '/vendor/messages'
    }
  ];
  const optionalStep = {
    key: 'plan',
    title: 'Upgrade your plan (optional — Basic ₦3,000 / Pro ₦5,000)',
    desc: 'Unlock featured placement and deeper analytics.',
    done: !isFreePlan,
    to: '/vendor/subscription',
    soft: true
  };

  const requiredDoneCount = requiredSteps.filter(s => s.done).length;
  const allRequiredDone = requiredDoneCount === requiredSteps.length;
  const checklistSteps = [...requiredSteps, optionalStep];

  const stats = [
    { label: 'Profile Views',              sub: 'Storefront visits',           value: totals.profile_views,   icon: <Eye size={24} />,           tone: 'sky',      trend: 'Live', isUp: true },
    { label: 'Catalog Views',              sub: 'Product & catalog opens',     value: catalogViewsCount,      icon: <Package size={24} />,       tone: 'lavender', trend: 'Live', isUp: true },
    { label: 'Followers',                  sub: 'Customers following your shop', value: totals.followers || 0, icon: <Users size={24} />,         tone: 'sun',      trend: 'Live', isUp: true },
    { label: 'Contact Clicks (Enquiries)', sub: 'WhatsApp & direct enquiries', value: totals.whatsapp_clicks, icon: <MessageSquare size={24} />, tone: 'green',    trend: 'Intent', isUp: true },
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
        @media (max-width: 768px) {
          .vd-hero-banner { padding: 1.5rem !important; border-radius: 18px !important; margin-bottom: 1.5rem !important; }
          .vd-hero-title { font-size: 1.45rem !important; }
          .vd-hero-btn { width: 100% !important; justify-content: center !important; }
          .vd-main-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
          .vd-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; margin-bottom: 1.5rem !important; }
          .vd-card { padding: 1.25rem 1rem !important; border-radius: 16px !important; }
          .vd-stat-value { font-size: 1.4rem !important; }
        }
        @media (max-width: 440px) {
          .vd-stats-grid { grid-template-columns: 1fr !important; }
          .vd-share-box { flex-direction: column !important; align-items: stretch !important; gap: 0.5rem !important; }
          .vd-share-box button { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
      {/* 6-Step Vendor Activation Checklist (Section 3 — Vendor Success) */}
      {!loading && (
        <div className="tl-glass-card" style={{
          padding: '1.5rem',
          marginBottom: '1.75rem',
          border: '1.5px solid rgba(37,211,102,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Vendor Activation Checklist</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                Complete these 6 steps to maximize your visibility in ThriftLink recommendations.
              </p>
            </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {checklistSteps.map(step => (
              <div key={step.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                background: step.done ? '#f0fdf4' : '#fafafa'
              }}>
                {step.done
                  ? <CheckCircle2 size={22} color="#25D366" style={{ flexShrink: 0 }} />
                  : <Circle size={22} color="#cbd5e1" style={{ flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {step.title}
                    {step.soft && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.15rem 0.5rem', borderRadius: 999, textTransform: 'uppercase' }}>
                        Optional
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{step.desc}</div>
                </div>
                {!step.done && step.onAction && (
                  <button
                    type="button"
                    onClick={step.onAction}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: '#25D366',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <Copy size={13} /> {step.actionLabel || 'Action'}
                  </button>
                )}
                {!step.done && step.to && (
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

      {/* Page Header — glossy brand hero with CTA */}
      <div className="tl-glossy-hero vd-hero-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="vd-hero-title" style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.4rem' }}>Store Overview</h2>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '1rem', margin: 0 }}>Manage your thrift business and track your performance.</p>
        </div>
        <Link to="/vendor/products" className="tl-glass-pill vd-hero-btn" style={{ background: 'rgba(255,255,255,0.95)', color: '#1e3a8a', padding: '0.85rem 1.6rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.15)', position: 'relative', zIndex: 1, fontSize: '0.9rem' }}>
          <Package size={20} /> Add New Product
        </Link>
      </div>

      {/* Quick Post Box directly in dashboard */}
      <div style={{ marginBottom: '2.5rem' }}>
        <VendorQuickPostBox compact onPostCreated={() => retry()} />
      </div>

      {/* Stats Grid */}
      <div className="vd-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className={`tl-glass-stat brand-${s.tone}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div className={`tl-stat-icon ${s.tone}`}>{s.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '700', color: s.isUp ? '#10b981' : '#ef4444', background: s.isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: '999px' }}>
                <ArrowUpRight size={14} /> {s.trend}
              </div>
            </div>
            <p style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.1rem' }}>{s.label}</p>
            {s.sub && <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.35rem' }}>{s.sub}</p>}
            <h4 className="vd-stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="vd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Orders */}
        <div className="vd-card tl-glass-card" style={{ padding: '2rem' }}>
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

        {/* Store Health & Shareable Storefront */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Shareable Storefront & Growth Referrals */}
          {profile?.id && (
            <div className="vd-card tl-glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <Share2 size={20} color="#16b865" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                  Share Your Store
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 1rem' }}>
                Share your personal ThriftLink storefront on WhatsApp Status, Instagram, and TikTok to attract customers.
              </p>

              {/* Referral link bar */}
              <div className="vd-share-box" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.4rem 0.6rem', marginBottom: '1rem' }}>
                <span style={{ flex: 1, fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/vendor/${profile.id}?ref=${referral?.referralCode || profile.id}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/vendor/${profile.id}?ref=${referral?.referralCode || profile.id}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: copied ? '#16a34a' : '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Link Visits</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{referral?.totalVisits || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>New Customers</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16b865' }}>{referral?.registrations || 0}</div>
                </div>
              </div>
            </div>
          )}

          <div className="vd-card tl-glass-card" style={{ padding: '2rem' }}>
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

          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #16a34a 100%)', borderRadius: '24px', padding: '2rem', color: 'white', boxShadow: '0 12px 32px -8px rgba(30, 58, 138, 0.35)' }}>
            <h4 style={{ fontWeight: '800', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> Pro Tip
            </h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.95, lineHeight: '1.5' }}>Verified vendors receive 3x more clicks than unverified ones. Submit your ID for verification today.</p>
            <Link to="/vendor/profile" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.25rem', width: '100%', padding: '0.8rem', background: 'white', borderRadius: '10px', color: '#1e3a8a', fontWeight: '700', boxSizing: 'border-box' }}>Verify Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

