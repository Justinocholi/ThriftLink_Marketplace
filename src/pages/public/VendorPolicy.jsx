import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const VendorPolicy = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#1f2937' }}>Vendor Policy</h1>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>This Vendor Policy outlines the rules and guidelines for selling on ThriftLink.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>1. Prohibited Items</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>You may not sell illegal, counterfeit, or restricted items on ThriftLink.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>2. Product Listings</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>All product listings must include accurate descriptions and high-quality images. Misleading listings are prohibited.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>3. Order Fulfillment</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Vendors are expected to fulfill orders promptly and communicate effectively with buyers.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VendorPolicy;
