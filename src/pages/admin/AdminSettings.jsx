import React, { useState } from 'react';
import { Shield, Lock, Bell, Mail, Loader2, Save, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userMe } from '../../services/api';
import PasswordField from '../../components/PasswordField';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileChange = e => setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePasswordChange = e => setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const updated = await userMe.updateProfile(profileForm);
      updateUser({ name: updated.name });
      setMessage('Admin profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
      setMessage('Admin password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.875rem' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Admin Account Settings</h2>
        <p style={{ color: '#64748b' }}>Manage your administrative credentials and security preferences.</p>
      </div>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('profile')} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'profile' ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>Profile</button>
        <button onClick={() => setActiveTab('security')} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'security' ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>Security</button>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.5rem' }}>
             <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                   <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                   <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} style={{ ...inputStyle, paddingLeft: '2.75rem' }} required />
                </div>
             </div>
             <div>
                <label style={labelStyle}>Admin Email (Read-only)</label>
                <div style={{ position: 'relative' }}>
                   <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                   <input type="email" value={profileForm.email} readOnly style={{ ...inputStyle, paddingLeft: '2.75rem', background: '#f8fafc', color: '#64748b' }} />
                </div>
             </div>
             <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                   {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                   Save Profile
                </button>
             </div>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '1.5rem', maxWidth: '500px' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <PasswordField name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
            <div>
              <label style={labelStyle}>New Password</label>
              <PasswordField name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Minimum 6 characters" autoComplete="new-password" minLength={6} required />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <PasswordField name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" autoComplete="new-password" required />
            </div>
            
            <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.875rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
