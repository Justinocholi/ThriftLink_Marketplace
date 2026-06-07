import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Step = ({ number, title, description }) => (
  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem' }}>
    <div style={{ 
      width: '50px', height: '50px', borderRadius: '50%', background: '#3b82f6', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700',
      flexShrink: 0
    }}>
      {number}
    </div>
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.8rem', color: '#1f2937' }}>{title}</h3>
      <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '1.1rem' }}>{description}</p>
    </div>
  </div>
);

const VendorGuide = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: '#1f2937' }}>Vendor Guide</h1>
        <p style={{ color: '#6b7280', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
          Everything you need to know to start selling successfully on ThriftLink.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Step 
            number="1" 
            title="Create an Account" 
            description="Sign up as a vendor by clicking the 'Register as Vendor' button. Fill in your business details and contact information." 
          />
          <Step 
            number="2" 
            title="Get Verified" 
            description="Upload your ID and business documents to get the Verified Badge. Verified vendors get 3x more visibility and trust." 
          />
          <Step 
            number="3" 
            title="List Your Products" 
            description="Add your products with high-quality photos and detailed descriptions. Categorize them correctly for easy discovery." 
          />
          <Step 
            number="4" 
            title="Start Selling" 
            description="Respond to customer inquiries via WhatsApp or in-app messages. Arrange delivery and get paid!" 
          />
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>Ready to start?</h2>
          <a href="/login" style={{ 
            display: 'inline-block', padding: '1rem 2.5rem', background: '#3b82f6', color: 'white',
            borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontSize: '1.1rem'
          }}>
            Become a Vendor
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VendorGuide;
