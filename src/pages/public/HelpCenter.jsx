import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Search, Book, MessageCircle, AlertCircle } from 'lucide-react';

const HelpCenter = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Hero */}
      <div style={{ background: '#3b82f6', color: 'white', padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>How can we help you?</h1>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search for answers..." 
            style={{ 
              width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', 
              border: 'none', fontSize: '1rem' 
            }} 
          />
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#3b82f6' }}>
              <Book size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Guides & Tutorials</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Learn how to buy, sell, and manage your account.</p>
            <a href="/support/faq" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>View Guides</a>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#10b981' }}>
              <MessageCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Contact Support</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Get in touch with our support team for assistance.</p>
            <a href="/support/contact" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Contact Us</a>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Report an Issue</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Found a bug or encountered a problem? Let us know.</p>
            <a href="/support/report" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Report Issue</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
