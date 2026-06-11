import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi, payment as paymentApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Loader2, Copy, Check } from 'lucide-react';

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
  const [bankAccount, setBankAccount] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState('');
  const [refSubmitting, setRefSubmitting] = useState(false);

  useEffect(() => {
    paymentApi.getAccount().then(setBankAccount).catch(() => {});
  }, []);

  if (cartItems.length === 0 && !orderResult) {
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
      const response = await ordersApi.create({
        cartItems,
        ...formData
      });
      await clearCart();
      setOrderResult({ orderIds: response.orderIds, total: cartTotal });
    } catch (error) {
      alert(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key, value) => {
    navigator.clipboard?.writeText(String(value || ''));
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const submitReference = async (e) => {
    e.preventDefault();
    if (!paymentReference.trim() || !orderResult?.orderIds?.length) return;
    setRefSubmitting(true);
    try {
      await Promise.all(
        orderResult.orderIds.map((id) => ordersApi.submitPaymentReference(id, paymentReference.trim()))
      );
      navigate('/user/orders', {
        state: { message: 'Payment reference submitted. We will confirm shortly.' },
      });
    } catch (err) {
      alert(err.message || 'Failed to submit reference');
    } finally {
      setRefSubmitting(false);
    }
  };

  // ----- Post-order payment instructions screen -----
  if (orderResult) {
    const order8 = orderResult.orderIds[0].slice(0, 8);
    return (
      <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>
            Order #{order8} placed
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Transfer <strong>₦{orderResult.total.toLocaleString()}</strong> to the account below to complete your purchase.
          </p>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
              Payment account
            </h2>
            {[
              { key: 'bank', label: 'Bank', value: bankAccount?.bankName },
              { key: 'number', label: 'Account number', value: bankAccount?.accountNumber },
              { key: 'name', label: 'Account name', value: bankAccount?.accountName },
              { key: 'amount', label: 'Amount', value: `₦${orderResult.total.toLocaleString()}` },
              { key: 'ref', label: 'Use this as transfer narration', value: `THRIFT-${order8}` },
            ].map((row) => (
              <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.label}</div>
                  <div style={{ fontWeight: 600, color: '#1f2937', marginTop: 2 }}>{row.value || '—'}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(row.key, row.value)}
                  style={{ background: '#f3f4f6', border: 'none', padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#374151' }}
                >
                  {copied === row.key ? <Check size={14} /> : <Copy size={14} />}
                  {copied === row.key ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={submitReference} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              After paying, paste your transfer reference
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Found on your bank app receipt (e.g. <code>FT123456789</code>). We use it to match your payment.
            </p>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transfer reference"
              required
              style={{ width: '100%', padding: '0.9rem', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: '1rem' }}
            />
            <button
              type="submit"
              disabled={refSubmitting || !paymentReference.trim()}
              style={{ width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: refSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {refSubmitting ? 'Submitting…' : 'Submit reference & go to my orders'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/user/orders')}
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.75rem', background: 'transparent', color: '#6b7280', borderRadius: 8, fontWeight: 600, border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              I'll do it later
            </button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
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
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: `2px solid #3b82f6`,
                  borderRadius: '12px', cursor: 'pointer', background: '#eff6ff'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked
                    readOnly
                  />
                  <div>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>Bank Transfer</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Transfer to {bankAccount?.bankName || 'our'} account{' '}
                      {bankAccount?.accountNumber ? <strong>{bankAccount.accountNumber}</strong> : ''}.
                      You'll see the full details after placing the order.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
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
                  <strong>Note:</strong> After placing the order you'll see our bank details and can paste your transfer reference so we can confirm payment and notify the vendor.
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
