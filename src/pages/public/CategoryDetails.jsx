import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { products as productsApi } from '../../services/api';
import { Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const CategoryDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states from URL
  const searchTerm = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const condition = searchParams.get('condition') || '';
  const state = searchParams.get('state') || '';
  const verifiedOnly = searchParams.get('verified') === '1';

  const categoryName = id === 'all' ? "All Categories" : id;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        category: id === 'all' ? '' : categoryName,
        search: searchTerm,
        sort: sortBy,
        min_price: minPrice,
        max_price: maxPrice,
        condition: condition,
        state: state,
        limit: 24
      };
      const data = await productsApi.list(params);
      let list = data.products || [];
      // Client-side filter: backend may not support "verified vendors only" yet
      if (verifiedOnly) list = list.filter(p => p.is_verified);
      // Client-side sort fallbacks for rating
      if (sortBy === 'rating') {
        list = [...list].sort((a, b) => Number(b.vendor_rating || b.rating || 0) - Number(a.vendor_rating || a.rating || 0));
      }
      setProducts(list);
      setTotal(verifiedOnly ? list.length : (data.total || list.length));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [id, searchTerm, sortBy, minPrice, maxPrice, condition, state, verifiedOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value;
    setSearchParams(prev => {
      if (query) prev.set('q', query);
      else prev.delete('q');
      return prev;
    });
  };

  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ background: '#1f2937', color: 'white', padding: '6rem 2rem 3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', textTransform: 'capitalize' }}>{categoryName}</h1>
        <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>Browse {total} items in {categoryName}</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Search and Sort Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '0.5rem', minWidth: '300px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                name="search"
                type="text" 
                placeholder={`Search in ${categoryName}...`} 
                defaultValue={searchTerm}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
              />
            </div>
            <button type="submit" style={{ padding: '0 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
            <select 
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              style={{ padding: '0.8rem 1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price_low">Lowest Price</option>
              <option value="price_high">Highest Price</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'linear-gradient(135deg, rgba(22,184,101,0.08), rgba(59,130,246,0.06))', border: '1.5px solid rgba(22,184,101,0.25)', cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => updateFilter('verified', e.target.checked ? '1' : '')} style={{ width: 18, height: 18, accentColor: '#16b865' }} />
              <ShieldCheck size={18} color="#16b865" />
              <span>Show only verified vendors</span>
            </label>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Price Range</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px' }} 
                />
                <span style={{ color: '#9ca3af' }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Condition</label>
              <select 
                value={condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              >
                <option value="">All Conditions</option>
                <option value="new">Brand New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Location (State)</label>
              <select 
                value={state}
                onChange={(e) => updateFilter('state', e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              >
                <option value="">All Nigeria</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Rivers">Rivers</option>
                {/* Add more states as needed */}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => {
                  setSearchParams({});
                  setShowFilters(false);
                }}
                style={{ width: '100%', padding: '0.6rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ borderRadius: 20, overflow: 'hidden', background: '#f1f5f9', aspectRatio: '3 / 4', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'tl-shimmer 1.4s linear infinite' }} />
              </div>
            ))}
            <style>{`@keyframes tl-shimmer { 0%{background-position: 200% 0;} 100%{background-position: -200% 0;} }`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No products found.</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryDetails;
