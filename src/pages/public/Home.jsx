import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { vendors as vendorsApi, products as productsApi } from '../../services/api';
import { ShieldCheck, MessageCircle, Users, Flag, Star } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { cldUrl } from '../../utils/cloudinary';

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
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('tl_recent') || '[]');
      if (!Array.isArray(ids) || !ids.length) return;
      Promise.all(ids.slice(0, 10).map(id => productsApi.get(id).catch(() => null)))
        .then(rs => setRecent(rs.filter(Boolean)));
    } catch {}
  }, []);

  useEffect(() => {
    // The public vendors endpoint already ranks admin-featured vendors first
    // (by featured_rank), then by rating — so the home page reflects the
    // admin's curated "top vendors" automatically.
    vendorsApi
      .list({ featured: 'true', limit: 8 })
      .then((data) => {
        const list = Array.isArray(data?.vendors) ? data.vendors : [];
        if (list.length > 0) return setVendors(list);
        // graceful fallback: any vendors at all, so the section isn't empty at launch
        return vendorsApi.list({ limit: 8 })
          .then(d => setVendors(Array.isArray(d?.vendors) ? d.vendors : []))
          .catch(() => setVendors([]));
      })
      .catch(() => setVendors([]))
      .finally(() => setVendorsLoading(false));
  }, []);

  const featuredVendors = vendors.slice(0, 8);
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
            .trust-indicators { flex-direction: column; gap: 1rem !important; align-items: center !important; }
            .trust-item { width: auto; justify-content: center !important; align-self: center !important; }
            .timeline-step { text-align: center; }
            .timeline-step > div:first-child { margin-left: auto !important; margin-right: auto !important; }
            .main-search { flex-direction: column; }
            .main-search .location-input,
            .main-search .search-btn { border-left: none !important; border-top: 1px solid rgba(15,23,42,0.06) !important; }
            .search-section, .categories, .featured-vendors,
            .top-vendors-month, .how-it-works, .stats-section, .cta-section {
              padding-left: 1.25rem !important; padding-right: 1.25rem !important;
            }
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
          /* New trust-first sections */
          .why-grid { grid-template-columns: repeat(4, 1fr); }
          .timeline-grid { grid-template-columns: repeat(4, 1fr); }
          .testi-grid { grid-template-columns: repeat(3, 1fr); }
          .vendor-band-grid { grid-template-columns: 1.4fr 1fr; }
          .why-card:hover { transform: translateY(-4px); border-color: rgba(22,184,101,0.35) !important; box-shadow: 0 16px 32px -16px rgba(15,23,42,0.12); }
          @media (max-width: 960px) {
            .why-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .timeline-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .testi-grid { grid-template-columns: 1fr !important; }
            .vendor-band-grid { grid-template-columns: 1fr !important; }
            .vendor-band-grid > div:last-child { justify-content: flex-start !important; }
          }
          @media (max-width: 640px) {
            .hero { padding: 5rem 1rem 2.5rem !important; }
            .why-grid { grid-template-columns: 1fr !important; }
            .timeline-grid { grid-template-columns: 1fr !important; }
            .hero-cta-row { flex-direction: column; align-items: stretch; }
            .hero-cta-row a { width: 100%; justify-content: center; }
            .why-tl, .protects, .testimonials, .vendor-band { padding-left: 1rem !important; padding-right: 1rem !important; }
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
      <section className="hero" style={{ padding: '8rem 2rem 5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Floating orbs for futuristic depth */}
        <div aria-hidden style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'tl-float 8s ease-in-out infinite' }} />
        <div aria-hidden style={{ position: 'absolute', top: '-50px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,217,61,0.35) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'tl-float 9s ease-in-out infinite reverse' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-150px', left: '30%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,184,101,0.35) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'tl-float 7s ease-in-out infinite' }} />

        <div className="hero-content" style={{ maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: '999px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(22, 184, 101, 0.2)', boxShadow: '0 4px 12px rgba(22, 184, 101, 0.08)', fontSize: '0.82rem', fontWeight: 700, color: '#0e9a52', marginBottom: '1.5rem', letterSpacing: '0.02em' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #1ed373, #16b865)', boxShadow: '0 0 12px rgba(22,184,101,0.6)', animation: 'tl-pulse-dot 1.8s ease-out infinite' }} />
            Verified WhatsApp thrift vendors · Nigeria
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5.5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, marginBottom: '1.25rem', letterSpacing: '-0.035em' }}>
            Shop confidently from <span style={{ background: 'linear-gradient(135deg, #16b865 0%, #A78BFA 60%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>verified thrift vendors.</span>
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 'clamp(0.98rem, 1.8vw, 1.2rem)', color: '#475569', maxWidth: '680px', margin: '0 auto 2.5rem', lineHeight: 1.55 }}>
            Browse trusted thrift shops, chat directly on WhatsApp before you buy, and shop with confidence. ThriftLink keeps the marketplace safe.
          </p>

          {/* CTA pair */}
          <div className="hero-cta-row" style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to="/categories" className="hero-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.95rem 1.8rem', borderRadius: 999, background: 'linear-gradient(135deg, #1ed373 0%, #16b865 100%)', color: 'white', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 14px 28px -8px rgba(22, 184, 101, 0.45)', transition: 'transform 0.18s, box-shadow 0.18s' }}>
              Start Shopping <span style={{ fontSize: '1.2rem' }}>→</span>
            </Link>
            <Link to="/login" className="hero-cta-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.95rem 1.8rem', borderRadius: 999, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', color: '#0f172a', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', border: '1px solid rgba(15,23,42,0.08)' }}>
              Become a Verified Vendor
            </Link>
          </div>

          {/* Trust pills — frosted glass with lucide icons */}
          <div className="trust-indicators" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            {[
              { Icon: ShieldCheck, label: 'Verified Vendors', color: '#16b865' },
              { Icon: MessageCircle, label: 'Direct Messaging', color: '#3b82f6' },
              { Icon: Users, label: 'Trusted Community', color: '#A78BFA' },
            ].map(({ Icon, label, color }) => (
              <div key={label} className="trust-item" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem 1rem', borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 16px -8px rgba(15,23,42,0.10)', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                <Icon size={16} color={color} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ThriftLink */}
      <section className="why-tl" style={{ padding: '4.5rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>Why ThriftLink?</h2>
            <p style={{ color: '#64748b', maxWidth: 600, margin: '0 auto' }}>Built around verification, direct chat, and an active safety net.</p>
          </div>
          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            {[
              { Icon: ShieldCheck, color: '#16b865', bg: 'rgba(22,184,101,0.12)', title: 'Verified Vendors', body: 'Every approved vendor goes through ID + business verification before listing.' },
              { Icon: MessageCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', title: 'Direct Messaging', body: 'Chat with vendors on WhatsApp or in-app before you spend a naira.' },
              { Icon: Flag, color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', title: 'Safer Shopping', body: 'Built-in reporting tools and a watchful admin team keep bad actors out.' },
              { Icon: Users, color: '#A78BFA', bg: 'rgba(167,139,250,0.14)', title: 'Community Driven', body: "Built for Nigeria's thrift community — by people who actually thrift." },
            ].map(({ Icon, color, bg, title, body }) => (
              <div key={title} className="why-card" style={{ background: 'white', borderRadius: 20, padding: '1.5rem 1.25rem', border: '1px solid rgba(15,23,42,0.06)', transition: 'transform .2s, border-color .2s, box-shadow .2s' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.55 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How ThriftLink Protects You */}
      <section className="protects" style={{ padding: '4.5rem 2rem', background: 'linear-gradient(135deg, rgba(22,184,101,0.08), rgba(167,139,250,0.06))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>How ThriftLink Protects You</h2>
            <p style={{ color: '#475569', maxWidth: 620, margin: '0 auto' }}>Trust isn't a slogan. It's a process — here's ours.</p>
          </div>
          <div className="timeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', position: 'relative' }}>
            {[
              { n: '01', title: 'Vendors apply for verification', body: 'NIN + government ID + business details required upfront.' },
              { n: '02', title: 'Buyers chat before purchasing', body: 'Ask questions, see real photos, confirm fit on WhatsApp.' },
              { n: '03', title: 'Users report suspicious behavior', body: 'One tap to flag a vendor, listing, or message.' },
              { n: '04', title: 'ThriftLink reviews and removes', body: 'Admins act on every report and remove bad actors quickly.' },
            ].map((s) => (
              <div key={s.n} className="timeline-step" style={{ background: 'white', borderRadius: 20, padding: '1.5rem 1.25rem', border: '1px solid rgba(15,23,42,0.06)', position: 'relative' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16b865', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>{s.n}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed strip */}
      {recent.length > 0 && (
        <section style={{ padding: '3rem 2rem 1rem', background: '#f9fafb' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Recently viewed</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
              {recent.map(p => (
                <div key={p.id} style={{ minWidth: 220, maxWidth: 220, scrollSnapAlign: 'start' }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search Section */}
      <section className="search-section" style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.05), rgba(59,130,246,0.05))', padding: '3rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
        <div className="search-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 className="search-title" style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '2rem' }}>
            Find Trusted WhatsApp Vendors Near You
          </h2>

          <div className="main-search" style={{
            display: 'flex',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.8)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="What are you looking for? (e.g. iPhone, fashion, food)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '1rem 1.5rem', border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' }}
            />
            <select 
              className="location-input" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ padding: '1rem 1.5rem', border: 'none', borderLeft: '1px solid rgba(15,23,42,0.06)', outline: 'none', minWidth: '150px', background: 'transparent', cursor: 'pointer' }}
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
                background: 'linear-gradient(135deg, #16a34a 0%, #25D366 100%)',
                color: 'white',
                border: 'none',
                borderLeft: '1px solid rgba(15,23,42,0.06)',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Search
            </button>
          </div>

          <div className="quick-filters" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {['Phones', 'Laptops', 'Shoes', 'Bags', 'Services'].map(filter => (
              <Link to={`/categories?q=${filter}`} key={filter} className="filter-chip" style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(15,23,42,0.06)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: '#374151',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.color = '#0e9a52'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.06)'; e.currentTarget.style.color = '#374151'; }}>
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
            <div className="vendors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#f1f5f9', aspectRatio: '1 / 1', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'tl-shimmer 1.4s linear infinite' }} />
                </div>
              ))}
              <style>{`@keyframes tl-shimmer { 0%{background-position: 200% 0;} 100%{background-position: -200% 0;} }`}</style>
            </div>
          ) : featuredVendors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
              No verified vendors yet. <Link to="/login" style={{ color: '#25D366', fontWeight: 600 }}>Become the first vendor →</Link>
            </div>
          ) : (
          <div className="vendors-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            <style>{`
              .ig-vendor-card { transition: transform .2s ease, box-shadow .2s ease; }
              .ig-vendor-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px -12px rgba(15,23,42,0.25); }
            `}</style>
            {featuredVendors.map(vendor => {
              const cover = vendor.shop_banner_url || vendor.banner_url || vendor.first_product_image || vendor.logo;
              return (
                <div
                  key={vendor.id}
                  className="ig-vendor-card"
                  onClick={() => navigate(`/vendor/${vendor.id}`)}
                  style={{
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: cover ? `#0f172a url(${cldUrl(cover, 400)}) center/cover` : gradientFor(vendor.id),
                    aspectRatio: '1 / 1',
                    boxShadow: '0 8px 24px -12px rgba(15,23,42,0.18)',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {!cover && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                      {initialsOf(vendor.shop_name)}
                    </div>
                  )}
                  {/* gradient overlay bottom-to-top */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.25) 45%, rgba(15,23,42,0) 70%)' }} />
                  {vendor.is_featured ? (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(250,204,21,0.95)', color: '#7c4a03', padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                      ★ FEATURED
                    </div>
                  ) : null}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.9rem 0.9rem 0.85rem', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>
                        {vendor.shop_name}
                      </h3>
                      {vendor.is_verified ? (
                        <span title="Verified vendor" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck size={16} color="#fff" fill="#3b82f6" strokeWidth={2.5} />
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', opacity: 0.95, marginBottom: 8 }}>
                      <span>★ {Number(vendor.rating || 0).toFixed(1)}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span>{vendor.product_count || vendor.total_products || 0} products</span>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.7rem', borderRadius: 999, background: 'rgba(255,255,255,0.95)', color: '#0e9a52', fontWeight: 700, fontSize: '0.72rem' }}>
                      Visit Store →
                    </span>
                  </div>
                </div>
              );
            })}
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
                  background: vendor.logo ? `url(${cldUrl(vendor.logo, 400)}) center/cover` : gradientFor(vendor.id),
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

{/* Testimonials */}
<section className="testimonials" style={{ padding: '4.5rem 2rem', background: 'white' }}>
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
      <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>What our community says</h2>
      <p style={{ color: '#64748b', maxWidth: 600, margin: '0 auto' }}>Real buyers, real vendors, real stories.</p>
    </div>
    <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
      {[
        { name: 'Adaeze O.', meta: 'Buyer · Lagos', seed: 'Adaeze', quote: 'I was nervous about thrift shopping online until I found ThriftLink. The vendor I bought from had real reviews and we chatted on WhatsApp first. My ankara jacket arrived exactly as shown.' },
        { name: 'Tunde A.', meta: 'Vendor · Abuja', seed: 'Tunde', quote: 'Selling on ThriftLink doubled my reach. Buyers trust the verified badge and reach out directly — no haggling with bots.' },
        { name: 'Chiamaka E.', meta: 'Buyer · Port Harcourt', seed: 'Chiamaka', quote: 'The reporting tool saved me from a fake account. Admin removed them within a day.' },
      ].map(t => (
        <div key={t.name} className="testi-card" style={{ background: 'white', borderRadius: 20, padding: '1.75rem 1.5rem', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', gap: 2, marginBottom: '0.85rem' }}>
            {[0,1,2,3,4].map(i => <Star key={i} size={16} color="#facc15" fill="#facc15" />)}
          </div>
          <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.25rem' }}>"{t.quote}"</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.seed)}`} alt={t.name} style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{t.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.meta}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* Become a Vendor CTA band */}
<section className="vendor-band" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #0e9a52 0%, #16b865 50%, #1ed373 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
  <div aria-hidden style={{ position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
  <div className="vendor-band-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem', alignItems: 'center', position: 'relative' }}>
    <div>
      <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', color: 'white' }}>
        Run a thrift shop? Get the verified badge.
      </h2>
      <p style={{ fontSize: '1.05rem', opacity: 0.95, marginBottom: '1.5rem', maxWidth: 560 }}>
        Join a community of trusted Nigerian thrift vendors selling directly to buyers who already trust ThriftLink.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem 1.5rem', maxWidth: 560 }}>
        {['Reach more buyers', 'Build trust through verification', 'Chat directly with customers', 'Easily manage listings'].map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <ShieldCheck size={18} color="#facc15" /> {item}
          </li>
        ))}
      </ul>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 1.75rem', borderRadius: 999, background: 'white', color: '#0e9a52', fontWeight: 800, textDecoration: 'none', boxShadow: '0 16px 32px -10px rgba(15,23,42,0.25)', fontSize: '1rem' }}>
        Apply to Become a Verified Vendor →
      </Link>
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
