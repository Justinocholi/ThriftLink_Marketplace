import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ReviewSection from '../../components/ReviewSection';
import RecommendationCard from '../../components/RecommendationCard';
import { vendors as vendorsApi, reviews as reviewsApi, userMe, recommendations as recApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/UIContext';
import { Flag, Share2, Heart, Check, Users, MapPin, Package, ShieldCheck, Clock, Info } from 'lucide-react';
import { cldUrl } from '../../utils/cloudinary';
import VendorQuickPostBox from '../../components/VendorQuickPostBox';
import checklistIcon from '../../assets/checklist.png';
import starIcon from '../../assets/star.png';
import whatsappIcon from '../../assets/whatsapp (1).png';
import heartIcon from '../../assets/heart.png';

const VendorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openReport } = useAuthGate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [similarVendors, setSimilarVendors] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    vendorsApi.get(id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Log recommendation profile view
    recApi.trackEvent(id, 'profile_view', { surface: 'direct_profile' }).catch(() => {});

    // Check referral attribution if link has ?ref=
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('ref');
      if (ref) {
        recApi.trackReferral(ref, { targetVendorId: id }).catch(() => {});
        localStorage.setItem('tl_referral_code', ref);
      }
    } catch {}

    // Check follow status & count
    recApi.getFollowStatus(id)
      .then(res => {
        setIsFollowing(Boolean(res.isFollowing));
        setFollowerCount(Number(res.followerCount || 0));
      })
      .catch(() => {});

    // Fetch Surface 4.3: Similar Vendors
    setSimilarLoading(true);
    recApi.getSimilar(id, 4)
      .then(res => setSimilarVendors(Array.isArray(res.vendors) ? res.vendors : []))
      .catch(() => setSimilarVendors([]))
      .finally(() => setSimilarLoading(false));
  }, [id]);

  const handleWhatsApp = async () => {
    if (!data?.vendor?.whatsapp_number) return;
    try {
      await vendorsApi.trackWhatsapp(id);
      await recApi.trackEvent(id, 'contact_click', { surface: 'vendor_profile' });
    } catch { /* non-critical */ }
    const num = data.vendor.whatsapp_number.replace(/\D/g, '');
    window.open(`https://wa.me/${num}`, '_blank');
  };

  const handleFollowToggle = async () => {
    if (!user) { navigate('/login'); return; }
    setFollowingLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount(prev => Math.max(0, prev + (nextState ? 1 : -1)));
    try {
      if (nextState) {
        await recApi.follow(id);
      } else {
        await recApi.unfollow(id);
      }
    } catch {
      setIsFollowing(!nextState);
      setFollowerCount(prev => Math.max(0, prev + (nextState ? -1 : 1)));
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleShare = async () => {
    const vendorName = data?.vendor?.shop_name || 'Thrift Shop';
    const refCode = data?.vendor?.referral_code || id;
    const shareUrl = `${window.location.origin}/vendor/${id}?ref=${encodeURIComponent(refCode)}`;
    recApi.trackEvent(id, 'share', { surface: 'vendor_profile' }).catch(() => {});

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vendorName} on ThriftLink`,
          text: `Check out ${vendorName} on ThriftLink — verified WhatsApp thrift vendor in Nigeria!`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fall back to clipboard if user dismissed or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2500);
    } catch {
      setShareMsg('Failed to copy');
    }
  };

  const handleSaveVendor = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      await userMe.saveItem({ vendor_id: id });
      await recApi.trackEvent(id, 'save', { surface: 'vendor_profile' });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>Loading vendor profile...</div>
      <Footer />
    </div>
  );

  if (error || !data) return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#dc2626' }}>{error || 'Vendor not found'}</div>
      <Footer />
    </div>
  );

  const { vendor, products = [] } = data;
  const reviews = (data.reviews || []).map(r => ({
    ...r,
    user: r.user_name || 'User',
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
    avatar: r.avatar || null,
  }));
  const initials = vendor.shop_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'V';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .vpp-header { padding: 5rem 1rem 1.5rem !important; }
          .vpp-header-inner { gap: 1.25rem !important; }
          .vpp-avatar { width: 88px !important; height: 88px !important; font-size: 1.75rem !important; }
          .vpp-name { font-size: clamp(1.4rem, 5vw, 2rem) !important; }
          .vpp-actions { width: 100%; }
          .vpp-actions button { flex: 1 1 auto; justify-content: center; min-width: 0 !important; }
          .vpp-body { padding: 2rem 1rem !important; }
          .vpp-products { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 1rem !important; }
          .vpp-products .vpp-img { height: 140px !important; }
        }
        @media (max-width: 480px) {
          .vpp-actions { flex-direction: column !important; }
          .vpp-actions button { width: 100%; }
        }
      `}</style>
      <Navbar />

      {/* Vendor Header */}
      <div className="vpp-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '4rem 2rem 2rem', position: 'relative' }}>
        {/* Royal Blue + Green top accent strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 45%, #25D366 100%)' }} />
        <div className="vpp-header-inner" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="vpp-avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #1e3a8a, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 'bold', border: '3px solid #eff6ff', boxShadow: '0 8px 24px -6px rgba(30, 58, 138, 0.25)' }}>
            {vendor.logo
              ? <img src={cldUrl(vendor.logo, 240)} alt={vendor.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 className="vpp-name" style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>{vendor.shop_name}</h1>
              {Boolean(vendor.is_verified) && (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} color="#166534" />
                  Verified Vendor
                </span>
              )}
              {products.length > 0 && (
                <span style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} color="#1e3a8a" />
                  Active Catalog • Typically responds to enquiries
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <img src={starIcon} alt="Star" style={{ width: '16px', height: '16px' }} />
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                <span>({vendor.total_reviews} review{vendor.total_reviews !== 1 ? 's' : ''})</span>
              </div>
              {vendor.state && <><span>•</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="#6b7280" /> {vendor.state}{vendor.city ? `, ${vendor.city}` : ''}</span></>}
              {vendor.category && <><span>•</span><span>{vendor.category}</span></>}
            </div>

            {vendor.description && (
              <p style={{ maxWidth: '600px', color: '#4b5563', lineHeight: '1.6', marginBottom: '1.25rem' }}>{vendor.description}</p>
            )}

            {/* Honest Verification Disclaimer (Section 2 — Trust & Safety) */}
            {Boolean(vendor.is_verified) && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                maxWidth: '640px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                color: '#475569',
                lineHeight: 1.45,
              }}>
                <Info size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Verification Scope:</strong> ThriftLink verification confirms vendor identity and business details; it does not guarantee product quality, delivery, or transaction outcomes. Always inspect items and chat with the vendor before paying.
                </span>
              </div>
            )}

            <div className="vpp-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleWhatsApp} style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={whatsappIcon} alt="WA" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                Contact on WhatsApp
              </button>
              <button
                onClick={handleFollowToggle}
                disabled={followingLoading}
                style={{
                  background: isFollowing ? '#dcfce7' : 'white',
                  border: isFollowing ? '1px solid #16b865' : '1px solid #d1d5db',
                  color: isFollowing ? '#166534' : '#374151',
                  padding: '0.8rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Heart size={18} fill={isFollowing ? '#16b865' : 'none'} color={isFollowing ? '#16b865' : '#4b5563'} />
                {isFollowing ? 'Following' : 'Follow'}
                {followerCount > 0 && <span style={{ opacity: 0.75, fontSize: '0.85rem' }}>({followerCount})</span>}
              </button>
              <button
                onClick={handleShare}
                style={{
                  background: 'white',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  padding: '0.8rem 1.3rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Share2 size={18} />
                {shareMsg || 'Share Shop'}
              </button>
              <button onClick={handleSaveVendor} disabled={saving} style={{ background: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '0.8rem 1.3rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={heartIcon} alt="Heart" style={{ width: '20px', height: '20px' }} />
                {saveMsg || 'Save'}
              </button>
              <button
                onClick={() => openReport({ targetType: 'vendor', targetId: id, targetName: vendor.shop_name })}
                style={{ background: 'white', border: '1px solid #fecaca', color: '#dc2626', padding: '0.8rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="Report this vendor"
              >
                <Flag size={18} />
                Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="vpp-body" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* If vendor is viewing their own profile, give them direct posting capability */}
        {user?.role === 'vendor' && (user?.id === vendor?.user_id || user?.id === vendor?.id) && (
          <div style={{ marginBottom: '2.5rem' }}>
            <VendorQuickPostBox compact onPostCreated={() => vendorsApi.get(id).then(setData)} />
          </div>
        )}

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>
          Products ({products.length})
        </h2>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
            No products listed yet
          </div>
        ) : (
          <div className="vpp-products" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {products.map(product => {
              const images = (() => { try { return JSON.parse(product.images || '[]'); } catch { return []; } })();
              return (
                <div key={product.id}
                  onClick={() => {
                    recApi.trackEvent(id, 'post_view', { productId: product.id, surface: 'vendor_catalog' }).catch(() => {});
                    navigate(`/product/${product.id}`);
                  }}
                  style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}
                >
                  <div className="vpp-img" style={{ height: '200px', background: '#f3f4f6', overflow: 'hidden' }}>
                    {images[0]
                      ? <img src={cldUrl(images[0], 500)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><Package size={40} strokeWidth={1.5} /></div>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>{product.name}</h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#25D366', marginBottom: '0.25rem' }}>₦{Number(product.price).toLocaleString()}</div>
                    {product.original_price && (
                      <div style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'line-through' }}>₦{Number(product.original_price).toLocaleString()}</div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {product.condition?.replace(/[-_]/g, ' ')} • {product.views || 0} views
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ReviewSection reviews={reviews} title="Vendor Reviews" />

        {/* Surface 4.3: Similar Vendors */}
        {similarVendors.length > 0 && (
          <div style={{ marginTop: '3.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937', margin: '0 0 0.35rem' }}>
                Similar Thrift Vendors
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Discover other verified sellers with similar catalogs and collections.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {similarVendors.map((sv, idx) => (
                <RecommendationCard key={sv.id} vendor={sv} surface="similar" position={idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VendorPublicProfile;
