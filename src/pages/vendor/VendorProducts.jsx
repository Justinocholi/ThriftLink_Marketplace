import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { vendorMe } from '../../services/api';

const CATEGORIES = [
  'Fashion & Clothing','Electronics','Shoes & Footwear','Bags & Accessories',
  'Beauty & Skincare','Home & Kitchen','Books & Education','Sports & Fitness',
  'Baby & Kids','Food & Drinks','Real Estate','Automobiles','General',
];

const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

const UNVERIFIED_LIMIT = 3;

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [capError, setCapError] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [form, setForm] = useState({
    name: '', price: '', original_price: '', category: '', condition: 'good', description: '', stock_quantity: 1
  });

  const loadProducts = () => {
    setLoading(true);
    vendorMe.getProducts()
      .then(setProducts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    vendorMe.getProfile().then(setProfile).catch(() => {});
  }, []);

  const isApproved = profile?.verification_status === 'approved';
  const showCapChip = !!profile && !isApproved;
  const reachedCap = !isApproved && products.length >= UNVERIFIED_LIMIT;

  const handleFormChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImagesChange = e => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      setError('Name, price, and category are required');
      return;
    }
    setUploading(true); setError(''); setMessage(''); setCapError(false);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', form.price);
      if (form.original_price) fd.append('original_price', form.original_price);
      fd.append('category', form.category);
      fd.append('condition', form.condition);
      if (form.description) fd.append('description', form.description);
      fd.append('stock_quantity', form.stock_quantity);
      imageFiles.forEach(f => fd.append('images', f));
      await vendorMe.addProduct(fd);
      setMessage('Product added successfully!');
      setForm({ name: '', price: '', original_price: '', category: '', condition: 'good', description: '', stock_quantity: 1 });
      setImageFiles([]);
      setImagePreviews([]);
      loadProducts();
    } catch (err) {
      setError(err.message);
      if (/Unverified vendors can list up to/i.test(err.message || '')) setCapError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this product?')) return;
    try {
      await vendorMe.deleteProduct(id);
      setProducts(p => p.filter(x => x.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAvailable = async (id, current) => {
    try {
      const updated = await vendorMe.updateProduct(id, { is_available: !current });
      setProducts(p => p.map(x => x.id === id ? updated : x));
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', margin: 0 }}>
          Add New Product
        </h4>
        {showCapChip && (
          <span style={{
            background: reachedCap ? '#fef2f2' : '#fef9c3',
            color: reachedCap ? '#b91c1c' : '#854d0e',
            border: `1px solid ${reachedCap ? '#fecaca' : '#fde68a'}`,
            padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
          }}>
            {Math.min(products.length, UNVERIFIED_LIMIT)} / {UNVERIFIED_LIMIT} listings used — verify your shop to unlock unlimited
          </span>
        )}
      </div>
      <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }} />

      {(capError || reachedCap) && !isApproved && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
            You've reached the {UNVERIFIED_LIMIT}-product limit for unverified shops.
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            Complete KYC verification to list unlimited products and earn the verified badge.
          </div>
          <a href="/vendor/profile" style={{ color: '#c2410c', fontWeight: 600, textDecoration: 'underline' }}>
            Complete KYC verification →
          </a>
        </div>
      )}

      {message &&<div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      <form onSubmit={handleUpload} style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '2rem', textAlign: 'center', background: '#f8fafc' }}>
          <input type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} id="product-images" />
          <label htmlFor="product-images" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            {imagePreviews.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {imagePreviews.map((src, i) => (
                  <img key={i} src={src} alt="preview" style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                ))}
              </div>
            ) : (
              <><Upload size={32} /><span>Click to upload images (up to 5)</span></>
            )}
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input type="text" name="name" placeholder="Product name *" value={form.name} onChange={handleFormChange} style={inputStyle} required />
          <select name="category" value={form.category} onChange={handleFormChange} style={inputStyle} required>
            <option value="">Select category *</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <input type="number" name="price" placeholder="Price (₦) *" value={form.price} onChange={handleFormChange} style={inputStyle} required />
          <input type="number" name="original_price" placeholder="Original price (₦)" value={form.original_price} onChange={handleFormChange} style={inputStyle} />
          <input type="number" name="stock_quantity" placeholder="Stock Qty *" value={form.stock_quantity} onChange={handleFormChange} style={inputStyle} required min="0" />
          <select name="condition" value={form.condition} onChange={handleFormChange} style={inputStyle}>
            {CONDITIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>

        <textarea name="description" placeholder="Product description" value={form.description} onChange={handleFormChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

        <button type="submit" disabled={uploading} style={{ padding: '0.875rem 1.5rem', background: uploading ? '#86efac' : '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
          {uploading ? 'Uploading...' : 'Add Product'}
        </button>
      </form>

      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        Your Inventory ({products.length})
      </h4>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p>No products yet. Add your first product above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {products.map(item => {
            const images = (() => { try { return JSON.parse(item.images || '[]'); } catch { return []; } })();
            const firstImg = images[0];
            return (
              <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', opacity: item.is_available ? 1 : 0.6 }}>
                <div style={{ height: '140px', background: '#f1f5f9', position: 'relative' }}>
                  {firstImg
                    ? <img src={firstImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>}
                  {!item.is_available && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ background: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Hidden</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.875rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ color: '#25D366', fontWeight: '700', fontSize: '0.875rem' }}>₦{Number(item.price).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: item.stock_quantity > 0 ? '#64748b' : '#ef4444', fontWeight: '600' }}>
                      Stock: {item.stock_quantity}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleToggleAvailable(item.id, item.is_available)} style={{ flex: 1, padding: '0.35rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#475569' }}>
                      {item.is_available ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ flex: 1, padding: '0.35rem', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fef2f2', cursor: 'pointer', fontSize: '0.75rem', color: '#dc2626' }}>
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
  );
};

export default VendorProducts;
