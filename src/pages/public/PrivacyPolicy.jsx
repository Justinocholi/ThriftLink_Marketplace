import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const PrivacyPolicy = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#1f2937' }}>Privacy Policy</h1>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>At ThriftLink, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We use the information we collect to operate, maintain, and improve our services, facilitate transactions, and communicate with you.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>3. Contact Us</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>If you have any questions about this Privacy Policy, please contact us at support@thriftlink.com.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
