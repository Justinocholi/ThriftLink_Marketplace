import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Truck, 
  Package, 
  MessageCircle, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  SlidersHorizontal, 
  Plus, 
  Check, 
  X, 
  MapPin, 
  CheckCircle2, 
  Store,
  ArrowRight
} from 'lucide-react';
import { userMe, recommendations as recApi } from '../../services/api';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';
import { ROUTES } from '../../routes';
import RecommendationCard from '../../components/RecommendationCard';
import InterestSelectorModal, { CATEGORIES_LIST, STYLES_LIST, LOCATIONS_LIST } from '../../components/InterestSelectorModal';

const STATUS_STYLE = {
  pending:   { background: '#fef3c7', color: '#b45309', label: 'Pending' },
  confirmed: { background: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
  shipped:   { background: '#ede9fe', color: '#6d28d9', label: 'Shipped' },
  delivered: { background: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled: { background: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

const SUGGESTED_QUICK_TAGS = [
  'Fashion & Clothing',
  'Shoes & Footwear',
  'Bags & Accessories',
  'Vintage & Retro',
  'Streetwear & Casual',
  'Lagos',
  'Abuja (FCT)',
];

const UserDashboard = () => {
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [userInterests, setUserInterests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [saveToast, setSaveToast] = useState('');

  const { data, loading, error, retry } = useFetch(
    async () => {
      const [orders, saved, interestsRes, profile] = await Promise.all([
        userMe.getOrders().catch(() => []),
        userMe.getSaved().catch(() => []),
        recApi.getUserInterests().catch(() => ({ interests: [] })),
        userMe.getProfile().catch(() => null),
      ]);
      return { 
        orders: Array.isArray(orders) ? orders : [], 
        saved: Array.isArray(saved) ? saved : [], 
        interests: Array.isArray(interestsRes?.interests) ? interestsRes.interests : [],
        profile
      };
    },
    []
  );

  useEffect(() => {
    if (data?.interests) {
      setUserInterests(data.interests);
    }
  }, [data?.interests]);

  // Load recommendations whenever interests or component mounts
  const loadRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await recApi.getRecommendations({ surface: 'recommended_for_you', limit: 4 });
      setRecommendations(Array.isArray(res.vendors) ? res.vendors : []);
    } catch (err) {
      console.error('Failed to load personalized recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Quick 1-click add or remove preference with immediate save
  const handleQuickToggle = async (tag) => {
    const isPresent = userInterests.includes(tag);
    const updated = isPresent
      ? userInterests.filter((t) => t !== tag)
      : [...userInterests, tag];

    setUserInterests(updated);
    setSaveToast(isPresent ? `Removed ${tag}` : `Saved ${tag}`);
    setTimeout(() => setSaveToast(''), 2200);

    try {
      await recApi.setUserInterests(updated);
      // Reload recommendations with newly saved preferences
      loadRecommendations();
    } catch (err) {
      console.error('Failed to save preference:', err);
    }
  };

  const handlePreferencesSaved = (updatedInterests) => {
    setUserInterests(updatedInterests);
    setSaveToast('Preferences updated & saved');
    setTimeout(() => setSaveToast(''), 2200);
    loadRecommendations();
  };

  const orders = data?.orders || [];
  const saved = data?.saved || [];
  const pendingCount = orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;
  const recent = orders.slice(0, 5);

  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div style={{ padding: '1rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .ud-main-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .ud-stats-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; margin-bottom: 1.25rem !important; }
          .ud-card { padding: 1.25rem !important; border-radius: 16px !important; }
          .ud-stat-value { font-size: 1.5rem !important; }
        }
      `}</style>

      {/* Hero Welcome — glossy brand banner */}
      <div className="tl-glossy-hero" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
            <span className="tl-glass-pill" style={{ color: 'white', background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', padding: '0.2rem 0.65rem' }}>
              <Sparkles size={13} /> Algorithmic Matching Active
            </span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.4rem' }}>
            Welcome back{data?.profile?.name ? `, ${data.profile.name.split(' ')[0]}` : ''}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem', margin: 0 }}>
            Here is your personalized thrift feed and account activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInterestModalOpen(true)}
          className="tl-glass-pill"
          style={{
            background: 'white',
            color: '#0f172a',
            padding: '0.75rem 1.4rem',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2)',
          }}
        >
          <SlidersHorizontal size={16} color="#059669" />
          Customize Feed Preferences
        </button>
      </div>

      {/* Floating Save Toast */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#0f172a',
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            fontSize: '0.85rem',
            fontWeight: 600,
            animation: 'tl-pop 0.25s ease-out',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Personalized Preferences Card (Saved directly on Dashboard) */}
      <div className="tl-glass-card" style={{ padding: '1.75rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Personalized Profile
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Auto-Saved</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Saved Thrifting Preferences
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: 0 }}>
              The ThriftLink algorithm prioritizes verified vendors selling items in your saved categories, style, and location.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInterestModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.45rem 1rem',
              borderRadius: 999,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <SlidersHorizontal size={14} />
            Edit All ({userInterests.length})
          </button>
        </div>

        {/* Active Interests Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {userInterests.length > 0 ? (
            userInterests.map((interest) => (
              <span
                key={interest}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.45rem 0.9rem',
                  borderRadius: 999,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#047857',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <Check size={13} strokeWidth={3} />
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => handleQuickToggle(interest)}
                  title="Remove"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.7,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic', padding: '0.25rem 0' }}>
              No preferences selected yet. Choose from the quick options below to calibrate your feed:
            </div>
          )}
        </div>

        {/* Quick Add Suggestions Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Quick Toggle:
          </span>
          {SUGGESTED_QUICK_TAGS.map((tag) => {
            const isSelected = userInterests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickToggle(tag)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 999,
                  border: isSelected ? '1px solid #10b981' : '1px dashed #cbd5e1',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : '#ffffff',
                  color: isSelected ? '#047857' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended For You Section (Directly on Buyer Dashboard) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tl-glass-pill" style={{ color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.65rem' }}>
                <Sparkles size={13} /> Algorithm Matched
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
              Recommended Vendors For You
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
              Curated verified thrift stores matching your saved interests, style, and browsing activity.
            </p>
          </div>

          <Link
            to={ROUTES.categories}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: '#059669',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Explore all stores <ArrowRight size={16} />
          </Link>
        </div>

        {recLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2" />
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Matching verified vendors to your preferences...</p>
          </div>
        ) : recommendations.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {recommendations.map((vendor, index) => (
              <RecommendationCard
                key={vendor.id}
                vendor={vendor}
                surface="recommended_for_you"
                position={index}
                rankingVersion={vendor.rankingVersion || 'v1.0'}
              />
            ))}
          </div>
        ) : (
          <div className="tl-glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Store size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Discovering New Verified Vendors
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 1.25rem' }}>
              Select more preferences above or browse categories to help the algorithm personalize your storefront recommendations.
            </p>
            <button
              type="button"
              onClick={() => setInterestModalOpen(true)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 999,
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Select Your Interests
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid — branded color tiles */}
      <div className="ud-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { to: ROUTES.user.orders, label: 'Total Orders',     value: loading ? '—' : orders.length,  icon: <Package size={26} />, tone: 'sky' },
          { to: ROUTES.user.saved,  label: 'Saved Items',      value: loading ? '—' : saved.length,   icon: <Heart size={26} />,   tone: 'coral' },
          { to: ROUTES.user.orders, label: 'Active Deliveries', value: loading ? '—' : pendingCount,   icon: <Truck size={26} />,   tone: 'green' },
        ].map((s, i) => (
          <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
            <div className={`tl-glass-stat brand-${s.tone}`} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className={`tl-stat-icon ${s.tone}`} style={{ marginBottom: 0 }}>{s.icon}</div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{s.label}</p>
                <h4 className="ud-stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Sections: Recent Purchases & Quick Actions */}
      <div className="ud-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Recent Purchases Section */}
        <div className="ud-card tl-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Clock size={20} color="#64748b" /> Recent Purchases
            </h4>
            <Link to={ROUTES.user.orders} style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>View All</Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(248, 250, 252, 0.7)', borderRadius: '16px' }}>
              <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <p style={{ color: '#64748b', fontWeight: '500' }}>No orders yet. Start exploring verified thrift shops!</p>
              <Link to={ROUTES.categories} style={{ display: 'inline-block', marginTop: '1rem', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>Browse Marketplace →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recent.map(order => {
                const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                return (
                  <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9', background: 'rgba(255, 255, 255, 0.6)' }}>
                    <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={24} color="#64748b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Order #{order.id.slice(0, 8)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>₦{Number(order.total_amount || 0).toLocaleString()}</div>
                      <span style={{ ...st, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="ud-card tl-glass-card" style={{ padding: '2rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem', margin: 0 }}>
              Quick Navigation
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
              <Link to={ROUTES.user.saved} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={16} color="#ef4444" /> Saved Items ({saved.length})
                </span>
                <ChevronRight size={18} />
              </Link>
              <Link to={ROUTES.user.profile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Manage Account & Location <ChevronRight size={18} />
              </Link>
              <Link to={ROUTES.user.messages} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Your Messages <ChevronRight size={18} />
              </Link>
              <Link to={ROUTES.user.support} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#334155', fontWeight: '600' }}>
                Help & Support <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '24px', padding: '2rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ fontWeight: '800', marginBottom: '0.5rem', margin: 0, fontSize: '1.1rem' }}>Support Local Thrift</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.92, lineHeight: '1.5', margin: '0.5rem 0 1.25rem' }}>
              Every follow, inquiry, and purchase empowers independent thrift sellers across Nigeria.
            </p>
            <Link 
              to={ROUTES.categories}
              style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '10px', color: '#047857', fontWeight: '700', textDecoration: 'none', fontSize: '0.85rem' }}
            >
              Browse Verified Thrift Stores
            </Link>
          </div>
        </div>

      </div>

      {/* Preferences Modal with Instant Save */}
      <InterestSelectorModal
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        onSaved={handlePreferencesSaved}
      />
    </div>
  );
};

export default UserDashboard;