import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TermsOfService = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#1f2937' }}>Terms of Service</h1>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Welcome to ThriftLink. By using our website and services, you agree to comply with and be bound by the following terms and conditions.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>By accessing or using the ThriftLink platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>2. User Accounts</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>3. Vendor Obligations</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Vendors must provide accurate information about their products and services and must comply with our Vendor Policy.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
