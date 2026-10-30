import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  Flag,
  Sparkles,
  MapPin,
  Store,
  Check,
  Package,
  Star,
} from 'lucide-react';
import { recommendations as recApi, userMe } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/UIContext';
import { cldUrl } from '../utils/cloudinary';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
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

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently posted';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const FeedPostCard = ({ post, surface = 'recommended_for_you', onFollowChange = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openReport } = useAuthGate();

  const [isFollowing, setIsFollowing] = useState(Boolean(post?.isFollowed));
  const [followBusy, setFollowBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const images = Array.isArray(post.images)
    ? post.images
    : (() => {
        try {
          return JSON.parse(post.images || '[]');
        } catch {
          return [];
        }
      })();
  const coverImage = images[0] || null;
  const primaryReason =
    Array.isArray(post.reasons) && post.reasons.length > 0
      ? post.reasons[0]
      : 'Recently added by a verified vendor';

  const handleOpenPost = () => {
    recApi
      .trackEvent(post.vendor_id, 'post_view', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    navigate(`/product/${post.id}`);
  };

  const handleOpenVendor = (e) => {
    e.stopPropagation();
    recApi
      .trackEvent(post.vendor_id, 'catalog_view', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    navigate(`/vendor/${post.vendor_id}`);
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setFollowBusy(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) {
        await recApi.follow(post.vendor_id);
      } else {
        await recApi.unfollow(post.vendor_id);
      }
      if (onFollowChange) onFollowChange(post.vendor_id, next);
    } catch {
      setIsFollowing(!next);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleSavePost = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setIsSaved(true);
    try {
      await userMe.saveItem({ product_id: post.id });
      await recApi.trackEvent(post.vendor_id, 'save', {
        productId: post.id,
        surface,
      });
    } catch {
      // ignore duplicate save errors
    }
  };

  const handleSharePost = async (e) => {
    e.stopPropagation();
    recApi
      .trackEvent(post.vendor_id, 'share', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    const shareUrl = `${window.location.origin}/product/${post.id}?ref=tl_feed`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} by ${post.vendor_name} on ThriftLink`,
          text: `Check out "${post.name}" (₦${Number(post.price || 0).toLocaleString()}) from verified vendor ${post.vendor_name} on ThriftLink!`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleContactVendor = (e) => {
    e.stopPropagation();
    recApi
      .trackEvent(post.vendor_id, 'contact_click', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    const num = (post.whatsapp_number || '').replace(/\D/g, '');
    if (num) {
      const text = encodeURIComponent(
        `Hi ${post.vendor_name || 'there'}, I saw your post "${post.name}" (₦${Number(post.price || 0).toLocaleString()}) on the ThriftLink News Feed. Is it still available?`
      );
      window.open(`https://wa.me/${num}?text=${text}`, '_blank');
    } else {
      navigate(`/vendor/${post.vendor_id}`);
    }
  };

  const handleReportPost = (e) => {
    e.stopPropagation();
    recApi
      .trackEvent(post.vendor_id, 'report', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    if (openReport) {
      openReport({
        targetType: 'product',
        targetId: post.id,
        targetName: `${post.name} (${post.vendor_name})`,
      });
    }
  };

  return (
    <article
      className="tl-card tl-card-hover"
      style={{
        background: 'white',
        borderRadius: '18px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 6px 24px -6px rgba(15, 23, 42, 0.07)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Vendor Header */}
      <div
        style={{
          padding: '0.9rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div
          onClick={handleOpenVendor}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            cursor: 'pointer',
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: gradientFor(post.vendor_id),
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.95rem',
              flexShrink: 0,
            }}
          >
            {post.vendor_logo ? (
              <img
                src={cldUrl(post.vendor_logo, 120)}
                alt={post.vendor_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initialsOf(post.vendor_name)
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {post.vendor_name || 'Verified Thrift Vendor'}
              </span>
              {post.is_verified && (
                <ShieldCheck
                  size={15}
                  color="#fff"
                  fill="#16b865"
                  strokeWidth={2.2}
                  style={{ flexShrink: 0 }}
                />
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.74rem',
                color: '#64748b',
                flexWrap: 'wrap',
              }}
            >
              {post.vendor_state && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <MapPin size={11} /> {post.vendor_state}
                </span>
              )}
              {post.vendor_rating > 0 && (
                <>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 700, color: '#0f172a' }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    {Number(post.vendor_rating).toFixed(1)}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Follow Vendor Button */}
        <button
          type="button"
          onClick={handleFollowToggle}
          disabled={followBusy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '0.38rem 0.8rem',
            borderRadius: 999,
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: isFollowing ? '1px solid #16b865' : '1px solid #cbd5e1',
            background: isFollowing ? '#dcfce7' : 'white',
            color: isFollowing ? '#15803d' : '#1e293b',
            flexShrink: 0,
          }}
        >
          <Heart size={13} fill={isFollowing ? '#16b865' : 'none'} color={isFollowing ? '#16b865' : '#475569'} />
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* 2. Post Image / Media */}
      <div
        onClick={handleOpenPost}
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          background: '#f1f5f9',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        {coverImage ? (
          <img
            src={cldUrl(coverImage, 600)}
            alt={post.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: 8,
            }}
          >
            <Package size={42} strokeWidth={1.5} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{post.category || 'Thrift Drop'}</span>
          </div>
        )}

        {/* Price Pill Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '0.35rem 0.8rem',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.92rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          ₦{Number(post.price || 0).toLocaleString()}
          {post.original_price > post.price && (
            <span
              style={{
                marginLeft: 6,
                fontSize: '0.75rem',
                color: '#94a3b8',
                textDecoration: 'line-through',
                fontWeight: 500,
              }}
            >
              ₦{Number(post.original_price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Category / Condition Badge */}
        {post.condition && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '0.25rem 0.65rem',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.92)',
              color: '#0f172a',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'capitalize',
            }}
          >
            {String(post.condition).replace('_', ' ')}
          </div>
        )}
      </div>

      {/* 3. Post Caption & Algorithmic Reason */}
      <div style={{ padding: '1rem 1.15rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Algorithmic Explanation Pill */}
        <div style={{ marginBottom: '0.55rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              background: '#f0fdf4',
              color: '#15803d',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <Sparkles size={11} />
            {primaryReason}
          </span>
        </div>

        <h3
          onClick={handleOpenPost}
          style={{
            fontSize: '1.02rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.35rem',
            cursor: 'pointer',
            lineHeight: 1.35,
          }}
        >
          {post.name}
        </h3>

        {post.description && (
          <p
            style={{
              fontSize: '0.83rem',
              color: '#475569',
              lineHeight: 1.5,
              margin: '0 0 0.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.description}
          </p>
        )}

        {/* Quick Action Row: Save, Share, Report */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleSavePost}
              title="Save post"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.35rem 0.65rem',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: isSaved ? '#fef2f2' : 'white',
                color: isSaved ? '#dc2626' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Bookmark size={13} fill={isSaved ? '#dc2626' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>

            <button
              type="button"
              onClick={handleSharePost}
              title="Share post"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.35rem 0.65rem',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: copied ? '#dcfce7' : 'white',
                color: copied ? '#15803d' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleReportPost}
            title="Report post"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.35rem 0.5rem',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.74rem',
              cursor: 'pointer',
            }}
          >
            <Flag size={13} />
          </button>
        </div>
      </div>

      {/* 4. Primary Journey CTA Footer: Browse Catalog or Contact Vendor */}
      <div
        style={{
          padding: '0.75rem 1.15rem 1rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: '0.6rem',
        }}
      >
        <button
          type="button"
          onClick={handleContactVendor}
          style={{
            flex: 1.2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '0.6rem 0.85rem',
            borderRadius: 10,
            border: 'none',
            background: '#25D366',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <MessageCircle size={15} />
          Enquire
        </button>

        <button
          type="button"
          onClick={handleOpenVendor}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '0.6rem 0.85rem',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          <Store size={14} />
          Browse Catalog
        </button>
      </div>
    </article>
  );
};

export default FeedPostCard;
