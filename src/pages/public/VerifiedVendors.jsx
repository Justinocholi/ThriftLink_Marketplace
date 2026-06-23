import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { vendors as vendorsApi } from '../../services/api';
import { cldUrl } from '../../utils/cloudinary';

import shieldIcon from '../../assets/shield.png';
import starIcon from '../../assets/star.png';
import checklistIcon from '../../assets/checklist.png';

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

const VerifiedVendors = () => {
  const navigate = useNavigate();
  const [vendorList, setVendorList] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ state: '', category: '', search: '' });

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
    vendorsApi.list(params)
      .then(data => {
        setVendorList(data.vendors || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filters]);

  const handleFilterChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', color: '#333', minHeight: '100vh' }}>
      <Navbar />

      <header style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white', padding: '8rem 2rem 3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Verified Vendors</h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem' }}>
          Connect with trusted and verified sellers across Nigeria.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', marginBottom: '0.3rem' }}>{total}</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Verified Vendors</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', marginBottom: '0.3rem' }}>100%</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Verified IDs</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', marginBottom: '0.3rem' }}>24/7</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Support</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Filters */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', margin: '-4rem 0 2rem', border: '1px solid #e5e7eb', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <input
              name="search"
              type="text"
              placeholder="Search vendors..."
              value={filters.search}
              onChange={handleFilterChange}
              style={{ padding: '0.7rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
            <select name="state" value={filters.state} onChange={handleFilterChange} style={{ padding: '0.7rem', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', fontSize: '0.9rem' }}>
              <option value="">All States</option>
              {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="category" value={filters.category} onChange={handleFilterChange} style={{ padding: '0.7rem', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', fontSize: '0.9rem' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937' }}>
            {loading ? 'Loading...' : `${total} Verified Vendor${total !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ borderRadius: 20, height: 240, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'tl-shimmer 1.4s linear infinite' }} />
              </div>
            ))}
            <style>{`@keyframes tl-shimmer { 0%{background-position: 200% 0;} 100%{background-position: -200% 0;} }`}</style>
          </div>
        ) : vendorList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'white', borderRadius: 20, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No vendors found.</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {vendorList.map(vendor => {
              const initials = vendor.shop_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'V';
              return (
                <div key={vendor.id}
                  onClick={() => navigate(`/vendor/${vendor.id}`)}
                  style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {vendor.logo
                        ? <img src={cldUrl(vendor.logo, 400)} alt={vendor.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.2rem' }}>{vendor.shop_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        <img src={starIcon} alt="Rating" style={{ width: '12px', height: '12px' }} />
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                        <span>• {vendor.total_reviews} review{vendor.total_reviews !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {vendor.is_verified === 1 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                      <img src={checklistIcon} alt="Verified" style={{ width: '12px', height: '12px' }} />
                      Verified Vendor
                    </div>
                  )}

                  {vendor.category && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>{vendor.category}</span>
                    </div>
                  )}

                  {vendor.description && (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {vendor.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    {vendor.state && <span>📍 {vendor.state}{vendor.city ? `, ${vendor.city}` : ''}</span>}
                  </div>

                  <button style={{ width: '100%', padding: '0.75rem', background: 'white', border: '1px solid #25D366', color: '#25D366', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#25D366'; }}>
                    Visit Shop
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button onClick={() => load(page - 1)} disabled={page === 1} style={{ padding: '0.7rem 1rem', border: '1px solid #e5e7eb', background: 'white', color: page === 1 ? '#9ca3af' : '#374151', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} style={{ padding: '0.7rem 1rem', border: '1px solid', borderColor: p === page ? '#25D366' : '#e5e7eb', background: p === page ? '#25D366' : 'white', color: p === page ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer' }}>{p}</button>
            ))}
            <button onClick={() => load(page + 1)} disabled={page === pages} style={{ padding: '0.7rem 1rem', border: '1px solid #e5e7eb', background: 'white', color: page === pages ? '#9ca3af' : '#374151', borderRadius: '6px', cursor: page === pages ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VerifiedVendors;
