import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, PlusCircle, X, ShieldCheck, ShieldAlert, CheckCircle2, Store } from 'lucide-react';
import { vendorMe } from '../services/api';
import { prepareImageFilesForUpload } from '../utils/imageUpload';
import { normalizeProductToFeedPost } from '../utils/feedSiphon';

const CATEGORIES = [
  'Fashion & Clothing',
  'Bags & Accessories',
  'Shoes & Footwear',
  'Electronics',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Books & Education',
  'Sports & Fitness',
  'Baby & Kids',
  'General',
];

const CONDITIONS = [
  { value: 'good', label: 'Good (Thrift)' },
  { value: 'like-new', label: 'Like New' },
  { value: 'new', label: 'Brand New' },
  { value: 'fair', label: 'Fair' },
];

const UNVERIFIED_LIMIT = 3;

const VendorQuickPostBox = ({ onPostCreated, compact = false }) => {
  const [profile, setProfile] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [expanded, setExpanded] = useState(!compact);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('Fashion & Clothing');
  const [condition, setCondition] = useState('good');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      vendorMe.getProfile().catch(() => null),
      vendorMe.getProducts().catch(() => []),
    ]).then(([prof, prods]) => {
      if (!active) return;
      if (prof) {
        setProfile(prof);
        if (prof.category) setCategory(prof.category);
      }
      if (Array.isArray(prods)) {
        setProductCount(prods.length);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const isVerified = Boolean(profile?.is_verified) || profile?.verification_status === 'approved';
  const reachedCap = Boolean(profile) && !isVerified && productCount >= UNVERIFIED_LIMIT;

  const handleSelectFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setError('');
    const combinedRaw = [...imageFiles, ...selected].slice(0, 5);
    const processed = await prepareImageFilesForUpload(combinedRaw);
    setImageFiles(processed);
    setPreviews(processed.map((f) => URL.createObjectURL(f)));
    setExpanded(true);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    const nextFiles = imageFiles.filter((_, i) => i !== idx);
    const nextPreviews = previews.filter((_, i) => i !== idx);
    setImageFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const numericPrice = String(price).replace(/[^0-9.]/g, '');

    if (!cleanName || !numericPrice) {
      setError('Please enter both an item name and price (₦).');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', cleanName);
      fd.append('price', numericPrice);
      if (originalPrice) {
        const cleanOrig = String(originalPrice).replace(/[^0-9.]/g, '');
        if (cleanOrig) fd.append('original_price', cleanOrig);
      }
      fd.append('category', category || profile?.category || 'Fashion & Clothing');
      fd.append('condition', condition || 'good');
      if (description.trim()) fd.append('description', description.trim());
      fd.append('stock_quantity', '1');
      imageFiles.forEach((f) => fd.append('images', f));

      const created = await vendorMe.addProduct(fd);
      const feedPost = normalizeProductToFeedPost({
        ...created,
        vendor_profile_id: profile?.id || created.vendor_id,
        vendor_name: profile?.shop_name || 'Your Thrift Store',
        vendor_logo: profile?.logo || null,
        vendor_category: profile?.category || category,
        vendor_state: profile?.state || '',
        vendor_city: profile?.city || '',
        vendor_rating: profile?.rating || 0,
        vendor_reviews: profile?.total_reviews || 0,
        whatsapp_number: profile?.whatsapp_number || null,
        is_verified: isVerified ? 1 : 0,
      });

      setProductCount((c) => c + 1);
      setName('');
      setPrice('');
      setOriginalPrice('');
      setDescription('');
      setImageFiles([]);
      setPreviews([]);
      setSuccessMsg('Posted! Your item is now live on your store profile and the News Feed.');
      if (onPostCreated && feedPost) {
        onPostCreated(feedPost);
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Could not post item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(30, 58, 138, 0.07)',
      }}
    >
      {/* Royal Blue Composer Header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)',
          color: '#ffffff',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700 }}>
          <Store size={15} color="#86efac" />
          <span>
            Post as {profile?.shop_name || 'Vendor'} — Publish to Store & News Feed
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {profile && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.18rem 0.55rem',
                borderRadius: 999,
                background: isVerified ? 'rgba(34,197,94,0.22)' : 'rgba(251,191,36,0.22)',
                color: isVerified ? '#bbf7d0' : '#fef08a',
                border: isVerified ? '1px solid rgba(134,239,172,0.4)' : '1px solid rgba(253,224,71,0.4)',
              }}
            >
              {isVerified ? (
                <>
                  <ShieldCheck size={12} /> Verified Priority
                </>
              ) : (
                <>
                  <ShieldAlert size={12} /> {Math.min(productCount, UNVERIFIED_LIMIT)}/{UNVERIFIED_LIMIT} Unverified Slots
                </>
              )}
            </span>
          )}
          {profile?.id && (
            <Link
              to={`/vendor/${profile.id}`}
              style={{
                fontSize: '0.72rem',
                color: '#dbeafe',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              View My Store
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: '0.9rem 1rem' }}>
        {reachedCap && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>
              Unverified stores can post up to {UNVERIFIED_LIMIT} active items. Verify your shop for unlimited posts & priority feed ranking.
            </span>
            <Link
              to="/vendor/profile"
              style={{
                background: '#1e3a8a',
                color: 'white',
                padding: '0.32rem 0.7rem',
                borderRadius: 4,
                fontSize: '0.74rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Complete KYC
            </Link>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#166534',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            {error}
          </div>
        )}

        {!expanded ? (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              readOnly
              onFocus={() => setExpanded(true)}
              onClick={() => setExpanded(true)}
              placeholder="Upload a new thrift item (handbag, sneakers, vintage shirt) to your store & the News Feed..."
              style={{
                flex: 1,
                minWidth: 210,
                padding: '0.62rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#f8fafc',
                fontSize: '0.84rem',
                color: '#334155',
                cursor: 'pointer',
              }}
            />
            <label
              htmlFor="quick-vendor-photo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1e3a8a',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Camera size={15} /> Add Photo
            </label>
            <input
              id="quick-vendor-photo"
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelectFiles}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#16a34a',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={15} /> New Post
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.7rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.65rem',
              }}
            >
              <input
                type="text"
                placeholder="Item name * (e.g. Vintage Leather Bag)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  padding: '0.62rem 0.8rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Price (₦) * e.g. 8500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{
                  padding: '0.62rem 0.8rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.65rem',
              }}
            >
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.83rem',
                  background: '#ffffff',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.83rem',
                  background: '#ffffff',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Old price ₦ (optional)"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.83rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <textarea
              rows={2}
              placeholder="Describe size, condition, brand, or delivery details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '0.62rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.84rem',
                resize: 'vertical',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            {previews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: 68,
                      height: 68,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(15,23,42,0.75)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                paddingTop: '0.2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label
                  htmlFor="quick-vendor-photo-expanded"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.48rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#1e3a8a',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={15} /> {previews.length > 0 ? `Photos (${previews.length}/5)` : 'Upload Photos (up to 5)'}
                </label>
                <input
                  id="quick-vendor-photo-expanded"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSelectFiles}
                  style={{ display: 'none' }}
                />
                {compact && (
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    style={{
                      padding: '0.48rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    Collapse
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || reachedCap}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: submitting || reachedCap ? '#94a3b8' : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: submitting || reachedCap ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                }}
              >
                <PlusCircle size={15} />
                {submitting ? 'Publishing...' : 'Publish to Store & Feed'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VendorQuickPostBox;
