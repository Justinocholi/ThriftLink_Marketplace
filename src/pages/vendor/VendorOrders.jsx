import React, { useState, useEffect } from 'react';
import { vendorMe } from '../../services/api';

const STATUS_STYLES = {
  pending:   { background: '#fef3c7', color: '#b45309' },
  confirmed: { background: '#dbeafe', color: '#1d4ed8' },
  shipped:   { background: '#ede9fe', color: '#6d28d9' },
  delivered: { background: '#dcfce7', color: '#15803d' },
  cancelled: { background: '#fee2e2', color: '#dc2626' },
};

const NEXT_STATUSES = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    vendorMe.getOrders()
      .then(setOrders)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await vendorMe.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading orders...</div>;

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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                {['Order ID', 'Customer', 'Item', 'Amount', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                const next = NEXT_STATUSES[order.status] || [];
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem' }}>{order.id.slice(0, 8)}...</td>
                    <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '600' }}>{order.buyer_name || '—'}</td>
                    <td style={{ padding: '1rem', color: '#475569' }}>{order.item_name || '—'}</td>
                    <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '600' }}>₦{Number(order.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ ...style, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {next.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {next.map(s => (
                            <button
                              key={s}
                              disabled={updating === order.id}
                              onClick={() => handleUpdateStatus(order.id, s)}
                              style={{
                                padding: '0.35rem 0.7rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                ...(s === 'cancelled'
                                  ? { background: '#fee2e2', color: '#dc2626' }
                                  : { background: '#dcfce7', color: '#15803d' })
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
