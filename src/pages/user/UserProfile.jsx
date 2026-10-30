import React, { useState, useEffect, useCallback } from 'react';
import { userMe, recommendations as recApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Bell, MapPin, Camera, Loader2, Save, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import PasswordField from '../../components/PasswordField';
import InterestSelectorModal from '../../components/InterestSelectorModal';
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
  const [interests, setInterests] = useState([]);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tl_notification_prefs') || 'null');
      return saved || {
        followedVendorDrops: true,
        matchingNewVendors: true,
        savedVendorUpdates: true,
        enquiryReplies: true,
      };
    } catch {
      return {
        followedVendorDrops: true,
        matchingNewVendors: true,
        savedVendorUpdates: true,
        enquiryReplies: true,
      };
    }
  });

  const handleToggleNotifPref = (key) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('tl_notification_prefs', JSON.stringify(next));
      } catch {}
      return next;
    });
    setMessage('Notification preferences saved.');
    setTimeout(() => setMessage(''), 2200);
  };

  const loadInterests = useCallback(() => {
    recApi.getUserInterests()
      .then(res => setInterests(Array.isArray(res.interests) ? res.interests : []))
      .catch(() => {});
  }, []);

  const loadProfile = useCallback(() => {
    userMe.getProfile()
      .then(p => {
        setForm({ name: p.name || '', phone: p.phone || '', state: p.state || '', city: p.city || '' });
        if (p.avatar) setAvatarPreview(p.avatar);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    loadInterests();
  }, [loadInterests]);

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
        <button 
          onClick={() => setActiveTab('interests')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'interests' ? '2px solid #16b865' : '2px solid transparent',
            color: activeTab === 'interests' ? '#16b865' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Thrifting Interests ({interests.length})
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          style={{ 
            padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'notifications' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'notifications' ? '#3b82f6' : '#64748b', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} /> Notifications
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
        ) : activeTab === 'security' ? (
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
        ) : activeTab === 'interests' ? (
          <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                Your Thrifting Interests
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                We use your selected categories to personalize your vendor recommendations, catalog updates, and new arrivals feed.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {interests.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No categories selected yet. Click below to personalize your feed!
                </div>
              ) : (
                interests.map((cat) => (
                  <span
                    key={cat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 1rem',
                      borderRadius: 999,
                      background: 'rgba(22, 184, 101, 0.1)',
                      color: '#15803d',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    <Check size={14} />
                    {cat}
                  </span>
                ))
              )}
            </div>

            <div style={{ paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setInterestModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.8rem 1.5rem',
                  borderRadius: 12,
                  background: '#16b865',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px -4px rgba(22, 184, 101, 0.4)',
                }}
              >
                <SlidersHorizontal size={16} />
                Manage Categories
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '640px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                Notification Controls
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                Choose which updates you want to receive so ThriftLink stays helpful and never feels noisy.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                {
                  key: 'followedVendorDrops',
                  title: 'Followed Vendor Drops',
                  desc: 'Get notified when a vendor you follow uploads a new catalog item or collection.',
                },
                {
                  key: 'matchingNewVendors',
                  title: 'New Matching Verified Vendors',
                  desc: 'Receive alerts when newly verified vendors match your saved categories, style, or city.',
                },
                {
                  key: 'savedVendorUpdates',
                  title: 'Saved Item & Catalog Updates',
                  desc: 'Get notified when items or vendors you saved update availability or pricing.',
                },
                {
                  key: 'enquiryReplies',
                  title: 'Enquiry & Message Responses',
                  desc: 'Immediate alerts when a vendor replies to your product enquiry or message.',
                },
              ].map((item) => {
                const enabled = Boolean(notifPrefs[item.key]);
                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: enabled ? '#f8fafc' : 'white',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                        {item.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotifPref(item.key)}
                      aria-pressed={enabled}
                      style={{
                        width: 48,
                        height: 26,
                        borderRadius: 999,
                        border: 'none',
                        background: enabled ? '#16b865' : '#cbd5e1',
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: enabled ? 25 : 3,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <InterestSelectorModal
          isOpen={interestModalOpen}
          onClose={() => setInterestModalOpen(false)}
          onSaved={(updated) => {
            if (Array.isArray(updated)) setInterests(updated);
            loadInterests();
          }}
          initialInterests={interests}
        />

      </div>
    </div>
  );
};

export default UserProfile;

