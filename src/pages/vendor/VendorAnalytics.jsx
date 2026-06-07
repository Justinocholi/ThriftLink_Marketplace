import React, { useState, useEffect } from 'react';
import { vendorMe } from '../../services/api';

const VendorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    vendorMe.getAnalytics()
      .then(setAnalytics)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading analytics...</div>;

  const totals = analytics?.totals || { profile_views: 0, whatsapp_clicks: 0, rating: 0, total_reviews: 0 };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        Detailed Analytics
      </h4>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', borderRadius: '16px', padding: '2rem', border: '1px solid #93c5fd' }}>
          <h4 style={{ color: '#1e40af', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Total Profile Views</h4>
          <p style={{ color: '#1e3a8a', fontSize: '2.5rem', fontWeight: '700' }}>{totals.profile_views.toLocaleString()}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', borderRadius: '16px', padding: '2rem', border: '1px solid #86efac' }}>
          <h4 style={{ color: '#166534', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Total WhatsApp Clicks</h4>
          <p style={{ color: '#14532d', fontSize: '2.5rem', fontWeight: '700' }}>{totals.whatsapp_clicks.toLocaleString()}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '16px', padding: '2rem', border: '1px solid #fcd34d' }}>
          <h4 style={{ color: '#92400e', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Rating</h4>
          <p style={{ color: '#78350f', fontSize: '2.5rem', fontWeight: '700' }}>
            {totals.rating > 0 ? totals.rating.toFixed(1) : '—'}
          </p>
          <p style={{ color: '#b45309', fontSize: '0.8rem', marginTop: '0.25rem' }}>{totals.total_reviews} review{totals.total_reviews !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Last 30 days breakdown */}
      {analytics?.last30days?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>Last 30 Days Activity</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {analytics.last30days.map(ev => (
              <div key={ev.event_type} style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e40af' }}>{ev.count}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                  {ev.event_type.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily views chart */}
      {analytics?.dailyViews?.length > 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem' }}>
          <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem' }}>Daily Profile Views (last 30 days)</h5>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
            {analytics.dailyViews.map(d => {
              const maxViews = Math.max(...analytics.dailyViews.map(x => x.views));
              const height = maxViews > 0 ? Math.max((d.views / maxViews) * 90, 4) : 4;
              return (
                <div key={d.date} title={`${d.date}: ${d.views} views`}
                  style={{ flex: 1, background: '#25D366', borderRadius: '2px 2px 0 0', height: `${height}px`, minWidth: '4px', cursor: 'pointer' }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>{analytics.dailyViews[0]?.date}</span>
            <span>{analytics.dailyViews[analytics.dailyViews.length - 1]?.date}</span>
          </div>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          No activity data for the last 30 days yet. Share your profile to get started!
        </div>
      )}
    </div>
  );
};

export default VendorAnalytics;
