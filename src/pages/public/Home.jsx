import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeedPostCard from '../../components/FeedPostCard';
import InFeedSuggestedVendors from '../../components/InFeedSuggestedVendors';
import InterestSelectorModal from '../../components/InterestSelectorModal';
import { recommendations as recApi, vendors as vendorsApi, products as productsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cldUrl } from '../../utils/cloudinary';
import { ROUTES } from '../../routes';
import {
  Globe,
  Sparkles,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Search,
  MapPin,
  SlidersHorizontal,
  PlusCircle,
  Compass,
  Bookmark,
  MessageCircle,
  Layers,
  Store,
  ChevronRight,
  ArrowRight,
  Star,
  Check,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #1877f2, #1d4ed8)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #14b8a6, #0f766e)',
];

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'TL';

const gradientFor = (id = '') => {
  let sum = 0;
  for (let i = 0; i < String(id).length; i++) sum += String(id).charCodeAt(i);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
};

const NIGERIAN_STATES = [
  'All Nigeria',
  'Lagos',
  'Abuja (FCT)',
  'Rivers (Port Harcourt)',
  'Oyo (Ibadan)',
  'Edo (Benin)',
  'Enugu',
  'Delta',
  'Kaduna',
  'Kano',
  'Ogun',
  'Anambra',
];

const POPULAR_CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'fashion', label: 'Fashion & Clothes' },
  { id: 'shoes', label: 'Shoes & Sneakers' },
  { id: 'bags', label: 'Bags & Purses' },
  { id: 'vintage', label: 'Vintage & Retro' },
  { id: 'y2k', label: '90s & Y2K' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'accessories', label: 'Accessories' },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [surface, setSurface] = useState('recommended_for_you'); // 'recommended_for_you' | 'new_arrivals' | 'following'
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all' | 'verified' | 'restricted'

  // Data State
  const [posts, setPosts] = useState([]);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [interestModalOpen, setInterestModalOpen] = useState(false);

  // Load feed and suggested vendors based on recommendation algorithm
  const loadFeedData = useCallback(async (activeSurface = surface, currentPage = 1, append = false) => {
    if (currentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const [feedRes, vendorsRes] = await Promise.all([
        recApi.getFeed({ surface: activeSurface, limit: 16, page: currentPage }).catch(() => ({ posts: [] })),
        recApi.getVendors({ surface: 'recommended_for_you', limit: 12 }).catch(() => ({ vendors: [] })),
      ]);

      const fetchedPosts = Array.isArray(feedRes?.posts) ? feedRes.posts : [];
      const fetchedVendors = Array.isArray(vendorsRes?.vendors) ? vendorsRes.vendors : [];

      if (append) {
        setPosts((prev) => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }

      setSuggestedVendors(fetchedVendors);
      setHasMore(fetchedPosts.length >= 12);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [surface]);

  useEffect(() => {
    setPage(1);
    loadFeedData(surface, 1, false);
  }, [surface, loadFeedData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeedData(surface, nextPage, true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim() && !selectedState) return;
    // Client-side quick filter first; user can also jump to full directory
    if (searchInput.trim().length > 3) {
      navigate(`/category/all?q=${encodeURIComponent(searchInput.trim())}&state=${encodeURIComponent(selectedState === 'All Nigeria' ? '' : selectedState)}`);
    }
  };

  const handleFollowVendor = (vendorId, isFollowed) => {
    // If on following surface and unfollowed, we can refresh
    if (surface === 'following' && !isFollowed) {
      setPosts((prev) => prev.filter((p) => p.vendor_id !== vendorId));
    }
  };

  // Filter posts by verification, category, search, and location
  const filteredPosts = posts.filter((post) => {
    // Verification filter
    if (verificationFilter === 'verified' && !post.is_verified) return false;
    if (verificationFilter === 'restricted' && post.is_verified) return false;

    // Search query filter
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      const match =
        (post.name || '').toLowerCase().includes(q) ||
        (post.description || '').toLowerCase().includes(q) ||
        (post.vendor_name || '').toLowerCase().includes(q) ||
        (post.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category filter
    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      const match =
        (post.category || '').toLowerCase().includes(cat) ||
        (post.name || '').toLowerCase().includes(cat);
      if (!match) return false;
    }

    // State location filter
    if (selectedState && selectedState !== 'All Nigeria') {
      const stateQuery = selectedState.split(' ')[0].toLowerCase();
      const vendorState = (post.vendor_state || post.state || '').toLowerCase();
      if (!vendorState.includes(stateQuery)) return false;
    }

    return true;
  });

  const verifiedCount = posts.filter((p) => p.is_verified).length;
  const restrictedCount = posts.filter((p) => !p.is_verified).length;

  return (
    <div style={{ fontFamily: "'Inter', 'Lucida Grande', Tahoma, sans-serif", background: '#edeff4', minHeight: '100vh', color: '#1e293b' }}>
      <style>{`
        /* Early-Facebook Wall 3-Column Responsive Grid */
        .fb-wall-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr) 300px;
          gap: 1.25rem;
          align-items: start;
        }

        .fb-sticky-col {
          position: sticky;
          top: 5rem;
        }

        @media (max-width: 1080px) {
          .fb-wall-layout {
            grid-template-columns: 210px minmax(0, 1fr);
          }
          .fb-right-col {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .fb-wall-layout {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .fb-left-col {
            position: static !important;
          }
          .hero-intro-header {
            padding: 4.5rem 1rem 1.5rem !important;
          }
          .hero-search-form {
            flex-direction: column !important;
          }
          .hero-search-form input,
          .hero-search-form select,
          .hero-search-form button {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid #e2e8f0 !important;
          }
        }

        /* Post Card subtle hover */
        .fb-card-hover {
          transition: box-shadow 0.18s ease;
        }
        .fb-card-hover:hover {
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>

      <Navbar />

      {/* 1. INTRODUCTION SECTION: Early-Facebook Styled ThriftLink Intro & Quick Search */}
      <section
        className="hero-intro-header"
        style={{
          paddingTop: '5.25rem',
          paddingBottom: '1.75rem',
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          borderBottom: '1px solid #172554',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.65rem', borderRadius: 999, background: 'rgba(255,255,255,0.14)', fontSize: '0.76rem', fontWeight: 700, color: '#86efac', marginBottom: '0.5rem' }}>
                <Globe size={13} /> ThriftLink Wall & Marketplace · Nigeria
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.1rem)', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Shop Confidently from Verified Thrift Vendors
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.5 }}>
                Browse live catalog drops and updates directly on the Wall. Connect with independent thrift stores on WhatsApp before you buy.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setInterestModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.55rem 1rem',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <SlidersHorizontal size={14} /> Personalize Preferences
              </button>

              <Link
                to={user?.role === 'vendor' ? '/vendor/products' : '/login'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.55rem 1.15rem',
                  borderRadius: 4,
                  background: '#16a34a',
                  border: '1px solid #15803d',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <PlusCircle size={14} /> Post Vendor Update
              </Link>
            </div>
          </div>

          {/* Quick Search & City Discovery Strip */}
          <form
            onSubmit={handleSearchSubmit}
            className="hero-search-form"
            style={{
              display: 'flex',
              background: '#ffffff',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #cbd5e1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.9rem', color: '#64748b' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="What are you looking to thrift? (e.g. Vintage jackets, Nike sneakers, Y2K bags, dresses...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.8rem 0.9rem',
                border: 'none',
                outline: 'none',
                fontSize: '0.92rem',
                color: '#0f172a',
              }}
            />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                padding: '0.8rem 1rem',
                border: 'none',
                borderLeft: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.85rem',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 600,
              }}
            >
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s === 'All Nigeria' ? '' : s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                padding: '0.8rem 1.6rem',
                background: '#1877f2',
                border: 'none',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              Search Feed
            </button>
          </form>

          {/* Quick Filter Tag Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Quick Tags:</span>
            {[
              { label: 'Vintage Shirts', cat: 'vintage' },
              { label: 'Sneakers & Shoes', cat: 'shoes' },
              { label: 'Ladies Handbags', cat: 'bags' },
              { label: 'Streetwear Bales', cat: 'streetwear' },
              { label: 'Under ₦5,000', cat: 'budget' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setSelectedCategory(selectedCategory === chip.cat ? '' : chip.cat);
                }}
                style={{
                  padding: '0.22rem 0.65rem',
                  borderRadius: 999,
                  border: selectedCategory === chip.cat ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.35)',
                  background: selectedCategory === chip.cat ? '#ffffff' : 'rgba(255,255,255,0.12)',
                  color: selectedCategory === chip.cat ? '#1e3a8a' : '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. MAIN EARLY-FACEBOOK WALL SECTION: Direct Feed with Posts & Interleaved Vendor Suggestions */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1rem 3.5rem' }}>
        <div className="fb-wall-layout">

          {/* ============================================================== */}
          {/* LEFT SIDEBAR: User Quick Access, Feed Views, and Filters       */}
          {/* ============================================================== */}
          <aside className="fb-left-col fb-sticky-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* User Profile Mini-Box (Classic Facebook Left Rail) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                padding: '0.85rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: gradientFor(user.id),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {user.avatar ? (
                      <img src={cldUrl(user.avatar, 90)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initialsOf(user.name)
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                      {user.role === 'vendor' ? 'Verified Vendor' : 'Thrift Buyer'}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.2rem' }}>
                    Welcome to ThriftLink
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.65rem', lineHeight: 1.4 }}>
                    Sign in to save items, chat with vendors, and get personalized recommendations.
                  </p>
                  <Link
                    to="/login"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 3,
                      background: '#1877f2',
                      color: 'white',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Sign In or Register
                  </Link>
                </div>
              )}
            </div>

            {/* Feeds Switcher (News Feed Streams) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                padding: '0.75rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.25rem 0.4rem 0.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.45rem',
                }}
              >
                Feed Views
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { id: 'recommended_for_you', label: 'For You (Ranked)', Icon: Sparkles },
                  { id: 'new_arrivals', label: 'All Updates (Recent)', Icon: Globe },
                  { id: 'following', label: 'Following Wall', Icon: Heart },
                ].map(({ id, label, Icon }) => {
                  const active = surface === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSurface(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.48rem 0.6rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: active ? '#d8dfea' : 'transparent',
                        color: active ? '#1e3a8a' : '#334155',
                        fontWeight: active ? 800 : 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                    >
                      <Icon size={15} color={active ? '#1e3a8a' : '#64748b'} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Verification Stream Filter */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.75rem 0.4rem 0.45rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.45rem',
                }}
              >
                Verification
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { id: 'all', label: `Every Vendor (${posts.length})`, Icon: Layers, color: '#3b82f6' },
                  { id: 'verified', label: `Verified (${verifiedCount})`, Icon: ShieldCheck, color: '#16a34a' },
                  { id: 'restricted', label: `Restricted (${restrictedCount})`, Icon: ShieldAlert, color: '#d97706' },
                ].map(({ id, label, Icon, color }) => {
                  const active = verificationFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVerificationFilter(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: active ? '#e2e8f0' : 'transparent',
                        color: active ? '#0f172a' : '#475569',
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={14} color={color} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Categories & Styles List */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.75rem 0.4rem 0.45rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.45rem',
                }}
              >
                Browse Categories
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {POPULAR_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id || 'all'}
                      type="button"
                      onClick={() => setSelectedCategory(active ? '' : cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.38rem 0.6rem',
                        borderRadius: '3px',
                        border: 'none',
                        background: active ? '#eff6ff' : 'transparent',
                        color: active ? '#1d4ed8' : '#475569',
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{cat.label}</span>
                      {active && <Check size={12} color="#1d4ed8" />}
                    </button>
                  );
                })}
              </div>

              {/* Shortcuts */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.75rem 0.4rem 0.45rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.45rem',
                }}
              >
                Shortcuts
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem' }}>
                <Link to="/categories" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                  <Store size={14} /> Full Category Directory
                </Link>
                <Link to={ROUTES.user.saved} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                  <Bookmark size={14} /> My Saved Items
                </Link>
                <Link to={ROUTES.messages} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                  <MessageCircle size={14} /> Messages & Enquiries
                </Link>
              </div>
            </div>
          </aside>

          {/* ============================================================== */}
          {/* CENTER COLUMN: THE MAIN WALL (Stream + Interleaved Suggestions) */}
          {/* ============================================================== */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

            {/* Early-Facebook Wall Status Composer Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  background: '#f0f2f5',
                  borderBottom: '1px solid #d8dfea',
                  padding: '0.55rem 0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                }}
              >
                <span>ThriftLink Wall · What are you looking to thrift today?</span>
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.74rem' }}>
                  Showing {filteredPosts.length} posts
                </span>
              </div>

              <div style={{ padding: '0.85rem 0.95rem', display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Ask vendors or search thrift items (e.g. vintage jacket, baggy jeans, heels)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '0.6rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '0.84rem',
                    background: '#f8fafc',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate(user?.role === 'vendor' ? '/vendor/products' : '/login')}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '4px',
                    border: '1px solid #1877f2',
                    background: '#1877f2',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(24,119,242,0.3)',
                  }}
                >
                  Share Drop
                </button>
              </div>

              {/* Status Composer Filter Subbar */}
              <div
                style={{
                  padding: '0.45rem 0.95rem',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Filter:</span>
                {['', 'fashion', 'shoes', 'bags', 'vintage'].map((catKey) => {
                  const active = selectedCategory === catKey;
                  const labelMap = {
                    '': 'All Wall Updates',
                    fashion: 'Clothes',
                    shoes: 'Shoes',
                    bags: 'Bags',
                    vintage: 'Vintage',
                  };
                  return (
                    <button
                      key={catKey || 'all'}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      style={{
                        padding: '0.22rem 0.6rem',
                        borderRadius: '3px',
                        border: active ? '1px solid #1877f2' : '1px solid #cbd5e1',
                        background: active ? '#1877f2' : '#ffffff',
                        color: active ? '#ffffff' : '#475569',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {labelMap[catKey]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Notice if any */}
            {(selectedCategory || selectedState || searchInput || verificationFilter !== 'all') && (
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 4,
                  padding: '0.5rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  fontSize: '0.76rem',
                  color: '#1e40af',
                }}
              >
                <div>
                  <strong>Active Filter:</strong>{' '}
                  {verificationFilter !== 'all' && `[${verificationFilter.toUpperCase()}] `}
                  {selectedCategory && `Category: "${selectedCategory}" `}
                  {selectedState && `Location: "${selectedState}" `}
                  {searchInput && `Query: "${searchInput}"`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedState('');
                    setSearchInput('');
                    setVerificationFilter('all');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    textDecoration: 'underline',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* FEED STREAM: Posts + Interleaved "Suggested Thrift Vendors" */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="tl-skeleton" style={{ height: 320, borderRadius: 6 }} />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #d8dfea',
                  borderRadius: '6px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#1877f2' }}>
                  <Store size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                  No posts match your filters
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: 420, margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                  Try switching back to "All Wall Updates" or adjusting your category/location filters to see live vendor posts.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedState('');
                    setSearchInput('');
                    setVerificationFilter('all');
                    setSurface('new_arrivals');
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: 4,
                    border: '1px solid #1877f2',
                    background: '#1877f2',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  View All Vendor Updates
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredPosts.map((post, index) => {
                  const showFirstSuggestions = index === 2 && suggestedVendors.length > 0;
                  const showSecondSuggestions = index === 6 && suggestedVendors.length > 5;

                  return (
                    <React.Fragment key={post.id || index}>
                      {/* 1. Vendor Wall Post Card */}
                      <FeedPostCard
                        post={post}
                        surface={surface}
                        onFollowChange={handleFollowVendor}
                      />

                      {/* 2. Interleaved "Suggested Thrift Vendors" Module (Inserted between posts!) */}
                      {showFirstSuggestions && (
                        <InFeedSuggestedVendors
                          vendors={suggestedVendors.slice(0, 6)}
                          surface={surface}
                          title="Suggested Thrift Vendors For You"
                          subtitle="Verified stores matching your thrifting interests & browsing activity"
                          onFollowChange={handleFollowVendor}
                        />
                      )}

                      {/* 3. Second Interleaved "More Vendors You May Like" Module */}
                      {showSecondSuggestions && (
                        <InFeedSuggestedVendors
                          vendors={suggestedVendors.slice(6, 12)}
                          surface={surface}
                          title="More Verified Vendors You May Like"
                          subtitle="Trending thrift fashion & shoe sellers across Nigeria"
                          onFollowChange={handleFollowVendor}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={handleLoadMore}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.65rem 1.75rem',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#1e3a8a',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: loadingMore ? 'wait' : 'pointer',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw size={14} className="tl-spin" /> Loading more updates...
                        </>
                      ) : (
                        'Load More Vendor Updates ↓'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ============================================================== */}
          {/* RIGHT SIDEBAR: Suggested Vendors Widget & Safety Callouts      */}
          {/* ============================================================== */}
          <aside className="fb-right-col fb-sticky-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* "Suggested Vendors to Follow" Right Rail Widget (Like Facebook's People You May Know) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  background: '#f0f2f5',
                  borderBottom: '1px solid #d8dfea',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#334155',
                }}
              >
                <span>Suggested Vendors</span>
                <Link to="/verified-vendors" style={{ color: '#1877f2', textDecoration: 'none', fontSize: '0.74rem', fontWeight: 700 }}>
                  See All
                </Link>
              </div>

              <div style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {suggestedVendors.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.55rem',
                      paddingBottom: '0.6rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      onClick={() => navigate(`/vendor/${v.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', minWidth: 0, flex: 1 }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '4px',
                          background: v.logo ? `url(${cldUrl(v.logo, 80)}) center/cover` : gradientFor(v.id),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {!v.logo && initialsOf(v.shop_name)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{v.shop_name}</span>
                          {Boolean(v.is_verified) && <ShieldCheck size={12} color="#fff" fill="#16a34a" />}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.category || 'Thrift Store'} {v.state ? `· ${v.state}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/vendor/${v.id}`)}
                      style={{
                        padding: '0.28rem 0.6rem',
                        borderRadius: '3px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#1e3a8a',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Restricted Mode & Verification Notice Box */}
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '4px',
                padding: '0.85rem',
                fontSize: '0.76rem',
                color: '#92400e',
                lineHeight: 1.45,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, marginBottom: '0.35rem' }}>
                <ShieldAlert size={15} color="#d97706" />
                <span>Restricted Vendor Mode</span>
              </div>
              <p style={{ margin: 0 }}>
                Every vendor's update appears on the Wall. However, <strong>non-verified vendors</strong> have blurred media and locked WhatsApp links until they complete NIN/ID verification.
              </p>
            </div>

            {/* Quick Safe Thrifting Tips */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                padding: '0.85rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                fontSize: '0.76rem',
                color: '#334155',
              }}
            >
              <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} color="#16a34a" /> Safe Thrift Shopping
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Look for the green <strong>Verified</strong> badge on vendor profiles.</li>
                <li>Chat directly on WhatsApp to confirm size, condition, and actual item photos.</li>
                <li>Report any suspicious listings or spam using the post flag icon.</li>
              </ul>
            </div>

            {/* Classic Early-Facebook Footer Links */}
            <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Link to="/how-it-works" style={{ color: '#64748b', textDecoration: 'none' }}>About</Link> ·
                <Link to="/safety-tips" style={{ color: '#64748b', textDecoration: 'none' }}>Safety</Link> ·
                <Link to="/vendor-policy" style={{ color: '#64748b', textDecoration: 'none' }}>Vendor Policy</Link> ·
                <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</Link> ·
                <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</Link>
              </div>
              <div>ThriftLink Marketplace © 2026</div>
            </div>

          </aside>

        </div>
      </div>

      {/* Preferences Modal (Instant Sync with Algorithm) */}
      <InterestSelectorModal
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        onSaved={() => loadFeedData(surface, 1, false)}
      />

      <Footer />
    </div>
  );
};

export default Home;
