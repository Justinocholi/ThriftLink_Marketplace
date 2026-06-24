import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Star, MapPin, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { cldUrl } from '../utils/cloudinary';
import { useCart } from '../context/CartContext';
import { useAuthGate } from '../context/UIContext';
import { useToast } from './ui/Toast';

const WISHLIST_KEY = 'tl_wishlist';

export const getWishlist = () => {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const setWishlist = (ids) => {
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)); } catch {}
  try { window.dispatchEvent(new Event('tl_wishlist_change')); } catch {}
};

export const toggleWishlist = (id) => {
  const list = getWishlist();
  const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  setWishlist(next);
  return next.includes(id);
};

const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
};

const ProductCard = ({ product }) => {
  const [favorited, setFavorited] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { requireAuth } = useAuthGate();
  const toast = useToast();

  useEffect(() => {
    setFavorited(getWishlist().includes(product.id));
    const sync = () => setFavorited(getWishlist().includes(product.id));
    window.addEventListener('tl_wishlist_change', sync);
    return () => window.removeEventListener('tl_wishlist_change', sync);
  }, [product.id]);

  const handleFav = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const now = toggleWishlist(product.id);
    setFavorited(now);
  }, [product.id]);

  const handleAdd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth({
      label: 'add this item to your cart',
      onAuthed: async () => {
        setAdding(true);
        try {
          await addToCart(product.id, 1);
          setAdded(true);
          toast.success('Added to cart');
          setTimeout(() => setAdded(false), 1500);
        } catch (err) {
          toast.error(err.message || 'Failed to add to cart');
        } finally {
          setAdding(false);
        }
      },
    });
  }, [product.id, addToCart, requireAuth, toast]);

  const images = parseImages(product.images);
  const cover = images[0] || product.image || 'https://via.placeholder.com/400?text=ThriftLink';
  const price = Number(product.price || 0);
  const rating = Number(product.vendor_rating || product.rating || 0);
  const reviews = Number(product.vendor_total_reviews || product.total_reviews || 0);

  return (
    <Link
      to={`/product/${product.id}`}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
      }}
      className="tl-pcard"
    >
      <style>{`
        .tl-pcard:hover { transform: translateY(-4px); box-shadow: 0 18px 36px -16px rgba(15,23,42,0.18); border-color: rgba(22,184,101,0.3) !important; }
        .tl-pcard:hover .tl-pcard-img img { transform: scale(1.05); }
      `}</style>
      <div className="tl-pcard-img" style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f1f5f9', overflow: 'hidden' }}>
        <img src={cldUrl(cover, 400)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s ease' }} />
        <button
          onClick={handleFav}
          aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 36, height: 36, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
          }}
        >
          <Heart size={18} color={favorited ? '#FF6B6B' : '#0f172a'} fill={favorited ? '#FF6B6B' : 'none'} />
        </button>
        <button
          onClick={handleAdd}
          disabled={adding || product.stock_quantity === 0}
          aria-label="Add to cart"
          title={product.stock_quantity === 0 ? 'Out of stock' : 'Add to cart'}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            width: 40, height: 40, borderRadius: '50%',
            border: 'none', cursor: adding ? 'wait' : 'pointer',
            background: added ? '#16a34a' : '#16b865',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(15,23,42,0.18)',
            opacity: product.stock_quantity === 0 ? 0.5 : 1,
            transition: 'background .2s ease, transform .15s ease',
          }}
        >
          {adding ? <Loader2 size={18} className="animate-spin" /> : added ? <Check size={18} /> : <ShoppingCart size={18} />}
        </button>
      </div>
      <div style={{ padding: '0.9rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.55rem' }}>
          {product.name}
        </h3>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16b865' }}>
          ₦{Number(price).toLocaleString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{product.vendor_name || 'Vendor'}</span>
          {product.is_verified ? (
            <span title="Verified vendor" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={14} color="#3b82f6" fill="#dbeafe" />
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#64748b' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Star size={12} color="#facc15" fill="#facc15" />
            {rating > 0 ? rating.toFixed(1) : 'New'}
            {reviews > 0 ? ` (${reviews})` : ''}
          </span>
          {product.vendor_state ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} /> {product.vendor_state}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
