import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CheckCircle2, MessageCircle, ExternalLink } from 'lucide-react';
import { buildVendorOrderMessage } from '../../utils/whatsappOrder';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('thriftlink:lastOrder');
      if (!raw) {
        navigate('/user/orders');
        return;
      }
      setPayload(JSON.parse(raw));
    } catch {
      navigate('/user/orders');
    }
  }, [navigate]);

  if (!payload) return null;

  const { groups = [], buyerName, deliveryAddress, deliveryNotes } = payload;

  return (
    <div style={{ background: 'var(--tl-bg)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
        <div className="tl-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={28} color="#059669" />
            <h1 style={{ fontSize: 'var(--tl-text-h2)', fontWeight: 800, color: 'var(--tl-ink)' }}>Order recorded</h1>
          </div>
          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
            Your order intent (#{String(orderId).slice(0, 8)}) is saved. Now message each vendor on WhatsApp to confirm payment and delivery.
            They've also received a notification in their dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groups.map((g) => {
            const url = buildVendorOrderMessage({
              vendorName: g.vendor_name,
              vendorWhatsapp: g.vendor_whatsapp,
              items: g.items,
              buyerName: buyerName || user?.name,
              deliveryAddress,
              deliveryNotes,
            });
            return (
              <div key={g.vendor_id || g.vendor_name} className="tl-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.1rem' }}>{g.vendor_name}</div>
                  <div style={{ fontWeight: 700, color: '#065f46' }}>₦{g.subtotal.toLocaleString()}</div>
                </div>
                <ul style={{ margin: '0 0 1rem 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#374151', fontSize: '0.9rem' }}>
                  {g.items.map((it, i) => (
                    <li key={it.id}>
                      {i + 1}. {it.name} × {it.quantity}
                    </li>
                  ))}
                </ul>

                {url ? (
                  <a
                    className="tl-btn-press"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      background: 'var(--tl-green)', color: 'white', padding: '0.75rem 1.25rem',
                      borderRadius: 'var(--tl-radius-pill)', fontWeight: 700, textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                      transition: 'transform var(--tl-fast) var(--tl-ease)',
                    }}
                  >
                    <MessageCircle size={18} />
                    Message {g.vendor_name} on WhatsApp
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#b45309', background: '#fef3c7', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #fde68a' }}>
                      WhatsApp number not available for this vendor.
                    </div>
                    {g.vendor_id && (
                      <Link to={`/vendor/${g.vendor_id}`} style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
                        View vendor profile →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/user/orders" className="tl-btn-press" style={{ padding: '0.75rem 1.25rem', background: 'var(--tl-ink)', color: 'white', borderRadius: 'var(--tl-radius-pill)', textDecoration: 'none', fontWeight: 600, transition: 'transform var(--tl-fast) var(--tl-ease)' }}>
            View my orders
          </Link>
          <Link to="/verified-vendors" className="tl-btn-press" style={{ padding: '0.75rem 1.25rem', background: 'var(--tl-surface)', color: 'var(--tl-ink)', border: 'none', boxShadow: 'var(--tl-shadow-1)', borderRadius: 'var(--tl-radius-pill)', textDecoration: 'none', fontWeight: 600, transition: 'transform var(--tl-fast) var(--tl-ease)' }}>
            Keep shopping
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
