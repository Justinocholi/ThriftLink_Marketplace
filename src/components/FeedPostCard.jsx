import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
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
  Lock,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import { recommendations as recApi, userMe } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/UIContext';
import { cldUrl } from '../utils/cloudinary';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #3b5998, #1d4ed8)',
  'linear-gradient(135deg, #ec4899, #be185d)',
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
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const FeedPostCard = ({ post, surface = 'recommended_for_you', onFollowChange = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openReport } = useAuthGate();

  const isVerified = Boolean(post?.is_verified);
  const isRestricted = !isVerified || Boolean(post?.is_restricted);

  const [isFollowing, setIsFollowing] = useState(Boolean(post?.isFollowed));
  const [followBusy, setFollowBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealRestrictedMedia, setRevealRestrictedMedia] = useState(false);
  const [showRestrictedNotice, setShowRestrictedNotice] = useState(false);

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
      : isVerified
      ? 'Recently added by a verified vendor'
      : 'Unverified Vendor — Restricted Preview';

  const isStatusPost = post.post_type === 'vendor_status' || String(post.id).startsWith('status-');

  const handleOpenPost = () => {
    recApi
      .trackEvent(post.vendor_id, 'post_view', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    if (isStatusPost) {
      navigate(`/vendor/${post.vendor_id}`);
    } else {
      navigate(`/product/${post.id}`);
    }
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
      if (isStatusPost) {
        await userMe.saveItem({ vendor_id: post.vendor_id });
      } else {
        await userMe.saveItem({ product_id: post.id });
      }
      await recApi.trackEvent(post.vendor_id, 'save', {
        productId: post.id,
        surface,
      });
    } catch {
      // ignore duplicate save
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
    const targetPath = isStatusPost ? `/vendor/${post.vendor_id}` : `/product/${post.id}`;
    const shareUrl = `${window.location.origin}${targetPath}?ref=tl_feed`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} by ${post.vendor_name} on ThriftLink`,
          text: `Check out "${post.name}" from ${post.vendor_name} on ThriftLink!`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleContactVendor = (e) => {
    e.stopPropagation();
    if (isRestricted) {
      setShowRestrictedNotice((prev) => !prev);
      return;
    }
    recApi
      .trackEvent(post.vendor_id, 'contact_click', {
        productId: post.id,
        surface,
      })
      .catch(() => {});
    const num = (post.whatsapp_number || '').replace(/\D/g, '');
    if (num) {
      const text = encodeURIComponent(
        `Hi ${post.vendor_name || 'there'}, I saw your update "${post.name}" (₦${Number(post.price || 0).toLocaleString()}) on the ThriftLink Feed. Is it still available?`
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
        targetType: isStatusPost ? 'vendor' : 'product',
        targetId: isStatusPost ? post.vendor_id : post.id,
        targetName: `${post.name} (${post.vendor_name})`,
      });
    }
  };

  return (
    <article
      style={{
        background: '#ffffff',
        border: isRestricted ? '1px solid #fcd34d' : '1px solid #d8dfea',
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Lucida Grande', Tahoma, sans-serif",
      }}
    >
      {/* Top Restricted Banner for Non-Verified Vendors */}
      {isRestricted ? (
        <div
          style={{
            background: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            padding: '0.45rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: '#92400e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <ShieldAlert size={14} color="#d97706" />
            <span>Unverified Vendor · Restricted Feed View</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#b45309' }}>
            Direct WhatsApp links disabled until vendor completes ID verification
          </span>
        </div>
      ) : (
        <div
          style={{
            background: '#f7f9fc',
            borderBottom: '1px solid #e9eef5',
            padding: '0.35rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#4b67a1',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={11} color="#16a34a" />
            {primaryReason}
          </span>
          <span style={{ color: '#64748b' }}>Verified Update</span>
        </div>
      )}

      {/* Classic Early-Facebook Wall Post Header */}
      <div
        style={{
          padding: '0.85rem 1rem 0.6rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          {/* Square-ish Classic Profile Picture — links directly to Vendor Profile */}
          <div
            onClick={handleOpenVendor}
            title={`View ${post.vendor_name || 'Vendor'}'s Shop Profile`}
            style={{
              width: 46,
              height: 46,
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              background: gradientFor(post.vendor_id),
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.95rem',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
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
            <div style={{ fontSize: '0.9rem', lineHeight: 1.35, color: '#334155' }}>
              <span
                onClick={handleOpenVendor}
                title={`View ${post.vendor_name || 'Vendor'}'s Shop Profile`}
                style={{
                  fontWeight: 800,
                  color: isRestricted ? '#475569' : '#1e3a8a',
                  cursor: 'pointer',
                  marginRight: 5,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                {post.vendor_name || 'Thrift Vendor'}
              </span>
              {isVerified ? (
                <span
                  title="Verified ThriftLink Vendor"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    verticalAlign: 'middle',
                    marginRight: 6,
                  }}
                >
                  <ShieldCheck size={15} color="#fff" fill="#16a34a" strokeWidth={2.2} />
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.08rem 0.45rem',
                    borderRadius: 3,
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    marginRight: 6,
                    verticalAlign: 'middle',
                  }}
                >
                  UNVERIFIED
                </span>
              )}
              <span style={{ color: '#64748b', fontSize: '0.84rem' }}>
                {isStatusPost
                  ? 'updated their shop profile on ThriftLink.'
                  : `posted a new item in ${post.category || post.vendor_category || 'Thrift Catalog'}.`}
              </span>
            </div>

            {/* Timestamp & Location Subline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.74rem',
                color: '#64748b',
                marginTop: 3,
                flexWrap: 'wrap',
              }}
            >
              <Globe size={11} color="#94a3b8" />
              <span>{formatTimeAgo(post.created_at)}</span>
              {post.vendor_state && (
                <>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <MapPin size={11} /> {post.vendor_state}
                  </span>
                </>
              )}
              {post.vendor_rating > 0 && (
                <>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 700, color: '#334155' }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    {Number(post.vendor_rating).toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Classic Follow Button */}
        <button
          type="button"
          onClick={handleFollowToggle}
          disabled={followBusy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '0.32rem 0.7rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: isFollowing ? '1px solid #16a34a' : '1px solid #cbd5e1',
            background: isFollowing ? '#dcfce7' : '#f8fafc',
            color: isFollowing ? '#166534' : '#334155',
            flexShrink: 0,
          }}
        >
          <Heart size={12} fill={isFollowing ? '#16a34a' : 'none'} color={isFollowing ? '#16a34a' : '#475569'} />
          {isFollowing ? 'Following' : '+ Follow'}
        </button>
      </div>

      {/* Post Status Text / Caption (Early Facebook Wall places status text ABOVE the attachment box) */}
      <div style={{ padding: '0 1rem 0.75rem' }}>
        <div
          onClick={handleOpenPost}
          style={{
            fontSize: '0.96rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: post.description ? '0.25rem' : 0,
            cursor: 'pointer',
          }}
        >
          {post.name}
          {post.price > 0 && (
            <span
              style={{
                marginLeft: 8,
                color: isRestricted ? '#64748b' : '#15803d',
                fontWeight: 800,
              }}
            >
              — ₦{Number(post.price).toLocaleString()}
            </span>
          )}
        </div>
        {post.description && (
          <p
            style={{
              fontSize: '0.86rem',
              color: '#334155',
              lineHeight: 1.5,
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {post.description}
          </p>
        )}
      </div>

      {/* Framed Media Attachment Box */}
      <div style={{ padding: '0 1rem 0.85rem' }}>
        <div
          style={{
            border: '1px solid #d8dfea',
            borderRadius: '4px',
            background: '#f8fafc',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {coverImage ? (
            <div
              onClick={() => {
                if (isRestricted && !revealRestrictedMedia) {
                  setRevealRestrictedMedia(true);
                } else {
                  handleOpenPost();
                }
              }}
              style={{
                position: 'relative',
                maxHeight: 340,
                background: '#e2e8f0',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <img
                src={cldUrl(coverImage, 700)}
                alt={post.name}
                style={{
                  width: '100%',
                  maxHeight: 340,
                  objectFit: 'cover',
                  display: 'block',
                  filter: isRestricted && !revealRestrictedMedia ? 'blur(12px) grayscale(35%)' : 'none',
                  transition: 'filter 0.25s ease',
                }}
              />

              {/* Restricted Media Overlay for Non-Verified Vendors */}
              {isRestricted && !revealRestrictedMedia && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.55)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <Lock size={26} color="#fbbf24" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
                    Restricted Post From Unverified Vendor
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.88)', maxWidth: 320, margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                    {post.vendor_name} has not completed ThriftLink verification yet. Media is blurred by default.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevealRestrictedMedia(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.42rem 0.9rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.18)',
                      color: 'white',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> Click to Reveal Image Preview
                  </button>
                </div>
              )}

              {isRestricted && revealRestrictedMedia && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealRestrictedMedia(false);
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0.28rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <EyeOff size={12} /> Hide Preview
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={handleOpenPost}
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                cursor: 'pointer',
                background: isRestricted ? '#fffbeb' : '#f8fafc',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '4px',
                  background: isRestricted ? '#fef3c7' : '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isRestricted ? '#d97706' : '#0284c7',
                  flexShrink: 0,
                }}
              >
                <Package size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  {post.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  {post.category || 'Thrift Catalog Update'} · Click to view details
                </div>
              </div>
            </div>
          )}

          {/* Classic Attachment Meta Footer Bar */}
          <div
            style={{
              padding: '0.55rem 0.85rem',
              background: '#f1f5f9',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 600 }}>
              <span>{post.category || post.vendor_category || 'Thrift Item'}</span>
              {post.condition && post.condition !== 'new_vendor' && (
                <>
                  <span>·</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    Condition: {String(post.condition).replace('_', ' ')}
                  </span>
                </>
              )}
            </div>
            {post.price > 0 && (
              <div style={{ fontWeight: 800, color: isRestricted ? '#475569' : '#15803d', fontSize: '0.88rem' }}>
                ₦{Number(post.price).toLocaleString()}
                {post.original_price > post.price && (
                  <span style={{ marginLeft: 6, color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.75rem' }}>
                    ₦{Number(post.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Restricted Notice when clicking locked contact on an unverified vendor */}
      {isRestricted && showRestrictedNotice && (
        <div
          style={{
            margin: '0 1rem 0.75rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '4px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            fontSize: '0.78rem',
            color: '#991b1b',
            lineHeight: 1.45,
          }}
        >
          <strong>Direct WhatsApp Contact Restricted:</strong> Because <strong>{post.vendor_name}</strong> has not completed ThriftLink verification yet, direct external WhatsApp links are disabled in the News Feed. You can still inspect their public catalog profile with caution.
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={handleOpenVendor}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid #dc2626',
                background: 'white',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
              }}
            >
              Inspect Unverified Profile Anyway →
            </button>
          </div>
        </div>
      )}

      {/* Classic Early-Facebook Bottom Action Strip */}
      <div
        style={{
          padding: '0.55rem 1rem',
          background: '#f7f8fa',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSavePost}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              border: '1px solid #d8dfea',
              background: isSaved ? '#fee2e2' : 'white',
              color: isSaved ? '#b91c1c' : '#1e3a8a',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Bookmark size={13} fill={isSaved ? '#b91c1c' : 'none'} />
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            type="button"
            onClick={handleOpenVendor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              border: '1px solid #d8dfea',
              background: 'white',
              color: '#1e3a8a',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Store size={13} />
            {isRestricted ? 'View Restricted Shop' : 'Browse Catalog'}
          </button>

          <button
            type="button"
            onClick={handleSharePost}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              border: '1px solid #d8dfea',
              background: copied ? '#dcfce7' : 'white',
              color: copied ? '#15803d' : '#1e3a8a',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? 'Link Copied' : 'Share'}
          </button>

          <button
            type="button"
            onClick={handleReportPost}
            title="Report post"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.35rem 0.55rem',
              borderRadius: '4px',
              border: '1px solid transparent',
              background: 'transparent',
              color: '#64748b',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Flag size={12} /> Report
          </button>
        </div>

        {/* Right Primary Contact Action */}
        {isRestricted ? (
          <button
            type="button"
            onClick={handleContactVendor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.4rem 0.85rem',
              borderRadius: '4px',
              border: '1px solid #fcd34d',
              background: '#fef3c7',
              color: '#92400e',
              fontWeight: 700,
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            <Lock size={13} />
            Contact Locked (Unverified)
          </button>
        ) : (
          <button
            type="button"
            onClick={handleContactVendor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.4rem 0.9rem',
              borderRadius: '4px',
              border: '1px solid #15803d',
              background: '#16a34a',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={14} />
            Enquire on WhatsApp
          </button>
        )}
      </div>
    </article>
  );
};

export default FeedPostCard;
