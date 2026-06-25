import React, { useState, useEffect, useCallback } from 'react';
import { userMe } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Bell, MapPin, Camera, Loader2, Save } from 'lucide-react';
import PasswordField from '../../components/PasswordField';
import { useFocusRefetch } from '../../hooks/useFetch';

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River',
  'Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe','Imo','Jigawa','Kaduna',
  'Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo',
  'Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

const UserProfile = () => {
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ name: '', phone: '', state: '', city: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(() => {
    userMe.getProfile()
      .then(p => {
        setForm({ name: p.name || '', phone: p.phone || '', state: p.state || '', city: p.city || '' });
        if (p.avatar) setAvatarPreview(p.avatar);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useFocusRefetch(loadProfile);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePasswordChange = e => setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) { 
      setAvatarFile(file); 
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      let newAvatarUrl = null;
      if (avatarFile) {
        const result = await userMe.uploadAvatar(avatarFile);
        setAvatarPreview(result.url);
        setAvatarFile(null);
        newAvatarUrl = result.url;
      }
      const updated = await userMe.updateProfile(form);
      updateUser({ name: updated.name, ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}) });
      setMessage('Profile updated successfully!');
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Loader2 className="animate-spin" size={32} color="#3b82f6" />
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Account Settings</h2>
        <p style={{ color: '#64748b' }}>Manage your profile information and security preferences.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'profile' ? '#3b82f6' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Profile Information
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'security' ? '#3b82f6' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} /> Security
          </div>
        </button>
      </div>

      {/* Notifications */}
      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '2rem' }}>
            <div>
              <label style={labelStyle}>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={40} color="#cbd5e1" />
                    )}
                  </div>
                  <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '0', right: '0', background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Camera size={16} />
                  </label>
                  <input type="file" accept="image/*" id="avatar-upload" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Avatar Photo</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>Upload a new profile picture.<br />JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="+2348012345678" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>State</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <select name="state" value={form.state} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '2.75rem' }}>
                    <option value="">Select State</option>
                    {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>City / Area</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} style={inputStyle} placeholder="e.g. Yaba, Lagos" />
              </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
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
              <button type="submit" disabled={saving} style={{ padding: '0.875rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
                Update Password
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default UserProfile;

