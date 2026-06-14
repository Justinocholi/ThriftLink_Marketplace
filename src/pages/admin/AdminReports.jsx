import React, { useEffect, useState, useCallback } from 'react';
import { admin as adminApi } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Flag, Trash2, AlertOctagon, CheckCircle2, XCircle, Search, Radio } from 'lucide-react';
import { useRealtime, useRealtimeEvent } from '../../context/RealtimeContext';

const STATUS_BADGE = {
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  investigating: { label: 'Investigating', bg: '#dbeafe', color: '#1e40af' },
  resolved: { label: 'Resolved', bg: '#dcfce7', color: '#15803d' },
  dismissed: { label: 'Dismissed', bg: '#f1f5f9', color: '#475569' },
};

const AdminReports = () => {
  const toast = useToast();
  const { connected } = useRealtime();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const res = await adminApi.reports(params);
      setReports(res.reports || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  // Realtime: new report arrives — prepend if it matches the current filter.
  useRealtimeEvent('report:new', useCallback((report) => {
    if (!report) return;
    if (filter !== 'all' && report.status !== filter) return;
    setReports((prev) => (prev.some((r) => r.id === report.id) ? prev : [report, ...prev]));
    toast.warning?.(`New report: ${report.reason}`);
  }, [filter, toast]));

  // Realtime: status updated by another admin — keep view in sync.
  useRealtimeEvent('report:updated', useCallback(({ id, status }) => {
    setReports((prev) => {
      if (filter !== 'all' && status !== filter) {
        return prev.filter((r) => r.id !== id);
      }
      return prev.map((r) => (r.id === id ? { ...r, status } : r));
    });
  }, [filter]));

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateReport(id, status);
      toast.success(`Report marked ${status}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeListing = async (productId) => {
    if (!window.confirm('Permanently remove this listing?')) return;
    try {
      await adminApi.removeListing(productId);
      toast.success('Listing removed');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = reports.filter((r) => {
    if (!query) return true;
    const hay = `${r.reason} ${r.reporter_name || ''} ${r.target_name || ''} ${r.target_type}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flag size={22} color="#ef4444" />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Reports & Moderation
          </h2>
          <span
            title={connected ? 'Live updates active' : 'Realtime disconnected — using last fetch'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.18rem 0.55rem',
              borderRadius: 999,
              fontSize: '0.72rem',
              fontWeight: 700,
              background: connected ? 'rgba(34,197,94,0.12)' : '#f1f5f9',
              color: connected ? '#15803d' : '#64748b',
            }}
          >
            <Radio size={12} className={connected ? '' : ''} />
            {connected ? 'LIVE' : 'Offline'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem 0.55rem 2.1rem',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: '0.88rem',
                outline: 'none',
                background: 'white',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all', 'pending', 'investigating', 'resolved', 'dismissed'].map((f) => (
          <button
            key={f}
            className={`tl-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '1rem', border: '1px solid #e2e8f0' }}>
              <Skeleton width="40%" height={16} />
              <div style={{ height: 8 }} />
              <Skeleton width="80%" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: '3rem 1.5rem',
            textAlign: 'center',
            border: '1px dashed #e2e8f0',
            color: '#64748b',
          }}
        >
          <Flag size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
          <p>No reports match this filter. The community is behaving!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => {
            const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
            return (
              <article
                key={r.id}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '1.1rem 1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        borderRadius: 999,
                      }}
                    >
                      {r.reason}
                    </span>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        borderRadius: 999,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                      {r.target_type}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {r.target_name || `(${r.target_type} #${r.target_id?.slice(0, 8)})`}
                  </div>
                  {r.details && (
                    <p style={{ marginTop: 4, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {r.details}
                    </p>
                  )}
                  <p style={{ marginTop: 8, fontSize: '0.78rem', color: '#94a3b8' }}>
                    Reported by <strong>{r.reporter_name || 'Anonymous'}</strong> ·{' '}
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                  {r.status !== 'investigating' && (
                    <button
                      onClick={() => updateStatus(r.id, 'investigating')}
                      className="tl-btn tl-btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      <AlertOctagon size={14} /> Investigate
                    </button>
                  )}
                  {r.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'resolved')}
                      className="tl-btn tl-btn-primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  )}
                  {r.status !== 'dismissed' && (
                    <button
                      onClick={() => updateStatus(r.id, 'dismissed')}
                      className="tl-btn tl-btn-ghost"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', border: '1px solid #e2e8f0' }}
                    >
                      <XCircle size={14} /> Dismiss
                    </button>
                  )}
                  {r.target_type === 'product' && (
                    <button
                      onClick={() => removeListing(r.target_id)}
                      className="tl-btn"
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.82rem',
                        background: '#fee2e2',
                        color: '#b91c1c',
                      }}
                    >
                      <Trash2 size={14} /> Remove Listing
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
