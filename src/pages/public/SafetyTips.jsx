import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ShieldCheck, MapPin, CreditCard, AlertTriangle } from 'lucide-react';

const TipCard = ({ icon, title, description }) => (
  <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
    <div style={{ marginBottom: '1.5rem', color: '#3b82f6' }}>{icon}</div>
    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>{title}</h3>
    <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{description}</p>
  </div>
);

const SafetyTips = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ padding: '8rem 2rem 4rem', textAlign: 'center', background: '#ecfdf5', color: '#065f46' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Safety Tips</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', opacity: 0.9 }}>
          Your safety is our top priority. Follow these guidelines for a secure shopping experience.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <TipCard 
            icon={<ShieldCheck size={40} />}
            title="Check Vendor Verification"
            description="Always look for the 'Verified Vendor' badge. This indicates that we have checked the vendor's identity and business documents."
          />
          <TipCard 
            icon={<MapPin size={40} />}
            title="Meet in Public Places"
            description="When meeting a seller for a physical exchange, always choose a safe, public, and well-lit location. Avoid private residences."
          />
          <TipCard 
            icon={<CreditCard size={40} />}
            title="Secure Payments"
            description="Avoid sending money directly to personal bank accounts before receiving the item. Use our secure payment system whenever possible."
          />
          <TipCard 
            icon={<AlertTriangle size={40} />}
            title="Inspect Before You Buy"
            description="Thoroughly inspect the item upon delivery to ensure it matches the description. Do not pay if you are not satisfied."
          />
        </div>

        <div style={{ marginTop: '4rem', background: 'white', padding: '3rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1f2937' }}>Common Scams to Avoid</h2>
          <ul style={{ paddingLeft: '1.5rem', color: '#4b5563', lineHeight: '1.8', fontSize: '1.1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Requests for payment before delivery for "fees" or "customs".</li>
            <li style={{ marginBottom: '0.5rem' }}>Sellers who refuse to meet in person or use secure payment methods.</li>
            <li style={{ marginBottom: '0.5rem' }}>Items listed at unrealistically low prices (too good to be true).</li>
            <li style={{ marginBottom: '0.5rem' }}>Requests for personal financial information.</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SafetyTips;
