import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Package, X, CheckCircle2, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import { vendorMe } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';
import { ROUTES } from '../../routes';
import { prepareImageFilesForUpload } from '../../utils/imageUpload';
import { cldUrl } from '../../utils/cloudinary';

const CATEGORIES = [
  'Fashion & Clothing', 'Bags & Accessories', 'Shoes & Footwear', 'Electronics',
  'Beauty & Skincare', 'Home & Kitchen', 'Books & Education', 'Sports & Fitness',
  'Baby & Kids', 'Food & Drinks', 'Real Estate', 'Automobiles', 'General',
];

const CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good (Thrift)' },
  { value: 'fair', label: 'Fair' },
];

const UNVERIFIED_LIMIT = 3;

const VendorProducts = () => {
  const {
    data: productsData,
    loading,
    error: fetchError,
    retry: retryProducts,
    setData: setProductsData,
  } = useFetch(() => vendorMe.getProducts(), []);
  const { data: profile } = useFetch(() => vendorMe.getProfile().catch(() => null), []);
  const products = productsData || [];
  const setProducts = (updater) => setProductsData((prev) => updater(prev || []));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [capError, setCapError] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    original_price: '',
    category: 'Fashion & Clothing',
    condition: 'good',
    description: '',
    stock_quantity: 1,
  });

  useEffect(() => {
    if (profile?.category) {
      setForm((prev) => ({
        ...prev,
        category: prev.category || profile.category,
      }));
    }
  }, [profile]);

  const loadProducts = retryProducts;

  const isApproved = Boolean(profile?.is_verified) || profile?.verification_status === 'approved';
  const showCapChip = Boolean(profile) && !isApproved;
  const reachedCap = Boolean(profile) && !isApproved && products.length >= UNVERIFIED_LIMIT;

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImagesChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setError('');
    const mergedRaw = [...imageFiles, ...selected].slice(0, 5);
    const prepared = await prepareImageFilesForUpload(mergedRaw);
    setImageFiles(prepared);
    setImagePreviews(prepared.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const handleRemovePreview = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    const numericPrice = String(form.price).replace(/[^0-9.]/g, '');

    if (!cleanName || !numericPrice || !form.category) {
      setError('Item name, valid price (₦), and category are required.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    setCapError(false);

    try {
      const fd = new FormData();
      fd.append('name', cleanName);
      fd.append('price', numericPrice);
      if (form.original_price) {
        const cleanOrig = String(form.original_price).replace(/[^0-9.]/g, '');
        if (cleanOrig) fd.append('original_price', cleanOrig);
      }
      fd.append('category', form.category);
      fd.append('condition', form.condition || 'good');
      if (form.description.trim()) fd.append('description', form.description.trim());
      fd.append('stock_quantity', String(form.stock_quantity || 1));
      imageFiles.forEach((f) => fd.append('images', f));

      await vendorMe.addProduct(fd);
      setMessage('Item published! It is now live on your vendor profile and on the ThriftLink News Feed.');
      setForm({
        name: '',
        price: '',
        original_price: '',
        category: profile?.category || 'Fashion & Clothing',
        condition: 'good',
        description: '',
        stock_quantity: 1,
      });
      setImageFiles([]);
      setImagePreviews([]);
      loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to publish item. Please try again.');
      if (/Unverified vendors can list up to/i.test(err.message || '')) setCapError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product from your store and feed?')) return;
    try {
      await vendorMe.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAvailable = async (id, current) => {
    try {
      const updated = await vendorMe.updateProduct(id, { is_available: !current });
      setProducts((p) => p.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = {
    padding: '0.8rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.92rem',
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .vp-card { padding: 1.25rem 1rem !important; border-radius: 14px !important; }
          .vp-row-2 { grid-template-columns: 1fr !important; }
          .vp-row-4 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .vp-row-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Royal Blue + Green Feed Sync Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #16a34a 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(30, 58, 138, 0.16)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#bbf7d0', marginBottom: '0.25rem' }}>
            <Globe size={14} /> Connected Directly to the ThriftLink News Feed
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            Post Products to Your Store & Live Wall
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'rgba(255,255,255,0.88)' }}>
            Every item you upload here appears on your storefront and is automatically broadcast to shoppers on the News Feed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {profile?.id && (
            <Link
              to={`/vendor/${profile.id}`}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              View Public Store
            </Link>
          )}
          <Link
            to="/feed"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#1e3a8a',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Open Live News Feed →
          </Link>
        </div>
      </div>

      <div
        className="vp-card"
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #dbeafe',
          boxShadow: '0 2px 10px rgba(30, 58, 138, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h4 style={{ fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 800, margin: 0 }}>
            Upload New Thrift Item
          </h4>
          {isApproved ? (
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={14} /> Verified Store — Priority News Feed Placement
            </span>
          ) : (
            showCapChip && (
              <span
                style={{
                  background: reachedCap ? '#fef2f2' : '#fef9c3',
                  color: reachedCap ? '#b91c1c' : '#854d0e',
                  border: `1px solid ${reachedCap ? '#fecaca' : '#fde68a'}`,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <ShieldAlert size={14} />
                {Math.min(products.length, UNVERIFIED_LIMIT)} / {UNVERIFIED_LIMIT} listings used — verify shop for unlimited
              </span>
            )
          )}
        </div>
        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }} />

        {(capError || reachedCap) && !isApproved && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              You have reached the {UNVERIFIED_LIMIT}-item limit for unverified shops.
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              Complete KYC verification to post unlimited products and get prioritized placement on the News Feed.
            </div>
            <Link to={ROUTES.vendor.profile} style={{ color: '#1e3a8a', fontWeight: 700, textDecoration: 'underline' }}>
              Complete KYC verification →
            </Link>
          </div>
        )}

        {message && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> {message}
            </span>
            <Link to="/" style={{ color: '#1e3a8a', fontWeight: 800, textDecoration: 'underline' }}>
              See it on the News Feed →
            </Link>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ border: '2px dashed #93c5fd', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: '#eff6ff' }}>
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} id="product-images" />
            <label htmlFor="product-images" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontWeight: 600 }}>
              <Upload size={28} color="#1d4ed8" />
              <span>Click to select product photos (up to 5 images)</span>
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                Mobile camera photos are automatically optimized for fast upload
              </span>
            </label>

            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', height: '84px', width: '84px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #1d4ed8' }}>
                    <img src={src} alt="preview" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemovePreview(i)}
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
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
          </div>

          <div className="vp-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="text" name="name" placeholder="Item name * (e.g. Vintage Handbag, Nike Dunks)" value={form.name} onChange={handleFormChange} style={inputStyle} required />
            <select name="category" value={form.category} onChange={handleFormChange} style={inputStyle} required>
              <option value="">Select category *</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="vp-row-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <input type="text" inputMode="numeric" name="price" placeholder="Price (₦) * e.g. 8500" value={form.price} onChange={handleFormChange} style={inputStyle} required />
            <input type="text" inputMode="numeric" name="original_price" placeholder="Old price (₦) optional" value={form.original_price} onChange={handleFormChange} style={inputStyle} />
            <input type="number" name="stock_quantity" placeholder="Stock Qty *" value={form.stock_quantity} onChange={handleFormChange} style={inputStyle} required min="1" />
            <select name="condition" value={form.condition} onChange={handleFormChange} style={inputStyle}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <textarea name="description" placeholder="Describe item size, brand, condition, or delivery details..." value={form.description} onChange={handleFormChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={uploading || reachedCap}
              style={{
                padding: '0.85rem 1.75rem',
                background: uploading || reachedCap ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: uploading || reachedCap ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
              }}
            >
              {uploading ? 'Publishing Item...' : 'Publish to Store & News Feed'}
            </button>
          </div>
        </form>

        <h4 style={{ fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>
          Your Store & Feed Catalog ({products.length})
        </h4>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading your catalog...</div>
        ) : fetchError ? (
          <ErrorState error={fetchError} onRetry={retryProducts} />
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={28} color="#1d4ed8" />
              </div>
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>No items posted yet. Upload your first thrift item above to appear on the News Feed!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1.25rem' }}>
            {products.map((item) => {
              const images = (() => {
                if (Array.isArray(item.images)) return item.images;
                try {
                  return JSON.parse(item.images || '[]');
                } catch {
                  return [];
                }
              })();
              const firstImg = images[0];
              return (
                <div key={item.id} style={{ border: '1px solid #dbeafe', borderRadius: '12px', overflow: 'hidden', opacity: item.is_available ? 1 : 0.6, background: '#ffffff' }}>
                  <div style={{ height: '150px', background: '#eff6ff', position: 'relative' }}>
                    {firstImg ? (
                      <img src={cldUrl(firstImg, 400)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd' }}>
                        <Package size={32} strokeWidth={1.5} />
                      </div>
                    )}
                    {!item.is_available && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: 'white', padding: '0.22rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}>
                          Hidden from Feed
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.9rem' }}>₦{Number(item.price || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.7rem', color: '#1e3a8a', background: '#eff6ff', padding: '0.12rem 0.45rem', borderRadius: 4, fontWeight: 700 }}>
                        {(item.condition || 'good').replace(/[-_]/g, ' ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(item.id, item.is_available)}
                        style={{ flex: 1, padding: '0.38rem', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}
                      >
                        {item.is_available ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{ flex: 1, padding: '0.38rem', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fef2f2', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;
