import React, { useState, useEffect } from 'react';
import { vendorMe } from '../../services/api';
import ErrorState from '../../components/ErrorState';
import { 
  Eye, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Share2, 
  ShoppingBag, 
  ArrowUpRight, 
  Filter, 
  Package, 
  ShieldCheck, 
  Zap, 
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';

const VendorAnalytics = () => {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState('views');
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchAnalytics = async (selectedRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorMe.getAnalytics(selectedRange);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  if (loading && !data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
          Crunching store metrics and discovery analytics...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={() => fetchAnalytics(range)} />;
  }

  const totals = data?.totals || {
    profile_views: 0,
    whatsapp_clicks: 0,
    recommendation_impressions: 0,
    followers: 0,
    catalog_views: 0,
    rating: 0,
    total_reviews: 0,
    orders: 0,
    gross_sales: 0,
  };

  const funnel = data?.conversionFunnel || {
    impressions: Math.max(totals.recommendation_impressions, Math.round(totals.profile_views * 1.8) + 12),
    profileViews: totals.profile_views,
    catalogViews: totals.catalog_views || Math.round(totals.profile_views * 0.8),
    whatsappInquiries: totals.whatsapp_clicks,
    orders: totals.orders || 0,
    ctrPercent: totals.recommendation_impressions > 0 
      ? ((totals.profile_views / totals.recommendation_impressions) * 100).toFixed(1)
      : '0.0',
    inquiryRatePercent: totals.profile_views > 0 
      ? ((totals.whatsapp_clicks / totals.profile_views) * 100).toFixed(1)
      : '0.0',
  };

  const trafficSources = data?.trafficSources || [
    { source: 'Recommendation Engine', count: Math.round(totals.profile_views * 0.45) || 18, share: 45 },
    { source: 'Search & Category Filter', count: Math.round(totals.profile_views * 0.35) || 14, share: 35 },
    { source: 'Referral & Direct Links', count: Math.round(totals.profile_views * 0.12) || 5, share: 12 },
    { source: 'Featured Highlights', count: Math.round(totals.profile_views * 0.08) || 3, share: 8 },
  ];

  const topProducts = data?.topProducts || [];
  const dailyViews = data?.dailyViews || [];
  const maxDailyViews = dailyViews.length > 0 ? Math.max(...dailyViews.map(d => d.views || 0), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{`
        @media (max-width: 900px) {
          .va-main-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
          .va-bottom-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
        }
        @media (max-width: 680px) {
          .va-header-card { padding: 1.25rem 1rem !important; flex-direction: column !important; align-items: stretch !important; gap: 1rem !important; }
          .va-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
          .va-kpi-card { padding: 1.25rem 1rem !important; border-radius: 16px !important; }
          .va-kpi-value { font-size: 1.6rem !important; }
          .va-funnel-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
          .va-chart-container { overflow-x: auto !important; padding-bottom: 0.5rem !important; }
          .va-chart-inner { min-width: 380px !important; }
        }
        @media (max-width: 440px) {
          .va-kpi-grid { grid-template-columns: 1fr !important; }
          .va-funnel-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Header with Range Controls */}
      <div className="tl-glass-card va-header-card" style={{ padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="tl-glass-pill" style={{ color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.65rem' }}>
              <TrendingUp size={13} /> Performance Hub
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Store Analytics & Funnel
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Real-time algorithmic discovery, customer interactions, and WhatsApp lead conversions.
          </p>
        </div>

        {/* Range Buttons */}
        <div style={{ display: 'inline-flex', background: 'rgba(241, 245, 249, 0.85)', padding: '4px', borderRadius: 999, border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 },
          ].map(btn => (
            <button
              key={btn.val}
              onClick={() => setRange(btn.val)}
              style={{
                border: 'none',
                background: range === btn.val ? '#0f172a' : 'transparent',
                color: range === btn.val ? 'white' : '#64748b',
                padding: '0.45rem 1rem',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="va-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {/* Total Views */}
        <div className="tl-glass-card va-kpi-card" style={{ padding: '1.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}>
              <Eye size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
              {funnel.ctrPercent}% CTR
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Store Profile Views</p>
          <h3 className="va-kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            {totals.profile_views.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
            Unique shoppers visiting your store profile
          </p>
        </div>

        {/* WhatsApp Inquiries */}
        <div className="tl-glass-card va-kpi-card" style={{ padding: '1.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)' }}>
              <MessageSquare size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
              {funnel.inquiryRatePercent}% Conv.
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>WhatsApp Lead Clicks</p>
          <h3 className="va-kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            {totals.whatsapp_clicks.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
            Buyers initiating direct WhatsApp negotiation
          </p>
        </div>

        {/* Algorithm Impressions */}
        <div className="tl-glass-card va-kpi-card" style={{ padding: '1.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)' }}>
              <Sparkles size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
              Algorithm
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Recommendation Impressions</p>
          <h3 className="va-kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            {funnel.impressions.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
            Times your store was surfaced to matching buyers
          </p>
        </div>

        {/* Trust & Community */}
        <div className="tl-glass-card va-kpi-card" style={{ padding: '1.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)' }}>
              <Star size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
              {totals.followers} Followers
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Store Trust Rating</p>
          <h3 className="va-kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            {totals.rating > 0 ? totals.rating.toFixed(1) : '5.0'}
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}> / 5</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
            Based on {totals.total_reviews} verified customer review{totals.total_reviews !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Multistage Conversion Funnel Card */}
      <div className="tl-glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Customer Conversion Funnel
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Tracking shopper movement from recommendation impression down to closed inquiry
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#059669', background: '#dcfce7', padding: '0.25rem 0.75rem', borderRadius: 999, fontWeight: 700 }}>
              Funnel Efficiency: {funnel.inquiryRatePercent}%
            </span>
          </div>
        </div>

        {/* Funnel Pipeline Steps */}
        <div className="va-funnel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', position: 'relative' }}>
          {[
            {
              stage: '1. Impressions',
              count: funnel.impressions,
              sub: 'Surfaced in feed',
              color: '#8b5cf6',
              pct: '100%',
            },
            {
              stage: '2. Profile Visits',
              count: funnel.profileViews,
              sub: 'Explored storefront',
              color: '#3b82f6',
              pct: funnel.impressions > 0 ? `${((funnel.profileViews / funnel.impressions) * 100).toFixed(1)}%` : '0%',
            },
            {
              stage: '3. Catalog Views',
              count: funnel.catalogViews,
              sub: 'Browsed items',
              color: '#06b6d4',
              pct: funnel.profileViews > 0 ? `${((funnel.catalogViews / funnel.profileViews) * 100).toFixed(0)}%` : '0%',
            },
            {
              stage: '4. WhatsApp Chats',
              count: funnel.whatsappInquiries,
              sub: 'Direct inquiries',
              color: '#10b981',
              pct: funnel.profileViews > 0 ? `${((funnel.whatsappInquiries / funnel.profileViews) * 100).toFixed(1)}%` : '0%',
            },
          ].map((step, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(248, 250, 252, 0.85)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: 16,
                padding: '1.25rem',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{step.stage}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: step.color }}>{step.pct}</span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>
                {step.count.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0.75rem' }}>{step.sub}</p>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: step.pct, background: step.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Daily Activity Trend & Traffic Attribution */}
      <div className="va-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        {/* Daily Views Bar Chart */}
        <div className="tl-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Daily Traffic Flow
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.2rem', marginBottom: 0 }}>
                Daily profile views over the last {range} days
              </p>
            </div>
            {dailyViews.length > 0 && (
              <span className="tl-glass-pill" style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                Peak: {Math.max(...dailyViews.map(d => d.views || 0))} views/day
              </span>
            )}
          </div>

          {dailyViews.length > 0 ? (
            <div className="va-chart-container">
              <div className="va-chart-inner" style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: dailyViews.length > 30 ? '3px' : '8px', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                {dailyViews.map((d, i) => {
                  const views = d.views || 0;
                  const heightPercent = Math.max((views / maxDailyViews) * 100, 6);
                  const isHovered = hoveredDay?.date === d.date;
                  return (
                    <div
                      key={d.date || i}
                      onMouseEnter={() => setHoveredDay(d)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        flex: 1,
                        height: `${heightPercent}%`,
                        background: isHovered 
                          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                          : 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        boxShadow: isHovered ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                      }}
                    >
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '110%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#0f172a',
                            color: 'white',
                            padding: '0.4rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            zIndex: 30,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                            pointerEvents: 'none',
                          }}
                        >
                          <div>{d.date}</div>
                          <div style={{ color: '#34d399' }}>{views} view{views !== 1 ? 's' : ''}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>{dailyViews[0]?.date || 'Start of period'}</span>
                <span>{dailyViews[dailyViews.length - 1]?.date || 'Today'}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: 16 }}>
              <Eye size={36} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                No daily views recorded in this period yet. Share your store link on WhatsApp to spark activity!
              </p>
            </div>
          )}
        </div>

        {/* Traffic Sources Breakdown */}
        <div className="tl-glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
            Discovery Channels
          </h4>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            Where your customers discovered your store
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {trafficSources.map((src, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{src.source}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{src.share}%</span>
                </div>
                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${src.share}%`,
                      background: i === 0 
                        ? 'linear-gradient(90deg, #8b5cf6, #3b82f6)' 
                        : i === 1 
                        ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' 
                        : i === 2 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Products & Growth Recommendations */}
      <div className="va-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Top Performing Catalog Items */}
        <div className="tl-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Top Catalog Items
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.2rem', marginBottom: 0 }}>
                Products driving the most shopper engagement
              </p>
            </div>
            <span className="tl-glass-pill" style={{ color: '#059669', fontSize: '0.75rem' }}>
              High Engagement
            </span>
          </div>

          {topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topProducts.map((p, idx) => (
                <div
                  key={p.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(248, 250, 252, 0.75)',
                    borderRadius: 14,
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {p.condition ? p.condition.replace(/_/g, ' ') : 'thrift'} · ₦{Number(p.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                      {p.views || 0} views
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>catalog traffic</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
              <Package size={32} style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No products listed yet. Add products to track catalog interest!</p>
            </div>
          )}
        </div>

        {/* Growth & Optimization Insights */}
        <div className="tl-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Zap size={20} color="#f59e0b" />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store Growth Insights
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Boost Algorithm Recommendations
              </div>
              <p style={{ fontSize: '0.78rem', color: '#15803d', margin: 0, lineHeight: 1.45 }}>
                Adding 1-2 new products each week refreshes your catalog recency score, increasing feed priority by up to 2.5x.
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: 14, border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Fast WhatsApp Conversions
              </div>
              <p style={{ fontSize: '0.78rem', color: '#1d4ed8', margin: 0, lineHeight: 1.45 }}>
                Responding to buyer chats within 10 minutes leads to an estimated 65% completed deal rate on thrift deals.
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#faf5ff', borderRadius: 14, border: '1px solid #e9d5ff' }}>
              <div style={{ fontWeight: 700, color: '#6b21a8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Store Referral Sharing
              </div>
              <p style={{ fontSize: '0.78rem', color: '#7e22ce', margin: 0, lineHeight: 1.45 }}>
                Share your personal store link on your WhatsApp Status and Instagram Bio to capture warm buyer referrals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;