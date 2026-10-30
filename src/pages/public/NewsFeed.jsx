import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeedPostCard from '../../components/FeedPostCard';
import InterestSelectorModal from '../../components/InterestSelectorModal';
import { recommendations as recApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cldUrl } from '../../utils/cloudinary';
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
  ShieldCheck,
  ShieldAlert,
  Globe,
  PlusCircle,
} from 'lucide-react';
import { ROUTES } from '../../routes';

const NewsFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surface, setSurface] = useState('new_arrivals'); // default to chronological 'All Updates' wall
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all' | 'verified' | 'restricted'
  const [posts, setPosts] = useState([]);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [interestModalOpen, setInterestModalOpen] = useState(false);

  const loadFeed = useCallback(async (activeSurface = surface) => {
    setLoading(true);
    try {
      const [feedRes, vendorRes] = await Promise.all([
        recApi.getFeed({ surface: activeSurface, limit: 30 }).catch(() => ({ posts: [] })),
        recApi.getVendors({ surface: 'recommended_for_you', limit: 6 }).catch(() => ({ vendors: [] })),
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

  const filteredPosts = posts.filter((p) => {
    if (verificationFilter === 'verified' && !p.is_verified) return false;
    if (verificationFilter === 'restricted' && p.is_verified) return false;
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      const match =
        (p.category || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const verifiedCount = posts.filter((p) => p.is_verified).length;
  const restrictedCount = posts.filter((p) => !p.is_verified).length;

  return (
    <div style={{ fontFamily: "'Inter', 'Lucida Grande', Tahoma, sans-serif", background: '#edeff4', minHeight: '100vh', color: '#1e293b' }}>
      <style>{`
        .fb-wall-layout {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr) 280px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .fb-wall-layout {
            grid-template-columns: 200px minmax(0, 1fr);
          }
          .fb-right-col {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 768px) {
          .fb-wall-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      {/* Classic Early-Facebook Top Banner Bar */}
      <div
        style={{
          paddingTop: '5.25rem',
          background: '#1e3a8a',
          borderBottom: '1px solid #172554',
          color: 'white',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={20} color="#4ade80" />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'white' }}>
                ThriftLink Wall & Vendor News Feed
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.82)', margin: 0 }}>
                Live updates from every vendor across Nigeria · Non-verified vendors are shown in restricted mode
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setInterestModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.4rem 0.85rem',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={13} /> Feed Preferences
            </button>
            <Link
              to="/vendor/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.4rem 0.85rem',
                borderRadius: 4,
                background: '#16a34a',
                border: '1px solid #15803d',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.78rem',
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={13} /> Post Vendor Update
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Early-Facebook Wall Container */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '1.25rem 1rem 4rem' }}>
        <div className="fb-wall-layout">
          {/* LEFT SIDEBAR: Navigation & Feed Views */}
          <aside
            style={{
              background: '#ffffff',
              border: '1px solid #d8dfea',
              borderRadius: '4px',
              padding: '0.75rem',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.25rem 0.5rem 0.5rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '0.5rem',
              }}
            >
              News Feed Streams
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { id: 'new_arrivals', label: 'All Vendor Updates', Icon: Globe },
                { id: 'recommended_for_you', label: 'For You (Ranked)', Icon: Sparkles },
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
                      padding: '0.5rem 0.6rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: active ? '#d8dfea' : 'transparent',
                      color: active ? '#1e3a8a' : '#334155',
                      fontWeight: active ? 800 : 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={15} color={active ? '#1e3a8a' : '#64748b'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.75rem 0.5rem 0.4rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '0.5rem',
              }}
            >
              Verification Filter
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { id: 'all', label: `Every Vendor (${posts.length})`, Icon: Layers },
                { id: 'verified', label: `Verified (${verifiedCount})`, Icon: ShieldCheck },
                { id: 'restricted', label: `Unverified / Restricted (${restrictedCount})`, Icon: ShieldAlert },
              ].map(({ id, label, Icon }) => {
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
                    <Icon size={14} color={id === 'restricted' ? '#d97706' : id === 'verified' ? '#16a34a' : '#64748b'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.75rem 0.5rem 0.4rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '0.5rem',
              }}
            >
              Shortcuts
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
              <Link to="/category/all" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                <Compass size={14} /> Discover Directory
              </Link>
              <Link to={ROUTES.user.saved} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                <Bookmark size={14} /> Saved Posts & Items
              </Link>
              <Link to={ROUTES.messages} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>
                <MessageCircle size={14} /> Messages & Enquiries
              </Link>
            </div>
          </aside>

          {/* CENTER COLUMN: THE WALL (Single-Column Chronological & Ranked Vendor Stream) */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Classic Status Update Composer Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#f1f5f9',
                  borderBottom: '1px solid #d8dfea',
                  padding: '0.45rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                }}
              >
                <span>Update Status · Post New Thrift Arrival</span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>
                  Showing {filteredPosts.length} updates
                </span>
              </div>
              <div style={{ padding: '0.75rem 0.9rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  onClick={() => navigate(user?.role === 'vendor' ? '/vendor/products' : '/login')}
                  placeholder="Are you a thrift vendor? Share a new catalog drop or status update on the Wall..."
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate(user?.role === 'vendor' ? '/vendor/products' : '/login')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid #1e3a8a',
                    background: '#1e3a8a',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Share Update
                </button>
              </div>

              {/* Category Filter Strip inside Composer */}
              <div
                style={{
                  padding: '0.45rem 0.9rem',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>Topic:</span>
                {['', 'Fashion', 'Shoes', 'Bags', 'Vintage', 'Electronics'].map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat || 'all'}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '3px',
                        border: active ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
                        background: active ? '#1e3a8a' : 'white',
                        color: active ? 'white' : '#475569',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {cat || 'All Updates'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wall Posts Stream */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="tl-skeleton" style={{ height: 320, borderRadius: 4 }} />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                style={{
                  background: 'white',
                  border: '1px solid #d8dfea',
                  borderRadius: '4px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                  No updates match this filter
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1rem' }}>
                  Switch back to "All Vendor Updates" to see every verified and restricted vendor update.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationFilter('all');
                    setCategoryFilter('');
                    setSurface('new_arrivals');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 4,
                    border: '1px solid #1e3a8a',
                    background: '#1e3a8a',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Show All Vendor Updates
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
          </main>

          {/* RIGHT SIDEBAR: Who to Follow & Restricted Vendor Policy */}
          <aside className="fb-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Restricted Mode Explanation Box */}
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '4px',
                padding: '0.85rem',
                fontSize: '0.78rem',
                color: '#92400e',
                lineHeight: 1.45,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, marginBottom: '0.35rem' }}>
                <ShieldAlert size={15} color="#d97706" />
                <span>Why Some Posts Are Restricted</span>
              </div>
              <p style={{ margin: 0 }}>
                Every vendor's new update appears on the ThriftLink Wall, but <strong>non-verified vendors</strong> are shown in a restricted mode (blurred media preview & locked WhatsApp link) until they complete NIN + ID verification.
              </p>
            </div>

            {/* Classic "Vendors You May Like" Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8dfea',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#f1f5f9',
                  borderBottom: '1px solid #d8dfea',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: '#334155',
                }}
              >
                <span>Verified Vendors to Follow</span>
                <Link to="/verified-vendors" style={{ color: '#1e3a8a', textDecoration: 'none', fontSize: '0.72rem' }}>
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
                      gap: '0.5rem',
                      paddingBottom: '0.55rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      onClick={() => navigate(`/vendor/${v.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', minWidth: 0, flex: 1 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '4px',
                          background: '#1e3a8a',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {v.logo ? (
                          <img src={cldUrl(v.logo, 80)} alt={v.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          String(v.shop_name || 'TL').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{v.shop_name}</span>
                          <ShieldCheck size={12} color="#fff" fill="#16a34a" />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {v.category || 'Thrift Shop'} {v.state ? `· ${v.state}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/vendor/${v.id}`)}
                      style={{
                        padding: '0.25rem 0.55rem',
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
          </aside>
        </div>
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
