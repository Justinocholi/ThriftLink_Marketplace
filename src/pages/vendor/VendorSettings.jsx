import React, { useState } from 'react';
import { userMe } from '../../services/api';
import { Shield, Bell, Loader2, Lock, Smartphone, Globe } from 'lucide-react';

const VendorSettings = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = e => setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdatePassword = async e => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true); setMessage(''); setError('');
    try {
      await userMe.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.875rem' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Vendor Settings</h2>
        <p style={{ color: '#64748b' }}>Manage your account security and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('security')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '2px solid #25D366' : '2px solid transparent',
            color: activeTab === 'security' ? '#25D366' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} /> Security
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'notifications' ? '2px solid #25D366' : '2px solid transparent',
            color: activeTab === 'notifications' ? '#25D366' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} /> Notifications
          </div>
        </button>
      </div>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        {activeTab === 'security' ? (
          <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '1.5rem', maxWidth: '500px' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} style={inputStyle} placeholder="••••••••" required />
            </div>
            <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} style={inputStyle} placeholder="Minimum 6 characters" required />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} style={inputStyle} placeholder="Confirm new password" required />
            </div>
            
            <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.875rem 2rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '12px' }}><Smartphone size={20} /></div>
                 <div>
                   <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '700' }}>WhatsApp Notifications</h4>
                   <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Get notified on WhatsApp when you receive a new order.</p>
                 </div>
               </div>
               <div style={{ position: 'relative', width: '44px', height: '22px', background: '#25D366', borderRadius: '11px', cursor: 'pointer' }}>
                 <div style={{ position: 'absolute', right: '2px', top: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%' }}></div>
               </div>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}><Globe size={20} /></div>
                 <div>
                   <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '700' }}>Email Alerts</h4>
                   <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Receive weekly reports and system updates via email.</p>
                 </div>
               </div>
               <div style={{ position: 'relative', width: '44px', height: '22px', background: '#e2e8f0', borderRadius: '11px', cursor: 'pointer' }}>
                 <div style={{ position: 'absolute', left: '2px', top: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%' }}></div>
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorSettings;

