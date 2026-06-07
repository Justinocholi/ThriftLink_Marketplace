import React, { useState, useEffect } from 'react';
import { vendorMe } from '../../services/api';
import { Store, MapPin, Camera, Loader2, Save, Instagram, MessageSquare, Info } from 'lucide-react';

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River',
  'Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe','Imo','Jigawa','Kaduna',
  'Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo',
  'Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

const CATEGORIES = [
  'Fashion & Clothing','Electronics','Shoes & Footwear','Bags & Accessories',
  'Beauty & Skincare','Home & Kitchen','Books & Education','Sports & Fitness',
  'Baby & Kids','Food & Drinks','Real Estate','Automobiles','General',
];

const VendorProfile = () => {
  const [formData, setFormData] = useState({
    shop_name: '', description: '', whatsapp_number: '',
    instagram_handle: '', category: '', state: '', city: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    vendorMe.getProfile()
      .then(p => {
        setFormData({
          shop_name: p.shop_name || '',
          description: p.description || '',
          whatsapp_number: p.whatsapp_number || '',
          instagram_handle: p.instagram_handle || '',
          category: p.category || '',
          state: p.state || '',
          city: p.city || '',
        });
        if (p.logo) setLogoPreview(p.logo);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = e => {
    const file = e.target.files[0];
    if (file) { 
      setLogoFile(file); 
      setLogoPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      if (logoFile) await vendorMe.uploadLogo(logoFile);
      await vendorMe.updateProfile(formData);
      setMessage('Vendor profile updated successfully!');
      setLogoFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.875rem' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Loader2 className="animate-spin" size={32} color="#25D366" />
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Public Shop Profile</h2>
        <p style={{ color: '#64748b' }}>This information will be visible to all potential buyers on Thrift-Link.</p>
      </div>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
          {/* Logo Upload */}
          <div>
            <label style={labelStyle}>Shop Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Store size={48} color="#cbd5e1" />
                  )}
                </div>
                <label htmlFor="logo-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: '#25D366', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37, 211, 102, 0.3)' }}>
                  <Camera size={18} />
                </label>
                <input type="file" accept="image/*" id="logo-upload" onChange={handleLogoChange} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontWeight: '700' }}>Brand Identity</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>Your logo helps buyers recognize your shop. Square images work best. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Shop Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Shop Name *</label>
              <div style={{ position: 'relative' }}>
                <Store size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" name="shop_name" value={formData.shop_name} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '2.75rem' }} placeholder="e.g. Zara Thrift Store" required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Niche / Category</label>
              <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Store Description</label>
            <div style={{ position: 'relative' }}>
              <Info size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '1rem' }} />
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Tell buyers about your unique thrift items, delivery areas, and business values..." style={{ ...inputStyle, paddingLeft: '2.75rem', resize: 'vertical' }} />
            </div>
          </div>

          {/* Contact & Social */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>WhatsApp Business Number *</label>
              <div style={{ position: 'relative' }}>
                <MessageSquare size={18} color="#25D366" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="+2348012345678" style={{ ...inputStyle, paddingLeft: '2.75rem' }} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Instagram Handle</label>
              <div style={{ position: 'relative' }}>
                <Instagram size={18} color="#E1306C" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" name="instagram_handle" value={formData.instagram_handle} onChange={handleChange} placeholder="@yourshop" style={{ ...inputStyle, paddingLeft: '2.75rem' }} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Business State</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <select name="state" value={formData.state} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '2.75rem' }}>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>City / Neighborhood</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Yaba, Lagos" style={inputStyle} />
            </div>
          </div>

          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2.5rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Public Profile
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default VendorProfile;

