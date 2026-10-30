import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageCircle, Star, Heart, X, Sparkles, MapPin, Share2, Check } from 'lucide-react';
import { recommendations as recApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cldUrl } from '../utils/cloudinary';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
];

const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'TL';

const gradientFor = (id = '') => {
  let sum = 0;
  for (let i = 0; i < String(id).length; i++) sum += String(id).charCodeAt(i);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
};

const RecommendationCard = ({
  vendor,
  surface = 'recommended_for_you',
  position = 0,
  onDismiss = null,
  onFollowChange = null,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const impressionRecorded = useRef(false);

  // Check follow status if logged in
  useEffect(() => {
    if (user && vendor?.id) {
      recApi.getFollowStatus(vendor.id)
        .then((res) => setIsFollowing(Boolean(res.isFollowing)))
        .catch(() => {});
    }
  }, [user, vendor?.id]);

  // Record impression when card scrolls into viewport
  useEffect(() => {
    if (!cardRef.current || impressionRecorded.current || !vendor?.id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionRecorded.current) {
            impressionRecorded.current = true;
            recApi.trackImpressions([
              {
                vendorId: vendor.id,
                surface,
                position,
                score: vendor.score || 0,
                rankingVersion: vendor.rankingVersion || 'v1.0',
              },
            ]).catch(() => {});
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [vendor?.id, surface, position, vendor?.score, vendor?.rankingVersion]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setFollowingLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState); // optimistic
    try {
      if (nextState) {
        await recApi.follow(vendor.id);
      } else {
        await recApi.unfollow(vendor.id);
      }
      if (onFollowChange) onFollowChange(vendor.id, nextState);
    } catch {
      setIsFollowing(!nextState); // rollback
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleDismiss = async (e) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      await recApi.dismiss(vendor.id, 'not_interested');
      if (onDismiss) onDismiss(vendor.id);
    } catch {
      // non-blocking
    }
  };

  const handleNavigate = () => {
    recApi.trackEvent(vendor.id, 'profile_view', { surface, position }).catch(() => {});
    navigate(`/vendor/${vendor.id}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    recApi.trackEvent(vendor.id, 'contact_click', { surface, position }).catch(() => {});
    const num = (vendor.whatsapp_number || '').replace(/\D/g, '');
    if (num) {
      window.open(`https://wa.me/${num}`, '_blank');
    } else {
      navigate(`/vendor/${vendor.id}`);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    recApi.trackEvent(vendor.id, 'share', { surface, position }).catch(() => {});
    const shareUrl = `${window.location.origin}/vendor/${vendor.id}?ref=tl_share`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vendor.shop_name} on ThriftLink`,
          text: `Check out ${vendor.shop_name} (${vendor.category || 'Verified Thrift Vendor'}) on ThriftLink!`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  if (dismissed) return null;

  const cover = vendor.banner || vendor.logo;
  const reasons = Array.isArray(vendor.reasons) ? vendor.reasons : [];
  const primaryReason = reasons[0] || 'Verified Vendor';

  return (
    <div
      ref={cardRef}
      onClick={handleNavigate}
      className="tl-card tl-card-hover"
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'white',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      }}
    >
      {/* Top Banner / Cover */}
      <div
        style={{
          height: '100px',
          background: cover ? `url(${cldUrl(cover, 500)}) center/cover` : gradientFor(vendor.id),
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          title="Not interested"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.85)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
        >
          <X size={15} />
        </button>

        {/* Score or Match Pill */}
        {vendor.score ? (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.2rem 0.55rem',
              borderRadius: 999,
              background: 'rgba(22, 184, 101, 0.92)',
              color: 'white',
              fontSize: '0.72rem',
              fontWeight: 700,
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Sparkles size={12} />
            {vendor.score}% Match
          </div>
        ) : null}
      </div>

      {/* Profile Header & Avatar */}
      <div style={{ padding: '0 1.25rem', marginTop: '-36px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
              background: gradientFor(vendor.id),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {vendor.logo ? (
              <img src={cldUrl(vendor.logo, 150)} alt={vendor.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initialsOf(vendor.shop_name)
            )}
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollowToggle}
            disabled={followingLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.45rem 0.9rem',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isFollowing ? '1px solid #16b865' : '1px solid #d1d5db',
              background: isFollowing ? '#dcfce7' : 'white',
              color: isFollowing ? '#166534' : '#1f2937',
              transition: 'all 0.18s ease',
            }}
          >
            <Heart size={14} fill={isFollowing ? '#16b865' : 'none'} color={isFollowing ? '#16b865' : '#4b5563'} />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Shop Name & Verification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {vendor.shop_name}
          </h3>
          <span title="Verified Vendor" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <ShieldCheck size={17} color="#fff" fill="#16b865" strokeWidth={2.2} />
          </span>
        </div>

        {/* Rating, Category & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b', marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#0f172a' }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            {vendor.rating > 0 ? Number(vendor.rating).toFixed(1) : 'New'}
          </span>
          <span>•</span>
          <span>{vendor.category || 'Thrift Shop'}</span>
          {vendor.state && (
            <>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MapPin size={11} /> {vendor.state}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {vendor.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: 1.45,
              margin: '0 0 10px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {vendor.description}
          </p>
        )}

        {/* Explainability Reason Pill */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.25rem 0.65rem',
              borderRadius: 6,
              background: '#f1f5f9',
              color: '#334155',
              fontSize: '0.73rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} style={{ color: '#059669', flexShrink: 0 }} />
            <span>{primaryReason}</span>
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0.75rem 1.25rem 1rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={handleWhatsApp}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '0.55rem',
            borderRadius: 8,
            border: 'none',
            background: '#25D366',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'background 0.18s ease',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#1da851'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#25D366'; }}
        >
          <MessageCircle size={15} />
          WhatsApp
        </button>

        <button
          onClick={handleNavigate}
          style={{
            padding: '0.55rem 0.85rem',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#0f172a',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          View Store
        </button>

        <button
          onClick={handleShare}
          title="Share vendor profile"
          style={{
            padding: '0.55rem 0.65rem',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: copiedShare ? '#dcfce7' : 'white',
            color: copiedShare ? '#15803d' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copiedShare ? <Check size={15} /> : <Share2 size={15} />}
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;
