import React from 'react';
import { Check } from 'lucide-react';

const VendorSubscription = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>Subscription Plan</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {/* Starter Plan */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h5 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Starter</h5>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>Free</p>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '2rem', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> 5 Product Listings</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Basic Profile</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Community Support</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Standard Analytics</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            background: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'not-allowed',
            color: '#64748b'
          }} disabled>Current Plan</button>
        </div>

        {/* Pro Vendor Plan */}
        <div style={{
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>RECOMMENDED</div>
          <h5 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pro Vendor</h5>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>₦2,000<span style={{ fontSize: '1rem', fontWeight: '400', color: '#64748b' }}>/mo</span></p>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '2rem', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> 50 Product Listings</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Verified Badge</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Priority Support</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Advanced Analytics</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Featured Listings</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>Upgrade Now</button>
        </div>

        {/* Enterprise Plan */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h5 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Enterprise</h5>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>₦5,000<span style={{ fontSize: '1rem', fontWeight: '400', color: '#64748b' }}>/mo</span></p>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '2rem', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Unlimited Listings</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Verified Badge</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Dedicated Support</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Custom Analytics</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Homepage Feature</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Check size={16} color="green" /> Multiple Locations</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            background: '#1e293b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>Upgrade Now</button>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscription;