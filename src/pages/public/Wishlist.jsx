import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard, { getWishlist } from '../../components/ProductCard';
import { products as productsApi } from '../../services/api';
import { Heart } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const Wishlist = () => {
  const { data, error, loading, retry } = useFetch(async () => {
    const ids = getWishlist();
    if (!ids.length) return [];
    const results = await Promise.all(ids.map(id => productsApi.get(id).catch(() => null)));
    return results.filter(Boolean);
  }, []);
  const items = data || [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--tl-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 1.25rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <Heart size={28} color="#FF6B6B" fill="#FF6B6B" />
          <h1 style={{ fontSize: 'var(--tl-text-h1)', fontWeight: 800, color: 'var(--tl-ink)' }}>Your Wishlist</h1>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={retry} title="Couldn't load your wishlist" />
        ) : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="tl-skeleton" style={{ borderRadius: 'var(--tl-radius-md)', aspectRatio: '3 / 4' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="tl-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <Heart size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Nothing saved yet</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Tap the heart on any product to add it to your wishlist.</p>
            <Link to="/categories" className="tl-btn-press" style={{ display: 'inline-block', padding: '0.85rem 1.6rem', background: 'var(--tl-green)', color: 'white', borderRadius: 'var(--tl-radius-pill)', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)', transition: 'transform var(--tl-fast) var(--tl-ease)' }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
