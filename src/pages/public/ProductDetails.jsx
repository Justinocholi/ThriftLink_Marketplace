import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ReviewSection from '../../components/ReviewSection';
import {
  Star,
  Shield,
  MessageCircle,
  MapPin,
  Heart,
  Share2,
  ShoppingCart,
  Phone,
  Flag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  products as productsApi,
  reviews as reviewsApi,
  userMe as userMeApi,
} from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/UIContext';
import { useToast } from '../../components/ui/Toast';
import SafetyTips from '../../components/ui/SafetyTips';
import ProgressiveImage from '../../components/ui/ProgressiveImage';
import { Skeleton, SkeletonCircle } from '../../components/ui/Skeleton';
import ProductCard from '../../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { requireAuth, openReport } = useAuthGate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [recentItems, setRecentItems] = useState([]);

  const galleryRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(id)
      .then(async (data) => {
        setProduct(data);
        // Async secondary load — reviews don't block initial paint.
        reviewsApi
          .getForVendor(data.vendor_id)
          .then((rev) => setReviews(rev.reviews || []))
          .catch(() => {});
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
      })
      .finally(() => setLoading(false));

    // Track recently viewed (cap 10, newest first, dedupe)
    try {
      const raw = localStorage.getItem('tl_recent');
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr.filter(x => x !== id) : [];
      list.unshift(id);
      const capped = list.slice(0, 10);
      localStorage.setItem('tl_recent', JSON.stringify(capped));
      // Hydrate strip from the other recent IDs (exclude current product)
      const others = capped.filter(x => x !== id).slice(0, 8);
      if (others.length) {
        Promise.all(others.map(rid => productsApi.get(rid).catch(() => null)))
          .then(rs => setRecentItems(rs.filter(Boolean)));
      } else {
        setRecentItems([]);
      }
    } catch {}
  }, [id]);

  const images = (() => {
    try {
      return product ? JSON.parse(product.images || '[]') : [];
    } catch {
      return [];
    }
  })();

  const allImages = images.length
    ? images
    : ['https://images.unsplash.com/photo-1576995853123-5a297da40303?auto=format&fit=crop&q=80&w=800'];

  const scrollGallery = (dir) => {
    setActiveImg((curr) => {
      const next = (curr + dir + allImages.length) % allImages.length;
      const el = galleryRef.current;
      if (el) {
        el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
      }
      return next;
    });
  };

  const handleAddToCart = () => {
    requireAuth({
      label: 'add this item to your cart',
      onAuthed: async () => {
        setAddingToCart(true);
        try {
          await addToCart(product.id, quantity);
          toast.success('Added to cart');
        } catch (error) {
          toast.error(error.message || 'Failed to add to cart');
        } finally {
          setAddingToCart(false);
        }
      },
    });
  };

  const handleSave = () => {
    requireAuth({
      label: 'save this item to your wishlist',
      onAuthed: async () => {
        try {
          if (saved) {
            await userMeApi.unsaveItem(product.id);
            setSaved(false);
            toast.info('Removed from saved items');
          } else {
            await userMeApi.saveItem({ product_id: product.id });
            setSaved(true);
            toast.success('Saved to your wishlist');
          }
        } catch (error) {
          toast.error(error.message || 'Action failed');
        }
      },
    });
  };

  const handleChatSeller = () => {
    requireAuth({
      label: 'chat with this seller',
      onAuthed: () => {
        // Pre-fill conversation context via query string.
        navigate(
          `/user/messages?to=${product.vendor_user_id || product.vendor_id}&product=${product.id}`
        );
      },
    });
  };

  const handleShowNumber = () => {
    requireAuth({
      label: 'see this seller’s phone number',
      onAuthed: () => setPhoneRevealed(true),
    });
  };

  const handleReport = () => {
    openReport({
      targetType: 'product',
      targetId: product.id,
      targetName: product.name,
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.info('Link copied to clipboard');
      }
    } catch {
      // user cancelled — ignore
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '2rem 1.25rem', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <div className="pd-grid">
            <div>
              <Skeleton height={460} radius={16} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={80} radius={10} />
                ))}
              </div>
            </div>
            <div>
              <Skeleton height={26} width="75%" />
              <div style={{ height: 18 }} />
              <Skeleton height={36} width="50%" />
              <div style={{ height: 22 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SkeletonCircle size={48} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={14} width="40%" />
                  <div style={{ height: 6 }} />
                  <Skeleton height={12} width="25%" />
                </div>
              </div>
              <div style={{ height: 24 }} />
              <Skeleton height={14} />
              <div style={{ height: 8 }} />
              <Skeleton height={14} width="92%" />
              <div style={{ height: 8 }} />
              <Skeleton height={14} width="80%" />
              <div style={{ height: 24 }} />
              <Skeleton height={48} radius={12} />
              <div style={{ height: 10 }} />
              <Skeleton height={48} radius={12} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Product Not Found</h1>
          <button onClick={() => navigate('/categories')} className="tl-btn tl-btn-primary">
            Back to Categories
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const stockLow = product.stock_quantity > 0 && product.stock_quantity <= 3;

  return (
    <div
      className="tl-page-enter"
      style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Navbar />

      <main style={{ flex: 1, padding: '1.25rem 1rem 6rem', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="pd-grid">
            {/* Image gallery */}
            <div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#f1f5f9',
                }}
              >
                <div
                  ref={galleryRef}
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                  }}
                  onScroll={(e) => {
                    const next = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
                    if (next !== activeImg) setActiveImg(next);
                  }}
                >
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start' }}
                    >
                      <ProgressiveImage src={img} alt={`${product.name} ${i + 1}`} lazy={i > 0} />
                    </div>
                  ))}
                </div>

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => scrollGallery(-1)}
                      style={navArrowStyle('left')}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => scrollGallery(1)}
                      style={navArrowStyle('right')}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div style={dotsStyle}>
                      {allImages.map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: i === activeImg ? 22 : 6,
                            height: 6,
                            borderRadius: 999,
                            background: i === activeImg ? '#25D366' : 'rgba(255,255,255,0.75)',
                            transition: 'all 0.25s',
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {allImages.length > 1 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveImg(i);
                        galleryRef.current?.scrollTo({
                          left: i * galleryRef.current.clientWidth,
                          behavior: 'smooth',
                        });
                      }}
                      style={{
                        aspectRatio: '1',
                        background: '#f1f5f9',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: i === activeImg ? '2px solid #25D366' : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    {product.name}
                  </h1>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 6,
                      fontSize: '0.82rem',
                      color: '#64748b',
                    }}
                  >
                    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <Clock size={14} /> Recently posted
                    </span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{product.condition}</span>
                    <span>•</span>
                    <span>{product.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <IconBtn label="Share" onClick={handleShare}>
                    <Share2 size={18} color="#64748b" />
                  </IconBtn>
                  <IconBtn label="Save" onClick={handleSave}>
                    <Heart
                      size={18}
                      fill={saved ? '#ef4444' : 'none'}
                      color={saved ? '#ef4444' : '#64748b'}
                    />
                  </IconBtn>
                  <IconBtn label="Report listing" onClick={handleReport}>
                    <Flag size={18} color="#64748b" />
                  </IconBtn>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', marginTop: 16 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                  ₦{Number(product.price || 0).toLocaleString()}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                    ₦{Number(product.original_price).toLocaleString()}
                  </span>
                )}
                <span
                  className="tl-badge"
                  style={{
                    background: product.stock_quantity > 0 ? 'rgba(34,197,94,0.12)' : '#fee2e2',
                    color: product.stock_quantity > 0 ? '#15803d' : '#b91c1c',
                  }}
                >
                  {product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
                </span>
                {stockLow && (
                  <span className="tl-badge tl-badge-warn">Only {product.stock_quantity} left</span>
                )}
              </div>

              {/* Seller card */}
              <div
                style={{
                  marginTop: 20,
                  borderTop: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '1.1rem 0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#e2e8f0',
                  }}
                >
                  <img
                    src={product.vendor_logo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + product.vendor_name}
                    alt={product.vendor_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    className="tl-online-dot"
                    style={{ position: 'absolute', bottom: -1, right: -1 }}
                    aria-hidden
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '0.98rem' }}>
                      {product.vendor_name}
                    </h3>
                    {product.is_verified === 1 && (
                      <span className="tl-badge tl-badge-verified">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      color: '#64748b',
                      fontSize: '0.82rem',
                      marginTop: 2,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                      <Star size={14} fill="#f59e0b" /> {product.vendor_rating || 'New'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {product.vendor_city || 'Nigeria'}
                      {product.vendor_state ? `, ${product.vendor_state}` : ''}
                    </span>
                    <span>Responds within 30 min</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/vendor/${product.vendor_id}`)}
                  className="tl-btn tl-btn-secondary"
                  style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}
                >
                  View Profile
                </button>
              </div>

              {/* CTAs — Chat & Show Number dominant, Add to Cart secondary */}
              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
                className="pd-ctas"
              >
                <button
                  onClick={handleChatSeller}
                  className="tl-btn tl-btn-primary"
                  style={{ padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
                >
                  <MessageCircle size={20} />
                  Chat Seller
                </button>
                <button
                  onClick={handleShowNumber}
                  className="tl-btn"
                  style={{
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: '#0f172a',
                    color: 'white',
                  }}
                >
                  <Phone size={18} />
                  {phoneRevealed
                    ? product.whatsapp_number || 'Number unavailable'
                    : 'Show Phone Number'}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="tl-btn tl-btn-secondary"
                  style={{ gridColumn: '1 / -1', padding: '0.85rem', fontWeight: 600 }}
                >
                  {addingToCart ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              <p style={{ marginTop: 12, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                Negotiate the price — most ThriftLink sellers welcome offers via chat.
              </p>

              {/* Description */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Description</h3>
                <p style={{ color: '#475569', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {product.description || 'No description provided by the seller.'}
                </p>
              </div>

              {/* Safety Tips */}
              <div style={{ marginTop: 24 }}>
                <SafetyTips />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 48 }}>
            <ReviewSection reviews={reviews} title="Seller Reviews" />
          </div>
        </div>
      </main>

      {/* Sticky CTA bar (mobile only) */}
      <div className="tl-sticky-cta pd-sticky-mobile">
        <button
          onClick={handleChatSeller}
          className="tl-btn tl-btn-primary"
          style={{ flex: 1.2, fontWeight: 700 }}
        >
          <MessageCircle size={18} />
          Chat Seller
        </button>
        <button
          onClick={handleShowNumber}
          className="tl-btn"
          style={{
            flex: 1,
            background: '#0f172a',
            color: 'white',
            fontWeight: 700,
          }}
        >
          <Phone size={16} />
          {phoneRevealed ? 'Saved' : 'Call'}
        </button>
      </div>

      {recentItems.length > 0 && (
        <section style={{ padding: '2rem 1.25rem 3rem', background: '#f9fafb' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Recently viewed</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollSnapType: 'x mandatory' }}>
              {recentItems.map(p => (
                <div key={p.id} style={{ minWidth: 220, maxWidth: 220, scrollSnapAlign: 'start' }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      <style>{`
        .pd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 2.5rem;
        }
        .pd-sticky-mobile { display: none; }
        @media (max-width: 880px) {
          .pd-grid { grid-template-columns: 1fr; gap: 1.25rem; }
        }
        @media (max-width: 768px) {
          .pd-sticky-mobile { display: flex; bottom: 64px; }
          .pd-ctas { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const IconBtn = ({ children, onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1px solid #e2e8f0',
      background: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.18s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
  >
    {children}
  </button>
);

const navArrowStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 12,
  transform: 'translateY(-50%)',
  background: 'rgba(15,23,42,0.5)',
  border: 'none',
  color: 'white',
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 3,
});

const dotsStyle = {
  position: 'absolute',
  bottom: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 5,
  zIndex: 3,
};

export default ProductDetails;
