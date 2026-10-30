import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { products as productsApi, vendors as vendorsApi } from '../../services/api';
import { Search, SlidersHorizontal, ShieldCheck, X, Store, Package, Sparkles } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import RecommendationCard from '../../components/RecommendationCard';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const CategoryDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Filter states from URL
  const searchTerm = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const condition = searchParams.get('condition') || '';
  const styleFilter = searchParams.get('style') || '';
  const state = searchParams.get('state') || '';
  const verifiedOnly = searchParams.get('verified') === '1';

  const activeFilterCount = [
    verifiedOnly ? 1 : 0,
    minPrice ? 1 : 0,
    maxPrice ? 1 : 0,
    condition ? 1 : 0,
    styleFilter ? 1 : 0,
    state ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const categoryName = id === 'all' ? "All Categories" : id;

  const { data: fetched, error, loading, retry } = useFetch(async () => {
    const combinedQuery = [searchTerm, styleFilter].filter(Boolean).join(' ').trim();
    const params = {
      category: id === 'all' ? '' : categoryName,
      search: combinedQuery,
      sort: sortBy,
      min_price: minPrice,
      max_price: maxPrice,
      condition: condition,
      state: state,
      limit: 24
    };
    const [data, vendorData] = await Promise.all([
      productsApi.list(params).catch(() => ({ products: [], total: 0 })),
      vendorsApi.list({
        search: combinedQuery,
        category: id === 'all' ? '' : categoryName,
        state: state,
        verified: 'true',
        limit: 8,
      }).catch(() => ({ vendors: [] })),
    ]);

    let list = data.products || [];
    if (verifiedOnly) list = list.filter(p => p.is_verified);
    if (sortBy === 'rating') {
      list = [...list].sort((a, b) => Number(b.vendor_rating || b.rating || 0) - Number(a.vendor_rating || a.rating || 0));
    }

    let matchedVendors = Array.isArray(vendorData?.vendors) ? vendorData.vendors : [];
    if (combinedQuery || state || id !== 'all') {
      const qLower = combinedQuery.toLowerCase();
      matchedVendors = matchedVendors.filter((v) => {
        if (state && v.state && !v.state.toLowerCase().includes(state.toLowerCase())) return false;
        if (!qLower) return true;
        const hay = `${v.shop_name || ''} ${v.category || ''} ${v.description || ''} ${v.state || ''}`.toLowerCase();
        return qLower.split(/\s+/).some((tok) => hay.includes(tok));
      });
    }

    return {
      products: list,
      vendors: matchedVendors.slice(0, 4),
      total: verifiedOnly ? list.length : (data.total || list.length),
    };
  }, [id, searchTerm, sortBy, minPrice, maxPrice, condition, styleFilter, state, verifiedOnly]);
  const products = fetched?.products || [];
  const matchingVendors = fetched?.vendors || [];
  const total = fetched?.total || 0;

  // Lock body scroll while bottom sheet is open
  useEffect(() => {
    if (isFilterSheetOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isFilterSheetOpen]);

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

  // Reusable filter inputs (used by desktop drawer and mobile sheet)
  const FilterInputs = ({ layout = 'grid' }) => (
    <div style={{
      display: layout === 'grid' ? 'grid' : 'flex',
      gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fit, minmax(200px, 1fr))' : undefined,
      flexDirection: layout === 'stack' ? 'column' : undefined,
      gap: '1.5rem',
    }}>
      <label style={{ gridColumn: layout === 'grid' ? '1 / -1' : undefined, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'linear-gradient(135deg, rgba(22,184,101,0.08), rgba(59,130,246,0.06))', border: '1.5px solid rgba(22,184,101,0.25)', cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
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
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Style / Vibe</label>
        <select
          value={styleFilter}
          onChange={(e) => updateFilter('style', e.target.value)}
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
        >
          <option value="">All Styles</option>
          <option value="Vintage">Vintage & Retro</option>
          <option value="Streetwear">Streetwear & Casual</option>
          <option value="Y2K">90s & Y2K</option>
          <option value="Chic">Chic & Corporate</option>
          <option value="Luxury">Luxury & Designer</option>
          <option value="Everyday">Everyday Thrift</option>
        </select>
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
          <option value="FCT">Abuja (FCT)</option>
          <option value="Rivers">Rivers (Port Harcourt)</option>
          <option value="Oyo">Oyo (Ibadan)</option>
          <option value="Edo">Edo (Benin)</option>
          <option value="Enugu">Enugu</option>
          <option value="Delta">Delta</option>
          <option value="Kano">Kano</option>
          <option value="Ogun">Ogun</option>
          <option value="Kaduna">Kaduna</option>
        </select>
      </div>

      {layout === 'grid' && (
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
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--tl-bg)', minHeight: '100vh' }}>
      <Navbar />

      <style>{`
        @keyframes tl-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes tl-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .tl-mobile-filter-btn { display: none; }
        .tl-desktop-filter-drawer { display: block; }
        @media (max-width: 768px) {
          .tl-mobile-filter-btn { display: inline-flex !important; }
          .tl-desktop-filter-drawer { display: none !important; }
          .tl-desktop-filter-toggle { display: none !important; }
        }
      `}</style>

      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #16a34a 100%)', color: 'white', padding: '7rem 2rem 3rem', textAlign: 'center', boxShadow: '0 12px 32px -8px rgba(30, 58, 138, 0.35)' }}>
        <h1 style={{ fontSize: 'var(--tl-text-h1)', fontWeight: 800, textTransform: 'capitalize' }}>{categoryName}</h1>
        <p style={{ opacity: 0.95, fontSize: '1.1rem' }}>Browse {total} items in {categoryName}</p>
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
            <button type="submit" className="tl-btn-press" style={{ padding: '0 2rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 'var(--tl-radius-pill)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)', transition: 'transform var(--tl-fast) var(--tl-ease)' }}>
                Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="tl-desktop-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', background: 'var(--tl-surface)', border: 'none', boxShadow: 'var(--tl-shadow-1)', borderRadius: 'var(--tl-radius-pill)', fontWeight: '600', cursor: 'pointer' }}
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

        {/* Mobile sticky filter button */}
        <button
          className="tl-mobile-filter-btn"
          onClick={() => setIsFilterSheetOpen(true)}
          style={{
            position: 'sticky',
            top: '1rem',
            zIndex: 50,
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 6px 20px rgba(15,23,42,0.25)',
          }}
        >
          <SlidersHorizontal size={18} />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>

        {/* Desktop Advanced Filters Drawer */}
        {showFilters && (
          <div className="tl-desktop-filter-drawer tl-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <FilterInputs layout="grid" />
          </div>
        )}

        {/* Quick Search Pills (Section 5 — Useful Search Queries) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>Popular Searches:</span>
          {[
            { label: 'Vintage shirts', q: 'Vintage shirts', style: 'Vintage', state: '' },
            { label: 'Thrift sneakers', q: 'Thrift sneakers', style: '', state: '' },
            { label: "Ladies' handbags", q: 'handbags', style: '', state: '' },
            { label: "Men's thrift clothing", q: 'mens clothing', style: '', state: '' },
            { label: 'Thrift vendors in Abuja', q: '', style: '', state: 'FCT' },
          ].map((pill) => {
            const isActive = searchTerm === pill.q && styleFilter === pill.style && state === pill.state && (pill.q || pill.state);
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  const next = {};
                  if (pill.q) next.q = pill.q;
                  if (pill.style) next.style = pill.style;
                  if (pill.state) next.state = pill.state;
                  setSearchParams(next);
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 999,
                  border: isActive ? '1.5px solid #1e3a8a' : '1px solid #dbeafe',
                  background: isActive ? '#eff6ff' : 'white',
                  color: isActive ? '#1e3a8a' : '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Matching Verified Vendors Section (Section 5 — Return relevant vendors alongside catalog items) */}
        {!loading && matchingVendors.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={20} color="#1e3a8a" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Matching Verified Vendors ({matchingVendors.length})
                </h2>
              </div>
              <Link to="/verified-vendors" style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                See all verified vendors →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {matchingVendors.map((v, idx) => (
                <RecommendationCard
                  key={v.id}
                  vendor={v}
                  surface="discover"
                  position={idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* Catalog Items Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <Package size={20} color="#3b82f6" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Catalog Items ({total})
          </h2>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={retry} title="Couldn't load products" />
        ) : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className="tl-skeleton" style={{ borderRadius: 'var(--tl-radius-md)', aspectRatio: '3 / 4' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="tl-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No products found.</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isFilterSheetOpen && (
        <div
          onClick={() => setIsFilterSheetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            animation: 'tl-fade-in 0.2s ease-out',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '85vh',
              background: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              animation: 'tl-sheet-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 0.25rem' }}>
              <div style={{ width: 44, height: 5, borderRadius: 999, background: '#cbd5e1' }} />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Filters</h3>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#64748b' }}
                aria-label="Close filters"
              >
                <X size={22} />
              </button>
            </div>
            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <FilterInputs layout="stack" />
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', background: 'white' }}>
              <button
                onClick={() => { setSearchParams({}); }}
                style={{ flex: 1, padding: '0.85rem 1rem', background: 'white', color: '#0f172a', border: '1.5px solid #e5e7eb', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                style={{ flex: 2, padding: '0.85rem 1rem', background: '#25D366', color: 'white', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(37,211,102,0.35)' }}
              >
                Apply ({total} results)
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CategoryDetails;
