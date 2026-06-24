import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowLeft, Truck, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { groupCartByVendor } from '../../utils/whatsappOrder';

const Checkout = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phone: user?.phone || '',
    notes: '',
  });

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const vendorGroups = useMemo(() => groupCartByVendor(cartItems), [cartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await ordersApi.create({
        cartItems,
        shippingAddress: formData.shippingAddress,
        phone: formData.phone,
        notes: formData.notes,
        paymentMethod: 'whatsapp_direct',
      });
      // Cart is cleared server-side; CartContext picks it up via socket.
      // Stash payload for the confirmation screen.
      const payload = {
        orderIds: result.orderIds || [],
        groups: vendorGroups,
        buyerName: user?.name || '',
        deliveryAddress: formData.shippingAddress,
        deliveryNotes: formData.notes,
      };
      try {
        sessionStorage.setItem('thriftlink:lastOrder', JSON.stringify(payload));
      } catch {}
      const firstId = (result.orderIds && result.orderIds[0]) || 'new';
      navigate(`/order-confirmation/${firstId}`);
    } catch (error) {
      alert(error.message || 'Failed to record order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 860px) {
          .checkout-wrap { padding: 5.5rem 1.25rem 7rem !important; }
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-summary { position: static !important; top: auto !important; }
          .checkout-card { padding: 1.25rem !important; }
          .checkout-title { font-size: clamp(1.4rem, 5vw, 2rem) !important; }
        }
        @media (max-width: 480px) {
          .checkout-two-col { grid-template-columns: 1fr !important; }
          .checkout-wrap { padding: 5rem 1rem 7rem !important; }
          .checkout-card { padding: 1rem !important; border-radius: 12px !important; }
        }
      `}</style>
      <Navbar />

      <div className="checkout-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/cart')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={20} />
            Back to Cart
          </button>
          <h1 className="checkout-title" style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>WhatsApp Checkout</h1>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.9rem', color: '#065f46', lineHeight: 1.5 }}>
            ThriftLink doesn't process payments. We'll send your order to each vendor on WhatsApp — you'll arrange payment and delivery directly with them.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Buyer Info */}
            <div className="checkout-card" style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Truck size={24} color="#059669" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>Your Details</h2>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Delivery Address</label>
                  <textarea
                    name="shippingAddress"
                    required
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Where should the vendor deliver?"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '100px', resize: 'vertical' }}
                  />
                </div>

                <div className="checkout-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Your Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 08012345678"
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Email</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#6b7280' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Notes (Optional)</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any instructions for the vendor?"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>

            {/* Message preview, grouped by vendor */}
            <div className="checkout-card" style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <MessageCircle size={24} color="#25D366" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>WhatsApp Preview</h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                {vendorGroups.length === 1
                  ? 'This is what your vendor will receive on WhatsApp.'
                  : `Your cart spans ${vendorGroups.length} vendors — each one will receive their own message.`}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {vendorGroups.map((g) => (
                  <div key={g.vendor_id || g.vendor_name} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#1f2937' }}>{g.vendor_name}</div>
                      {!g.vendor_whatsapp && (
                        <span style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                          No WhatsApp on file
                        </span>
                      )}
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {g.items.map((it, i) => (
                        <li key={it.id} style={{ fontSize: '0.9rem', color: '#374151' }}>
                          {i + 1}. {it.name} × {it.quantity} — ₦{(Number(it.price) * it.quantity).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '0.75rem', fontWeight: 700, color: '#065f46' }}>
                      Subtotal: ₦{g.subtotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="checkout-summary" style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>Items</span>
                  <span>{cartItems.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>Vendors</span>
                  <span>{vendorGroups.length}</span>
                </div>
                <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#1f2937' }}>
                  <span>Total</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', background: '#25D366', color: 'white',
                  borderRadius: '999px', fontWeight: '700', fontSize: '1rem', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
                Send order to vendors via WhatsApp
              </button>

              <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.8rem', color: '#065f46', lineHeight: 1.5 }}>
                  After you click send, we'll record your order intent and take you to a confirmation page with a WhatsApp link for each vendor.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
