import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Mail, MessageCircle, Phone, HelpCircle, FileText, ShieldCheck } from 'lucide-react';

const Support = () => {
  const faqs = [
    { q: "How do I buy an item?", a: "Simply browse our categories or search for an item. Once you find what you like, click 'Chat on WhatsApp' to connect directly with the vendor." },
    { q: "Is it safe to buy from vendors?", a: "Yes! Look for the 'Verified Vendor' badge. These vendors have submitted documentation and have been vetted by our team." },
    { q: "How do I become a vendor?", a: "Click on 'Become a Vendor' in the menu, create an account, and submit your verification documents. Once approved, you can start selling." },
    { q: "What if I have an issue with an order?", a: "We recommend resolving issues directly with the vendor first. If that fails, contact our support team with your order details." },
  ];

  return (
    <div className="support-page" style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .support-page main { padding: 2rem 1rem; }
            .support-hero h1 { font-size: 2rem; }
            .support-hero p { font-size: 1rem; }
            .contact-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
            .faq-list { padding: 0 0.25rem; }
            .card { padding: 1.25rem !important; }
            .icon-circle { width: 50px !important; height: 50px !important; }
          }
        `}
      </style>
      <Navbar />
      
      <main style={{ flex: 1, padding: '4rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div className="support-hero" style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#1f2937', marginBottom: '1.5rem' }}>
              We're here to help
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Find answers to common questions or contact our support team directly.
            </p>
          </div>

          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
            <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="icon-circle" style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#3b82f6' }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Email Support</h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>Get a response within 24 hours</p>
              <a href="mailto:support@thriftlink.com" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>support@thriftlink.com</a>
            </div>

            <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="icon-circle" style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#15803d' }}>
                <MessageCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Live Chat</h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>Chat with our team instantly</p>
              <button style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: '600', cursor: 'pointer' }}>Start Chat</button>
            </div>

            <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="icon-circle" style={{ width: '60px', height: '60px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#d97706' }}>
                <Phone size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Phone Support</h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>Mon-Fri from 9am to 5pm</p>
              <a href="tel:+2348001234567" style={{ color: '#d97706', fontWeight: '600', textDecoration: 'none' }}>+234 800 123 4567</a>
            </div>
          </div>

          <section>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '3rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
            
            <div className="faq-list" style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
              {faqs.map((faq, index) => (
                <div key={index} className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1f2937' }}>{faq.q}</h3>
                  <p style={{ color: '#64748b', lineHeight: '1.6' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
