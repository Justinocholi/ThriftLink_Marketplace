import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, Users, X, Check, MapPin, Store, ChevronRight } from 'lucide-react';
import { recommendations as recApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cldUrl } from '../utils/cloudinary';

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

const InFeedSuggestedVendors = ({
  vendors = [],
  surface = 'recommended_for_you',
  title = 'Suggested Thrift Vendors For You',
  subtitle = 'Discover verified Nigerian sellers matching your style and interests',
  onFollowChange = null,
  onDismiss = null,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [followingMap, setFollowingMap] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [dismissedMap, setDismissedMap] = useState({});

  if (!Array.isArray(vendors) || vendors.length === 0) return null;

  const visibleVendors = vendors.filter((v) => !dismissedMap[v.id]);
  if (visibleVendors.length === 0) return null;

  const handleFollowToggle = async (e, vendor) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const vendorId = vendor.id;
    const isCurrentlyFollowing = Boolean(followingMap[vendorId] ?? vendor.isFollowed);
    const nextState = !isCurrentlyFollowing;

    setBusyMap((prev) => ({ ...prev, [vendorId]: true }));
    setFollowingMap((prev) => ({ ...prev, [vendorId]: nextState }));

    try {
      if (nextState) {
        await recApi.follow(vendorId);
      } else {
        await recApi.unfollow(vendorId);
      }
      if (onFollowChange) onFollowChange(vendorId, nextState);
    } catch {
      setFollowingMap((prev) => ({ ...prev, [vendorId]: isCurrentlyFollowing }));
    } finally {
      setBusyMap((prev) => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleDismiss = (e, vendorId) => {
    e.stopPropagation();
    setDismissedMap((prev) => ({ ...prev, [vendorId]: true }));
    if (onDismiss) onDismiss(vendorId);
    recApi.dismissVendor(vendorId).catch(() => {});
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #d8dfea',
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Lucida Grande', Tahoma, sans-serif",
      }}
    >
      {/* Early-Facebook Styled In-Feed Header */}
      <div
        style={{
          background: '#f0f2f5',
          borderBottom: '1px solid #d8dfea',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#e7f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1877f2',
            }}
          >
            <Users size={15} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#1e3a8a',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h4>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
              {subtitle}
            </p>
          </div>
        </div>

        <Link
          to="/verified-vendors"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#1877f2',
            textDecoration: 'none',
          }}
        >
          See All <ChevronRight size={13} />
        </Link>
      </div>

      {/* Horizontal Carousel Tray of Suggested Vendors */}
      <div
        style={{
          padding: '0.9rem 1rem',
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(190px, 210px)',
          gap: '0.85rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleVendors.map((vendor) => {
          const isFollowed = Boolean(followingMap[vendor.id] ?? vendor.isFollowed);
          const isBusy = Boolean(busyMap[vendor.id]);
          const ratingVal = Number(vendor.rating || 0);

          return (
            <div
              key={vendor.id}
              onClick={() => navigate(`/vendor/${vendor.id}`)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.85rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Dismiss Button */}
              <button
                type="button"
                aria-label="Dismiss suggestion"
                onClick={(e) => handleDismiss(e, vendor.id)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={13} />
              </button>

              {/* Vendor Profile Avatar with Verified Badge */}
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: vendor.logo
                      ? `url(${cldUrl(vendor.logo, 120)}) center/cover`
                      : gradientFor(vendor.id),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    border: '2px solid #ffffff',
                  }}
                >
                  {!vendor.logo && initialsOf(vendor.shop_name)}
                </div>
                {Boolean(vendor.is_verified) && (
                  <span
                    title="Verified Vendor"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: '#16a34a',
                      borderRadius: '50%',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                    }}
                  >
                    <ShieldCheck size={11} color="#ffffff" />
                  </span>
                )}
              </div>

              {/* Vendor Shop Name */}
              <h5
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  margin: '0 0 2px',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {vendor.shop_name}
              </h5>

              {/* Category & State */}
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  marginBottom: '0.45rem',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {vendor.category || 'Thrift Store'}
                {vendor.state ? ` · ${vendor.state}` : ''}
              </div>

              {/* Rating */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '0.72rem',
                  color: '#b45309',
                  fontWeight: 600,
                  marginBottom: '0.65rem',
                }}
              >
                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                <span>{ratingVal > 0 ? ratingVal.toFixed(1) : 'New'}</span>
                {vendor.total_reviews ? (
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                    ({vendor.total_reviews})
                  </span>
                ) : null}
              </div>

              {/* Action Buttons: Follow & Visit */}
              <div style={{ display: 'flex', gap: 4, width: '100%', marginTop: 'auto' }}>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={(e) => handleFollowToggle(e, vendor)}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    border: isFollowed ? '1px solid #86efac' : '1px solid #1877f2',
                    background: isFollowed ? '#dcfce7' : '#1877f2',
                    color: isFollowed ? '#166534' : '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: isBusy ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isFollowed ? (
                    <>
                      <Check size={11} /> Following
                    </>
                  ) : (
                    '+ Follow'
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/vendor/${vendor.id}`);
                  }}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InFeedSuggestedVendors;
