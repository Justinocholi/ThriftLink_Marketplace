import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeedPostCard from '../../components/FeedPostCard';
import RecommendationCard from '../../components/RecommendationCard';
import InterestSelectorModal from '../../components/InterestSelectorModal';
import { recommendations as recApi } from '../../services/api';
import {
  Sparkles,
  Heart,
  Clock,
  Compass,
  Bookmark,
  MessageCircle,
  SlidersHorizontal,
  Layers,
  Store,
} from 'lucide-react';
import { ROUTES } from '../../routes';

const NewsFeed = () => {
  const [surface, setSurface] = useState('recommended_for_you');
  const [posts, setPosts] = useState([]);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [interestModalOpen, setInterestModalOpen] = useState(false);

  const loadFeed = useCallback(async (activeSurface = surface) => {
    setLoading(true);
    try {
      const [feedRes, vendorRes] = await Promise.all([
        recApi.getFeed({ surface: activeSurface, limit: 18 }).catch(() => ({ posts: [] })),
        recApi.getVendors({ surface: 'recommended_for_you', limit: 4 }).catch(() => ({ vendors: [] })),
      ]);
      setPosts(Array.isArray(feedRes?.posts) ? feedRes.posts : []);
      setSuggestedVendors(Array.isArray(vendorRes?.vendors) ? vendorRes.vendors : []);
    } finally {
      setLoading(false);
    }
  }, [surface]);

  useEffect(() => {
    loadFeed(surface);
  }, [surface, loadFeed]);

  const filteredPosts = categoryFilter
    ? posts.filter(
        (p) =>
          (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase()) ||
          (p.name || '').toLowerCase().includes(categoryFilter.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(categoryFilter.toLowerCase())
      )
    : posts;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--tl-bg)', minHeight: '100vh' }}>
      <Navbar />

      {/* Glossy Feed Hero Header */}
      <section
        style={{
          padding: '6.5rem 1.5rem 2.5rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 55%, #0ea5e9 100%)',
          color: 'white',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.3rem 0.85rem',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={14} /> Personalized ThriftLink News Feed
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.6rem)', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
              {surface === 'recommended_for_you' && 'For You — Thrift Drops & Vendor Posts'}
              {surface === 'following' && 'Following — Updates From Vendors You Follow'}
              {surface === 'new_arrivals' && 'New Arrivals — Fresh Catalog Drops'}
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.96rem', maxWidth: 640 }}>
              Discover a post, open a verified vendor, browse their catalog, save or follow, and enquire directly on WhatsApp.
            </p>
          </div>

          {/* Core Customer Experience Shortcuts (Section 1) */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setInterestModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.65rem 1.15rem',
                borderRadius: 999,
                border: 'none',
                background: 'white',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={15} color="#059669" />
              Feed Preferences
            </button>
            <Link
              to="/category/all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.65rem 1.1rem',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.84rem',
                textDecoration: 'none',
              }}
            >
              <Compass size={15} /> Discover
            </Link>
            <Link
              to={ROUTES.user.saved}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.65rem 1.1rem',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.84rem',
                textDecoration: 'none',
              }}
            >
              <Bookmark size={15} /> Saved
            </Link>
            <Link
              to={ROUTES.messages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.65rem 1.1rem',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.84rem',
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={15} /> Enquiries
            </Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        {/* Surface Tabs + Category Filter Chips */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'recommended_for_you', label: 'For You', Icon: Sparkles },
              { id: 'following', label: 'Following', Icon: Heart },
              { id: 'new_arrivals', label: 'New Arrivals', Icon: Clock },
            ].map(({ id, label, Icon }) => {
              const active = surface === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSurface(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.6rem 1.2rem',
                    borderRadius: 999,
                    border: active ? '1.5px solid #16b865' : '1px solid #e2e8f0',
                    background: active ? '#dcfce7' : 'white',
                    color: active ? '#15803d' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Quick Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['', 'Fashion', 'Shoes', 'Bags', 'Vintage', 'Electronics'].map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat || 'all'}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 999,
                    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: active ? '#0f172a' : 'white',
                    color: active ? 'white' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat || 'All Posts'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed Posts Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="tl-skeleton" style={{ height: 420, borderRadius: 18 }} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            className="tl-card"
            style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              background: 'white',
              borderRadius: 18,
              marginBottom: '2.5rem',
            }}
          >
            <Layers size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
              {surface === 'following'
                ? "No Posts From Followed Vendors Yet"
                : "No Feed Posts Match This Filter"}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.25rem' }}>
              {surface === 'following'
                ? "Follow verified thrift vendors below or switch to the 'For You' feed to see fresh thrift drops across Nigeria."
                : "Try clearing the filter or updating your thrifting preferences."}
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('');
                if (surface === 'following') setSurface('recommended_for_you');
                else setInterestModalOpen(true);
              }}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: 999,
                border: 'none',
                background: '#16b865',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {surface === 'following' ? 'Explore For You Feed →' : 'Personalize Feed Preferences →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {filteredPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                surface={surface}
                onFollowChange={() => {
                  if (surface === 'following') loadFeed('following');
                }}
              />
            ))}
          </div>
        )}

        {/* Recommended Verified Vendors to Follow Strip */}
        {suggestedVendors.length > 0 && (
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={20} color="#16b865" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Recommended Vendors to Follow
                </h2>
              </div>
              <Link to="/verified-vendors" style={{ color: '#16b865', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                See all verified vendors →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {suggestedVendors.map((v, idx) => (
                <RecommendationCard key={v.id} vendor={v} surface="recommended_for_you" position={idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      <InterestSelectorModal
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        onSaved={() => loadFeed(surface)}
      />

      <Footer />
    </div>
  );
};

export default NewsFeed;
