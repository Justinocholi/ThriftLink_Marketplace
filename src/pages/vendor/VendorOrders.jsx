import React, { useState } from 'react';
import { vendorMe } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const STATUS_STYLES = {
  pending:   { background: '#e5e7eb', color: '#374151' },
  confirmed: { background: '#dbeafe', color: '#1d4ed8' },
  shipped:   { background: '#e0e7ff', color: '#4338ca' },
  delivered: { background: '#dcfce7', color: '#15803d' },
  cancelled: { background: '#fee2e2', color: '#dc2626' },
};

const NEXT_STATUSES = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABELS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

const StepIndicator = ({ status }) => {
  if (status === 'cancelled') {
    return <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>Cancelled</div>;
  }
  const idx = STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      {STEPS.map((s, i) => {
        const reached = i <= idx;
        return (
          <React.Fragment key={s}>
            <div title={STEP_LABELS[s]} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: reached ? '#15803d' : '#e5e7eb',
            }} />
            {i < STEPS.length - 1 && (
              <div style={{ width: '12px', height: '2px', background: i < idx ? '#15803d' : '#e5e7eb' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const VendorOrders = () => {
  const { data, loading, error: fetchError, retry, setData } = useFetch(() => vendorMe.getOrders(), []);
  const orders = data || [];
  const setOrders = setData;
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [noteByOrder, setNoteByOrder] = useState({});
  const [selectedNext, setSelectedNext] = useState({});
  const toast = useToast();

  const handleUpdateStatus = async (orderId) => {
    const status = selectedNext[orderId];
    if (!status) return;
    const note = noteByOrder[orderId] || '';

    const prev = orders;
    // Optimistic update
    setOrders((curr) => (curr || []).map(o => o.id === orderId ? { ...o, status } : o));
    setUpdating(orderId);
    try {
      await vendorMe.updateOrderStatus(orderId, status, note);
      toast.success?.(`Order #${orderId.slice(0, 8)} updated to ${status}`);
      setNoteByOrder((n) => ({ ...n, [orderId]: '' }));
      setSelectedNext((s) => ({ ...s, [orderId]: '' }));
    } catch (err) {
      setOrders(prev); // rollback
      toast.error?.(err.message || 'Failed to update status');
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading orders...</div>;
  if (fetchError) return <ErrorState error={fetchError} onRetry={retry} />;

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        Orders Received ({orders.length})
      </h4>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            const next = NEXT_STATUSES[order.status] || [];
            const isUpdating = updating === order.id;
            return (
              <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Order #{order.id.slice(0, 8)}</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
                      {order.buyer_name || '—'} · ₦{Number(order.total_amount || order.amount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span style={{ ...style, padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {order.status}
                  </span>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <StepIndicator status={order.status} />
                </div>

                {next.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Update status:</label>
                      <select
                        value={selectedNext[order.id] || ''}
                        onChange={(e) => setSelectedNext((s) => ({ ...s, [order.id]: e.target.value }))}
                        disabled={isUpdating}
                        style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      >
                        <option value="">Choose…</option>
                        {next.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => handleUpdateStatus(order.id)}
                        disabled={isUpdating || !selectedNext[order.id]}
                        style={{
                          padding: '0.4rem 0.9rem', border: 'none', borderRadius: '6px',
                          cursor: isUpdating || !selectedNext[order.id] ? 'not-allowed' : 'pointer',
                          background: '#15803d', color: 'white', fontWeight: 600, fontSize: '0.85rem',
                          opacity: isUpdating || !selectedNext[order.id] ? 0.6 : 1,
                        }}
                      >
                        {isUpdating ? 'Updating…' : 'Update'}
                      </button>
                    </div>
                    <textarea
                      placeholder="Optional note for the buyer (e.g. tracking number, expected delivery)"
                      value={noteByOrder[order.id] || ''}
                      onChange={(e) => setNoteByOrder((n) => ({ ...n, [order.id]: e.target.value }))}
                      disabled={isUpdating}
                      rows={2}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                {order.status_history && order.status_history.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                      History
                    </div>
                    {order.status_history.map((h) => (
                      <div key={h.id} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem' }}>
                        <strong>{h.status}</strong>
                        {h.note && <> · {h.note}</>}
                        <span style={{ color: '#94a3b8' }}> · {new Date(h.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
