import React, { useState, useEffect } from 'react';
import { admin } from '../../services/api';

const STATUS_STYLE = {
  approved:  { background: '#dcfce7', color: '#15803d' },
  pending:   { background: '#fef3c7', color: '#b45309' },
  rejected:  { background: '#fee2e2', color: '#dc2626' },
  suspended: { background: '#f1f5f9', color: '#64748b' },
};

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [toast, setToast] = useState('');
  const [rankDrafts, setRankDrafts] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const load = () => {
    setLoading(true);
    admin.vendors()
      .then(data => setVendors(data.vendors || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id, status) => {
    setActing(id);
    try {
      await admin.verifyVendor(id, status);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, verification_status: status, is_verified: status === 'approved' ? 1 : 0 } : v));
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleFeature = async (vendor, is_featured, featured_rank) => {
    setActing(vendor.id);
    setError('');
    try {
      const res = await admin.featureVendor(vendor.id, is_featured, featured_rank);
      setVendors(prev => prev.map(v => v.id === vendor.id
        ? { ...v, is_featured: res.is_featured, featured_rank: res.featured_rank }
        : v));
      showToast(is_featured ? `Featured ${vendor.shop_name}` : `Removed ${vendor.shop_name} from featured`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  const kycSummary = (v) => {
    const hasNin = Boolean(v.nin);
    const hasDoc = Boolean(v.id_document_url);
    if (!hasNin && !hasDoc) return { key: 'not_started', label: 'Not started', icon: '🚫', bg: '#f1f5f9', fg: '#64748b' };
    if (v.verification_status === 'approved') return { key: 'approved', label: 'Approved', icon: '✅', bg: '#dcfce7', fg: '#15803d' };
    if (v.verification_status === 'rejected') return { key: 'rejected', label: 'Rejected', icon: '❌', bg: '#fee2e2', fg: '#dc2626' };
    return { key: 'pending', label: 'Pending review', icon: '⏳', bg: '#fef3c7', fg: '#b45309' };
  };
  const maskNin = (n) => (n ? `${'*'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : '—');

  let filtered = filter === 'all' ? vendors : vendors.filter(v => kycSummary(v).key === filter);
  if (featuredOnly) filtered = filtered.filter(v => v.is_featured);

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 'bold' }}>Vendor Management</h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Approve, reject, or manage vendor verifications</p>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '0.7rem 1.2rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>All Vendors</h2>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFeaturedOnly(v => !v)}
              style={{
                padding: '0.55rem 0.95rem',
                border: '1px solid ' + (featuredOnly ? '#facc15' : '#e2e8f0'),
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: featuredOnly ? '#fef9c3' : 'white',
                color: featuredOnly ? '#a16207' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {featuredOnly ? '★ Featured only' : '☆ Show featured only'}
            </button>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>KYC:</span>
              {[
                { v: 'all', label: 'All' },
                { v: 'pending', label: '⏳ Pending review' },
                { v: 'approved', label: '✅ Approved' },
                { v: 'rejected', label: '❌ Rejected' },
                { v: 'not_started', label: '🚫 Not started' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setFilter(opt.v)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    border: '1px solid ' + (filter === opt.v ? '#0f172a' : '#e2e8f0'),
                    borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                    background: filter === opt.v ? '#0f172a' : 'white',
                    color: filter === opt.v ? 'white' : '#475569', cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading vendors...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Shop Name', 'Category', 'State', 'KYC', 'NIN', 'ID Doc', 'Status', 'Plan', 'Featured', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(vendor => {
                  const st = STATUS_STYLE[vendor.verification_status] || STATUS_STYLE.pending;
                  const ks = kycSummary(vendor);
                  return (
                    <tr key={vendor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '600' }}>{vendor.shop_name}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{vendor.category || '—'}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{vendor.state || '—'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: ks.bg, color: ks.fg, padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                          <span>{ks.icon}</span> {ks.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem' }}>{maskNin(vendor.nin)}</td>
                      <td style={{ padding: '1rem' }}>
                        {vendor.id_document_url ? (
                          <a href={vendor.id_document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}>View ID →</a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ ...st, padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-block' }}>
                          {vendor.verification_status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{vendor.subscription_plan || 'free'}</td>
                      <td style={{ padding: '1rem' }}>
                        {vendor.is_verified ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              disabled={acting === vendor.id}
                              onClick={() => handleFeature(vendor, vendor.is_featured ? 0 : 1, vendor.featured_rank || 1)}
                              title={vendor.is_featured ? 'Remove from featured' : 'Mark as featured/top vendor'}
                              style={{
                                padding: '0.4rem 0.7rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                background: vendor.is_featured ? '#fef9c3' : '#f1f5f9',
                                color: vendor.is_featured ? '#a16207' : '#64748b',
                                fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap',
                              }}>
                              {vendor.is_featured ? '★ Featured' : '☆ Feature'}
                            </button>
                            {vendor.is_featured && (
                              <>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Rank"
                                  title="Rank (1 = top)"
                                  value={rankDrafts[vendor.id] ?? vendor.featured_rank ?? ''}
                                  onChange={(e) => setRankDrafts(d => ({ ...d, [vendor.id]: e.target.value }))}
                                  style={{ width: '60px', padding: '0.35rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem' }}
                                />
                                <button
                                  disabled={acting === vendor.id}
                                  onClick={() => {
                                    const raw = rankDrafts[vendor.id];
                                    const r = raw === '' || raw == null ? null : parseInt(raw, 10);
                                    handleFeature(vendor, 1, r || null);
                                  }}
                                  style={{
                                    padding: '0.4rem 0.7rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '0.78rem',
                                  }}
                                >Save</button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            disabled
                            title="Only verified vendors can be featured. Approve the vendor first."
                            style={{
                              padding: '0.4rem 0.7rem', border: '1px dashed #e2e8f0', borderRadius: '6px',
                              background: 'white', color: '#cbd5e1', fontWeight: 600, fontSize: '0.78rem',
                              cursor: 'not-allowed',
                            }}
                          >
                            ☆ Verify first
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {vendor.verification_status !== 'approved' && (
                            <button disabled={acting === vendor.id} onClick={() => handleVerify(vendor.id, 'approved')}
                              style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#dcfce7', color: '#15803d', fontWeight: '600', fontSize: '0.8rem' }}>
                              Approve
                            </button>
                          )}
                          {vendor.verification_status !== 'rejected' && (
                            <button disabled={acting === vendor.id} onClick={() => handleVerify(vendor.id, 'rejected')}
                              style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: '600', fontSize: '0.8rem' }}>
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No vendors found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendors;
