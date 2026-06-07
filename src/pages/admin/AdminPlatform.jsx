import React, { useState } from 'react';
import { ShieldCheck, Settings, Bell, Database, Globe, Lock, Loader2, Save } from 'lucide-react';

const AdminPlatform = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Platform settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.875rem' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Platform Management</h2>
        <p style={{ color: '#64748b' }}>Configure global system settings, maintenance modes, and security policies.</p>
      </div>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{message}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('general')} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'general' ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>General</button>
        <button onClick={() => setActiveTab('security')} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'security' ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>Security</button>
        <button onClick={() => setActiveTab('notifications')} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'notifications' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'notifications' ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>System Emails</button>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Platform Name</label>
                <input type="text" defaultValue="Thrift-Link" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Support Email</label>
                <input type="email" defaultValue="support@thriftlink.com" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Maintenance Mode</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <div style={{ position: 'relative', width: '44px', height: '22px', background: '#e2e8f0', borderRadius: '11px', cursor: 'pointer' }}>
                   <div style={{ position: 'absolute', left: '2px', top: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%' }}></div>
                 </div>
                 <span style={{ fontSize: '0.9rem', color: '#475569' }}>Enable to prevent users from accessing the platform during updates.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div>
              <label style={labelStyle}>Session Timeout (Minutes)</label>
              <input type="number" defaultValue="120" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vendor Verification Policy</label>
              <select style={inputStyle}>
                <option>Manual Approval Required (Default)</option>
                <option>Automatic Approval</option>
                <option>Semi-Automatic (ID Check Only)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>Order Confirmation Emails</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Send automated emails to buyers after successful checkout.</div>
              </div>
              <div style={{ position: 'relative', width: '44px', height: '22px', background: '#3b82f6', borderRadius: '11px', cursor: 'pointer' }}>
                 <div style={{ position: 'absolute', right: '2px', top: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%' }}></div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPlatform;
