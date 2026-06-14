import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { vendors as vendorsApi } from '../../services/api';

// Import Assets
import checklistIcon from '../../assets/checklist.png';
import shieldIcon from '../../assets/shield.png';
import whatsappIcon from '../../assets/whatsapp (1).png';
import whatsappBtnIcon from '../../assets/whatsapp.png';
import searchIcon from '../../assets/search.png';
import messageIcon from '../../assets/message.png';
import packageIcon from '../../assets/package.png';
import starIcon from '../../assets/star.png';

// Category Icons
import smartphoneIcon from '../../assets/smartphone.png';
import womanIcon from '../../assets/woman.png';
import beautyIcon from '../../assets/beauty-product.png';
import fastFoodIcon from '../../assets/fast-food.png';
import mansionIcon from '../../assets/mansion.png';
import briefcaseIcon from '../../assets/briefcase.png';
import sportCarIcon from '../../assets/sport-car.png';
import educationIcon from '../../assets/education.png';

// Deterministic avatar gradient + initials for vendors without a logo.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #14b8a6, #0f766e)',
];

const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'TL';

const gradientFor = (id = '') => {
  let sum = 0;
  for (let i = 0; i < String(id).length; i++) sum += String(id).charCodeAt(i);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
};

const MONTHLY_COLORS = ['#3b82f6', '#ec4899', '#f97316'];

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    vendorsApi
      .list({ limit: 8 })
      .then((data) => setVendors(Array.isArray(data?.vendors) ? data.vendors : []))
      .catch(() => setVendors([]))
      .finally(() => setVendorsLoading(false));
  }, []);

  const featuredVendors = vendors.slice(0, 4);
  const monthlyVendors = vendors.slice(0, 3);

  const handleSearch = () => {
    navigate(`/category/all?q=${encodeURIComponent(searchTerm)}&state=${encodeURIComponent(location)}`);
  };

  const categories = [
    { name: 'Electronics', count: '12k+ ads', icon: smartphoneIcon, color: '#e0f2fe', link: '/category/electronics' },
    { name: 'Fashion & Beauty', count: '8k+ ads', icon: womanIcon, color: '#fce7f3', link: '/category/fashion' },
    { name: 'Cars & Vehicles', count: '5k+ ads', icon: sportCarIcon, color: '#ffedd5', link: '/category/cars' },
    { name: 'Real Estate', count: '3k+ ads', icon: mansionIcon, color: '#dcfce7', link: '/category/real-estate' },
    { name: 'Jobs', count: '1k+ ads', icon: briefcaseIcon, color: '#f3f4f6', link: '/category/jobs' },
    { name: 'Services', count: '2k+ ads', icon: educationIcon, color: '#fae8ff', link: '/category/services' },
    { name: 'Food & Drinks', count: '4k+ ads', icon: fastFoodIcon, color: '#fef3c7', link: '/category/food' },
    { name: 'Health & Beauty', count: '6k+ ads', icon: beautyIcon, color: '#ffe4e6', link: '/category/health' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', color: '#333', overflowX: 'hidden' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .hero { padding: 5.5rem 1.25rem 3rem !important; }
            .hero h1 { font-size: 2rem !important; }
            .trust-indicators { flex-direction: column; gap: 1rem !important; }
            .search-section, .categories, .featured-vendors,
            .top-vendors-month, .how-it-works, .stats-section, .cta-section {
              padding-left: 1.25rem !important; padding-right: 1.25rem !important;
            }
            .main-search { flex-direction: column; }
            .location-input { border-left: none !important; border-top: 1px solid #e5e7eb; }
            .categories-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .cta-buttons .btn, .cta-buttons .btn-white { width: 100%; justify-content: center; }
            .vendors-grid { grid-template-columns: 1fr !important; }
            .monthly-vendors-grid { grid-template-columns: 1fr !important; }
            .monthly-card { flex-direction: column !important; text-align: center; }
            .section-title { font-size: 1.6rem !important; }
          }
          @media (max-width: 420px) {
            .categories-grid { grid-template-columns: 1fr 1fr !important; }
            .stats-grid { grid-template-columns: 1fr !important; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-on-scroll { animation: fadeInUp 0.6s ease forwards; }
        `}
      </style>
      
      <Navbar />

      {/* Hero Section */}
      <section className="hero" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '7rem 2rem 4rem',
        textAlign: 'center'
      }}>
        <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '1rem', color: '#1f2937' }}>
            The #1 Vendor Marketplace
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem' }}>
            Connect with verified vendors • Shop safely • Buy smarter
          </p>
          
          <div className="trust-indicators" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', fontWeight: '600', fontSize: '0.9rem' }}>
              <img src={checklistIcon} alt="Verified" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
              <span>50+ Active Listings</span>
            </div>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', fontWeight: '600', fontSize: '0.9rem' }}>
              <img src={shieldIcon} alt="Security" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
              <span>100% Verified Vendors</span>
            </div>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', fontWeight: '600', fontSize: '0.9rem' }}>
              <img src={whatsappIcon} alt="Chat" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
              <span>Direct WhatsApp Chat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section" style={{ background: 'white', padding: '3rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
        <div className="search-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 className="search-title" style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '2rem' }}>
            Find Trusted WhatsApp Vendors Near You
          </h2>
          
          <div className="main-search" style={{
            display: 'flex',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="What are you looking for? (e.g. iPhone, fashion, food)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '1rem 1.5rem', border: 'none', outline: 'none', fontSize: '1rem' }}
            />
            <select 
              className="location-input" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ padding: '1rem 1.5rem', border: 'none', borderLeft: '1px solid #e5e7eb', outline: 'none', minWidth: '150px', background: '#f9fafb', cursor: 'pointer' }}
            >
              <option value="">All Nigeria</option>
              <option value="Abia">Abia</option>
              <option value="Adamawa">Adamawa</option>
              <option value="Akwa Ibom">Akwa Ibom</option>
              <option value="Anambra">Anambra</option>
              <option value="Bauchi">Bauchi</option>
              <option value="Bayelsa">Bayelsa</option>
              <option value="Benue">Benue</option>
              <option value="Borno">Borno</option>
              <option value="Cross River">Cross River</option>
              <option value="Delta">Delta</option>
              <option value="Ebonyi">Ebonyi</option>
              <option value="Edo">Edo</option>
              <option value="Ekiti">Ekiti</option>
              <option value="Enugu">Enugu</option>
              <option value="FCT">FCT - Abuja</option>
              <option value="Gombe">Gombe</option>
              <option value="Imo">Imo</option>
              <option value="Jigawa">Jigawa</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Kano">Kano</option>
              <option value="Katsina">Katsina</option>
              <option value="Kebbi">Kebbi</option>
              <option value="Kogi">Kogi</option>
              <option value="Kwara">Kwara</option>
              <option value="Lagos">Lagos</option>
              <option value="Nasarawa">Nasarawa</option>
              <option value="Niger">Niger</option>
              <option value="Ogun">Ogun</option>
              <option value="Ondo">Ondo</option>
              <option value="Osun">Osun</option>
              <option value="Oyo">Oyo</option>
              <option value="Plateau">Plateau</option>
              <option value="Rivers">Rivers</option>
              <option value="Sokoto">Sokoto</option>
              <option value="Taraba">Taraba</option>
              <option value="Yobe">Yobe</option>
              <option value="Zamfara">Zamfara</option>
            </select>
            <button 
              onClick={handleSearch}
              className="search-btn" 
              style={{
                padding: '1rem 2rem',
                background: '#25D366',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.3s ease'
              }}
            >
              Search
            </button>
          </div>

          <div className="quick-filters" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {['Phones', 'Laptops', 'Shoes', 'Bags', 'Services'].map(filter => (
              <Link to={`/categories?q=${filter}`} key={filter} className="filter-chip" style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: '#6b7280',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}>
                {filter}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories" style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
            Browse Categories
          </h2>
          
          <div className="categories-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {categories.map((cat, index) => (
              <Link to={cat.link} key={index} className="category-card" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid #e5e7eb',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}>
                <div className="category-icon" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <img src={cat.icon} alt={cat.name} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                </div>
                <h3 className="category-name" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {cat.name}
                </h3>
                <span className="category-count" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {cat.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

{/* Featured Vendors */}
      <section className="featured-vendors" style={{ padding: '4rem 2rem', background: 'white' }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
            Top Rated Vendors
          </h2>
          
          {vendorsLoading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Loading vendors…</div>
          ) : featuredVendors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
              No verified vendors yet. <Link to="/login" style={{ color: '#25D366', fontWeight: 600 }}>Become the first vendor →</Link>
            </div>
          ) : (
          <div className="vendors-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {featuredVendors.map(vendor => (
              <div key={vendor.id} className="vendor-card" style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/vendor/${vendor.id}`)}
              >
                <div className="vendor-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="vendor-avatar" style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: vendor.logo ? `url(${vendor.logo}) center/cover` : gradientFor(vendor.id),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {!vendor.logo && initialsOf(vendor.shop_name)}
                  </div>
                  <div className="vendor-info">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.2rem' }}>{vendor.shop_name}</h3>
                    {vendor.is_verified ? (
                      <div className="verification-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#166534', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                        <img src={checklistIcon} alt="Verified" style={{ width: '12px', height: '12px' }} /> Verified
                      </div>
                    ) : null}
                  </div>
                </div>

                {(vendor.category || vendor.city || vendor.state) && (
                  <div className="vendor-specialties" style={{ marginBottom: '1rem' }}>
                    {[vendor.category, [vendor.city, vendor.state].filter(Boolean).join(', ')]
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} style={{
                          display: 'inline-block',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>{tag}</span>
                      ))}
                  </div>
                )}

                <div className="vendor-stats" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  <span><strong>{Number(vendor.rating || 0).toFixed(1)}</strong> Rating</span>
                  <span><strong>{vendor.total_reviews || 0}</strong> Reviews</span>
                  <span><strong>{vendor.profile_views || 0}</strong> Views</span>
                </div>

                <Link
                  to={`/vendor/${vendor.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-whatsapp"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#1fb855'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#25D366'}
                >
                  <img src={whatsappBtnIcon} alt="WhatsApp" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                  View Vendor
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Top Vendors of the Month Section */}
      {monthlyVendors.length > 0 && (
      <section className="top-vendors-month" style={{ padding: '4rem 2rem', background: '#f0fdf4' }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ 
              background: '#dcfce7', 
              color: '#166534', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.9rem', 
              fontWeight: '600',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              ✨ Monthly Highlights
            </span>
            <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Top Vendors of the Month
            </h2>
            <p style={{ color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Celebrating our most outstanding vendors for their exceptional service, quality products, and customer satisfaction.
            </p>
          </div>
          
          <div className="monthly-vendors-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {monthlyVendors.map((vendor, index) => {
              const color = MONTHLY_COLORS[index % MONTHLY_COLORS.length];
              return (
              <div key={vendor.id} className="monthly-card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${color}20`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: color,
                  color: 'white',
                  padding: '0.25rem 1rem',
                  borderBottomLeftRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  #{index + 1} Vendor
                </div>

                <div className="monthly-icon" style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: vendor.logo ? `url(${vendor.logo}) center/cover` : gradientFor(vendor.id),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}>
                  {!vendor.logo && initialsOf(vendor.shop_name)}
                </div>

                <div className="monthly-info">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                    {vendor.shop_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <img src={starIcon} alt="Rating" style={{ width: '14px', height: '14px' }} />
                      {Number(vendor.rating || 0).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{vendor.total_reviews || 0} Reviews</span>
                  </div>
                  <Link to={`/vendor/${vendor.id}`} style={{
                    color: color,
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    View Profile
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Stats Section */}
      <section className="stats-section" style={{ background: '#25D366', color: 'white', padding: '3rem 2rem', textAlign: 'center' }}>
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div className="stat-item">
            <span className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>500+</span>
            <span className="stat-label" style={{ fontSize: '0.9rem', opacity: 0.9 }}>Verified Vendors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>10k+</span>
            <span className="stat-label" style={{ fontSize: '0.9rem', opacity: 0.9 }}>Monthly Visitors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>98%</span>
            <span className="stat-label" style={{ fontSize: '0.9rem', opacity: 0.9 }}>Satisfaction Rate</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
            How It Works
          </h2>
          
          <div className="steps-container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '2rem auto 0'
          }}>
            {[
              { title: 'Search', desc: 'Find what you need using our powerful search or browse categories.', icon: searchIcon, step: 1 },
              { title: 'Chat', desc: 'Connect directly with verified vendors on WhatsApp. No middlemen.', icon: messageIcon, step: 2 },
              { title: 'Deal', desc: 'Agree on price and delivery terms safely and conveniently.', icon: packageIcon, step: 3 }
            ].map((step) => (
              <div key={step.step} className="step-card" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                border: '1px solid #e5e7eb'
              }}>
                <div className="step-number" style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#25D366',
                  color: 'white',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>{step.step}</div>
                <div className="step-icon" style={{ marginBottom: '1rem' }}>
                  <img src={step.icon} alt={step.title} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                <h3 className="step-title" style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>{step.title}</h3>
                <p className="step-description" style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '0.9rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* CTA Section */}
<section className="cta-section" style={{
  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
  color: 'white',
  padding: '4rem 2rem',
  textAlign: 'center'
}}>
  <div className="cta-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', lineHeight: '1.3' }}>
      Ready to grow your business?
    </h2>
    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
      Join thousands of vendors selling on Thrift Link today.
    </p>
    <div className="cta-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to="/vendor/register" className="btn" style={{
        padding: '0.8rem 2rem',
        background: '#25D366',
        color: 'white',
        borderRadius: '6px',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Become a Vendor
      </Link>
      <Link to="/how-it-works" className="btn-white" style={{
        padding: '0.8rem 2rem',
        background: 'white',
        color: '#1f2937',
        borderRadius: '6px',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
        Learn More
      </Link>
    </div>
  </div>
</section>

      <Footer />
    </div>
  );
};

export default Home;
