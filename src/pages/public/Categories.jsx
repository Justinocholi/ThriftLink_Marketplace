import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Import Assets
import smartphoneIcon from '../../assets/smartphone.png';
import womanIcon from '../../assets/woman.png';
import foodIcon from '../../assets/fast-food.png';
import mansionIcon from '../../assets/mansion.png';
import serviceIcon from '../../assets/customer-service.png';
import briefcaseIcon from '../../assets/briefcase.png';
import educationIcon from '../../assets/education.png';
import carIcon from '../../assets/sport-car.png';

const Categories = () => {
  const categories = [
    { name: 'Electronics', count: '12,450 vendors', icon: smartphoneIcon, color: '#3b82f6', link: '/category/Electronics' },
    { name: 'Fashion & Clothing', count: '8,920 vendors', icon: womanIcon, color: '#ec4899', link: '/category/Fashion & Clothing' },
    { name: 'Shoes & Footwear', count: '6,780 vendors', icon: carIcon, color: '#ef4444', link: '/category/Shoes & Footwear' },
    { name: 'Food & Drinks', count: '6,780 vendors', icon: foodIcon, color: '#f97316', link: '/category/Food & Drinks' },
    { name: 'Home & Living', count: '4,320 vendors', icon: mansionIcon, color: '#10b981', link: '/category/Home & Living' },
    { name: 'Services', count: '3,650 vendors', icon: serviceIcon, color: '#8b5cf6', link: '/category/Services' },
    { name: 'Business', count: '2,890 vendors', icon: briefcaseIcon, color: '#f59e0b', link: '/category/Business' },
    { name: 'Education', count: '1,560 vendors', icon: educationIcon, color: '#06b6d4', link: '/category/Education' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', color: '#333', minHeight: '100vh' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .section-container { padding: 6rem 1rem 3rem !important; }
            .categories-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
            .category-card { padding: 1.5rem 1rem !important; }
            .category-icon { width: 60px !important; height: 60px !important; }
          }
        `}
      </style>
      <Navbar />

      <section className="section-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '7rem 2rem 4rem'
      }}>
        <h2 className="section-title" style={{
          textAlign: 'center',
          fontSize: '2.2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2.5rem'
        }}>Browse by Category</h2>
        
        <div className="categories-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2rem'
        }}>
          {categories.map((cat, index) => (
            <Link to={cat.link} key={index} className="category-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem 1rem',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block'
            }}>
              <div className="category-icon" style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                background: cat.color
              }}>
                <img src={cat.icon} alt={cat.name} className="category-img" style={{
                  width: '50%',
                  height: '50%',
                  objectFit: 'contain'
                }} />
              </div>

              <div className="category-name" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.3rem'
              }}>{cat.name}</div>
              
              <div className="category-count" style={{
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>{cat.count}</div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Categories;
