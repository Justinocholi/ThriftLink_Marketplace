import React, { useState, useEffect } from 'react';
import { orders as ordersApi } from '../../services/api';
import { Loader2, Package, ExternalLink, MessageCircle } from 'lucide-react';

const STATUS_STYLE = {
  pending:   { background: '#fef3c7', color: '#b45309', label: 'Pending' },
  confirmed: { background: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
  shipped:   { background: '#ede9fe', color: '#6d28d9', label: 'Shipped' },
  delivered: { background: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled: { background: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ordersApi.getMyOrders();
        setOrders(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={40} color="#3b82f6" />
      <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading your orders...</p>
    </div>
  );

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', margin: 0 }}>
          Order History ({orders.length})
        </h4>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Package size={40} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>No orders yet</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start browsing vendors to find great deals!</p>
          <a href="/verified-vendors" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Browse Vendors →</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => {
            const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            return (
              <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Order Header */}
                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.25rem' }}>Order ID</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>#{order.id.slice(0, 8)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.25rem' }}>Date Placed</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.25rem' }}>Total Amount</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#3b82f6' }}>₦{order.total_amount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ ...st, padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
                    Vendor: <span style={{ fontWeight: '700', color: '#1f2937' }}>{order.vendor_name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={item.images?.[0] || 'https://via.placeholder.com/60'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.product_name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Quantity: {item.quantity} × ₦{item.price_at_purchase.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer Actions */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button 
                    onClick={() => window.open(`https://wa.me/${order.vendor_whatsapp}`, '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <MessageCircle size={16} />
                    Contact Vendor
                  </button>
                  <button 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: '#1f2937', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Track Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
