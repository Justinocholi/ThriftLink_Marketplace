import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 860px) {
          .cart-wrap { padding: 5.5rem 1.25rem 3rem !important; }
          .cart-grid { grid-template-columns: 1fr !important; }
          .cart-summary { position: static !important; top: auto !important; }
          .cart-title { font-size: clamp(1.4rem, 5vw, 2rem) !important; }
          .cart-item { padding: 1rem !important; gap: 1rem !important; }
          .cart-item-img { width: 80px !important; height: 80px !important; }
        }
        @media (max-width: 480px) {
          .cart-wrap { padding: 5rem 1rem 3rem !important; }
          .cart-item { flex-direction: column !important; align-items: stretch !important; }
          .cart-item-img { width: 100% !important; height: 160px !important; }
          .cart-summary-card { padding: 1.25rem !important; }
        }
      `}</style>
      <Navbar />
      
      <div className="cart-wrap" style={{ maxWidth: '1000px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="cart-title" style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>Your Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '80px', height: '80px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShoppingBag size={40} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Your cart is empty</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Looks like you haven't added anything to your cart yet. Browse our verified vendors to find great deals!
            </p>
            <Link 
              to="/verified-vendors" 
              style={{ 
                display: 'inline-block', padding: '1rem 2.5rem', background: '#3b82f6', color: 'white', 
                borderRadius: '8px', fontWeight: '600', textDecoration: 'none', transition: 'background 0.3s' 
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div className="cart-item-img" style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    <img 
                      src={item.images?.[0] || 'https://via.placeholder.com/100'} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>Sold by <span style={{ color: '#3b82f6', fontWeight: '600' }}>{item.shop_name}</span></p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f3f4f6', borderRadius: '6px', padding: '0.25rem' }}>
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          style={{ background: 'white', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'white', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1f2937' }}>
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="cart-summary" style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
              <div className="cart-summary-card" style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>Order Summary</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Subtotal</span>
                    <span>₦{cartTotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#1f2937' }}>
                    <span>Total</span>
                    <span>₦{cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%', padding: '1rem', background: '#25D366', color: 'white',
                    borderRadius: '999px', fontWeight: '700', fontSize: '1rem', border: 'none',
                    cursor: 'pointer', transition: 'background 0.3s',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                  }}
                >
                  Continue to WhatsApp checkout
                </button>

                <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '0.8rem', color: '#065f46', lineHeight: 1.5, margin: 0 }}>
                    ThriftLink doesn't process payments. You'll send your order directly to the vendor on WhatsApp, and pay them on delivery or via direct transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Cart;
