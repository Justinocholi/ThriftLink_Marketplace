import React from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';

const UserSupport = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>Help & Support</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#3b82f6' }}>
            <Mail size={24} />
          </div>
          <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Email Us</h5>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>support@thriftlink.com</p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ background: '#f0fdf4', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#22c55e' }}>
            <MessageCircle size={24} />
          </div>
          <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Live Chat</h5>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Available 9am - 5pm</p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ background: '#fef3c7', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#d97706' }}>
            <Phone size={24} />
          </div>
          <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Call Us</h5>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>+234 800 123 4567</p>
        </div>
      </div>

      <h5 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Send us a message</h5>
      <form style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Subject</label>
          <input type="text" placeholder="How can we help?" style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Message</label>
          <textarea rows="5" placeholder="Describe your issue..." style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontFamily: 'inherit' }}></textarea>
        </div>
        <button type="button" style={{
          padding: '0.875rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>Send Message</button>
      </form>
    </div>
  );
};

export default UserSupport;
