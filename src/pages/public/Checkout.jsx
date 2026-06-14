import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phone: user?.phone || '',
    notes: '',
    paymentMethod: 'bank_transfer'
  });

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ordersApi.create({ cartItems, ...formData });
      await clearCart();
      navigate('/user/orders', { state: { message: 'Order placed successfully!' } });
    } catch (error) {
      alert(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 860px) {
          .checkout-wrap { padding: 5.5rem 1.25rem 3rem !important; }
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-summary { position: static !important; top: auto !important; }
        }
        @media (max-width: 480px) {
          .checkout-two-col { grid-template-columns: 1fr !important; }
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
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Shipping Info */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Truck size={24} color="#3b82f6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>Shipping Information</h2>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Delivery Address</label>
                  <textarea 
                    name="shippingAddress"
                    required
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '100px', resize: 'vertical' }}
                  />
                </div>
                
                <div className="checkout-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Phone Number</label>
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Email (Auto-filled)</label>
                    <input 
                      type="email"
                      disabled
                      value={user?.email || ''}
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#6b7280' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Order Notes (Optional)</label>
                  <input 
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for the vendor?"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <CreditCard size={24} color="#3b82f6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>Payment Method</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: `2px solid ${formData.paymentMethod === 'bank_transfer' ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '12px', cursor: 'pointer', background: formData.paymentMethod === 'bank_transfer' ? '#eff6ff' : 'white'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>Direct Bank Transfer / Pay on Delivery</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Coordinate payment directly with the vendor after order confirmation.</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: `2px solid ${formData.paymentMethod === 'online' ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '12px', cursor: 'pointer', background: formData.paymentMethod === 'online' ? '#eff6ff' : 'white', opacity: 0.6
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    disabled
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>Online Payment (Coming Soon)</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Pay securely with Card, Transfer, or USSD.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="checkout-summary" style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>Your Items</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {cartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                      <img src={item.images?.[0] || 'https://via.placeholder.com/50'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Qty: {item.quantity} × ₦{item.price.toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>₦{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>Subtotal</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>Shipping Fee</span>
                  <span style={{ fontSize: '0.85rem' }}>To be agreed with vendor</span>
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
                  width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', 
                  borderRadius: '8px', fontWeight: '700', fontSize: '1rem', border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                Place Order
              </button>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: '1.5' }}>
                  <strong>Note:</strong> You will coordinate payment and delivery directly with the vendor via WhatsApp/Phone after placing this order.
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
