import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ReviewSection from '../../components/ReviewSection';
import { vendors as vendorsApi, reviews as reviewsApi, userMe } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/UIContext';
import { Flag } from 'lucide-react';
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

  useEffect(() => {
    vendorsApi.get(id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWhatsApp = async () => {
    if (!data?.vendor?.whatsapp_number) return;
    try { await vendorsApi.trackWhatsapp(id); } catch { /* non-critical */ }
    const num = data.vendor.whatsapp_number.replace(/\D/g, '');
    window.open(`https://wa.me/${num}`, '_blank');
  };

  const handleSaveVendor = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      await userMe.saveItem({ vendor_id: id });
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
      <div className="vpp-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '4rem 2rem 2rem' }}>
        <div className="vpp-header-inner" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="vpp-avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
            {vendor.logo
              ? <img src={vendor.logo} alt={vendor.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 className="vpp-name" style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>{vendor.shop_name}</h1>
              {vendor.is_verified === 1 && (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <img src={checklistIcon} alt="Verified" style={{ width: '14px', height: '14px' }} />
                  Verified Vendor
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <img src={starIcon} alt="Star" style={{ width: '16px', height: '16px' }} />
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                <span>({vendor.total_reviews} review{vendor.total_reviews !== 1 ? 's' : ''})</span>
              </div>
              {vendor.state && <><span>•</span><span>📍 {vendor.state}{vendor.city ? `, ${vendor.city}` : ''}</span></>}
              {vendor.category && <><span>•</span><span>{vendor.category}</span></>}
            </div>

            {vendor.description && (
              <p style={{ maxWidth: '600px', color: '#4b5563', lineHeight: '1.6', marginBottom: '1.5rem' }}>{vendor.description}</p>
            )}

            <div className="vpp-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleWhatsApp} style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={whatsappIcon} alt="WA" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                Contact on WhatsApp
              </button>
              <button onClick={handleSaveVendor} disabled={saving} style={{ background: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={heartIcon} alt="Heart" style={{ width: '20px', height: '20px' }} />
                {saveMsg || 'Save Vendor'}
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
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}
                >
                  <div className="vpp-img" style={{ height: '200px', background: '#f3f4f6', overflow: 'hidden' }}>
                    {images[0]
                      ? <img src={images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📦</div>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>{product.name}</h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#25D366', marginBottom: '0.25rem' }}>₦{Number(product.price).toLocaleString()}</div>
                    {product.original_price && (
                      <div style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'line-through' }}>₦{Number(product.original_price).toLocaleString()}</div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {product.condition?.replace('_', ' ')} • {product.views || 0} views
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ReviewSection reviews={reviews} title="Vendor Reviews" />
      </div>

      <Footer />
    </div>
  );
};

export default VendorPublicProfile;
