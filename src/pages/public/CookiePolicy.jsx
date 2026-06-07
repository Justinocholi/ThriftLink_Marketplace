import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const CookiePolicy = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#1f2937' }}>Cookie Policy</h1>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>This Cookie Policy explains how ThriftLink uses cookies and similar technologies.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>1. What are Cookies?</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Cookies are small text files that are stored on your device when you visit a website.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>2. How We Use Cookies</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We use cookies to remember your preferences, analyze site traffic, and improve your user experience.</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>3. Managing Cookies</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>You can control and manage cookies through your browser settings.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
