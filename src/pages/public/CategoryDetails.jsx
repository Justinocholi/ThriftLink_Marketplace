import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { products as productsApi } from '../../services/api';
import { Loader2, Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';

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
      setProducts(data.products);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [id, searchTerm, sortBy, minPrice, maxPrice, condition, state]);

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
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={40} color="#3b82f6" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>No products found</h3>
            <p style={{ color: '#6b7280' }}>Try adjusting your filters or search term to find what you're looking for.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
              {products.map(product => {
                const images = JSON.parse(product.images || '[]');
                return (
                  <div key={product.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
                      <Link to={`/product/${product.id}`} style={{ height: '200px', background: '#f3f4f6', display: 'block', position: 'relative' }}>
                          <img 
                            src={images[0] || "https://via.placeholder.com/300"} 
                            alt={product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          {product.is_verified && (
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#25D366', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} /> Verified
                            </div>
                          )}
                      </Link>
                      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4rem' }}>
                            {product.name}
                          </h3>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3b82f6', marginBottom: '0.5rem' }}>
                            ₦{product.price.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                            <span>{product.vendor_name}</span>
                            <span>{product.vendor_state}</span>
                          </div>
                          <Link 
                            to={`/product/${product.id}`}
                            style={{ 
                                width: '100%', marginTop: '1rem', padding: '0.6rem', textAlign: 'center',
                                background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', 
                                borderRadius: '6px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none'
                            }}
                          >
                              View Details
                          </Link>
                      </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryDetails;
