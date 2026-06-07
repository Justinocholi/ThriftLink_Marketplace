import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingCard = ({ title, price, features, recommended, onSubscribe }) => (
  <div style={{ 
    background: 'white', padding: '2rem', borderRadius: '16px', 
    border: recommended ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    position: 'relative',
    boxShadow: recommended ? '0 10px 30px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column'
  }}>
    {recommended && (
      <div style={{ 
        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
        background: '#3b82f6', color: 'white', padding: '0.3rem 1rem', borderRadius: '20px',
        fontSize: '0.8rem', fontWeight: '600'
      }}>
        RECOMMENDED
      </div>
    )}
    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>{title}</h3>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#1f2937' }}>
      {price} <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: '400' }}>/month</span>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      {features.map((feature, idx) => (
        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#4b5563' }}>
          <div style={{ background: '#dbeafe', color: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex' }}>
            <Check size={14} />
          </div>
          {feature}
        </li>
      ))}
    </ul>
    <button 
      onClick={onSubscribe}
      style={{ 
      width: '100%', padding: '1rem', borderRadius: '8px', border: 'none',
      background: recommended ? '#3b82f6' : '#f3f4f6',
      color: recommended ? 'white' : '#1f2937',
      fontWeight: '600', cursor: 'pointer', fontSize: '1rem',
      transition: 'all 0.2s'
    }}>
      {price === 'Free' ? 'Get Started' : 'Subscribe Now'}
    </button>
  </div>
);

const PricingPlans = () => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/vendor/subscription');
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ textAlign: 'center', padding: '8rem 2rem 4rem', background: '#1e293b', color: 'white' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>Simple, Transparent Pricing</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
          Choose the plan that fits your business needs. No hidden fees.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-3rem auto 4rem', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <PricingCard 
          title="Starter" 
          price="Free" 
          features={["5 Product Listings", "Basic Profile", "Community Support", "Standard Analytics"]} 
          onSubscribe={handleSubscribe}
        />
        <PricingCard 
          title="Pro Vendor" 
          price="₦2,000" 
          features={["50 Product Listings", "Verified Badge", "Priority Support", "Advanced Analytics", "Featured Listings"]} 
          recommended={true}
          onSubscribe={handleSubscribe}
        />
        <PricingCard 
          title="Enterprise" 
          price="₦5,000" 
          features={["Unlimited Listings", "Verified Badge", "Dedicated Support", "Custom Analytics", "Homepage Feature", "Multiple Locations"]} 
          onSubscribe={handleSubscribe}
        />
      </div>

      <Footer />
    </div>
  );
};

export default PricingPlans;
