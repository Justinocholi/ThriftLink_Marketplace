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
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={28} color="#059669" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>Order recorded</h1>
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
              <div key={g.vendor_id || g.vendor_name} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #e5e7eb' }}>
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
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      background: '#25D366', color: 'white', padding: '0.75rem 1.25rem',
                      borderRadius: 999, fontWeight: 700, textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
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
          <Link to="/user/orders" style={{ padding: '0.75rem 1.25rem', background: '#1f2937', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            View my orders
          </Link>
          <Link to="/verified-vendors" style={{ padding: '0.75rem 1.25rem', background: 'white', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            Keep shopping
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
