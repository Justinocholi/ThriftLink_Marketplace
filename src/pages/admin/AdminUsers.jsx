import React, { useState } from 'react';
import { admin } from '../../services/api';
import { Search, Filter, Shield, MoreVertical, Loader2, UserCheck, UserX, Mail, MapPin } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const AdminUsers = () => {
  const { data, loading, error: fetchError, retry, setData } = useFetch(
    () => admin.users().then(d => d.users || d),
    []
  );
  const users = data || [];
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleStatus = async (id, is_active) => {
    setActing(id);
    try {
      await admin.setUserStatus(id, is_active ? 0 : 1);
      setData(prev => (prev || []).map(u => u.id === id ? { ...u, is_active: is_active ? 0 : 1 } : u));
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Loader2 className="animate-spin" size={32} color="#3b82f6" />
    </div>
  );

  if (fetchError) return <ErrorState error={fetchError} onRetry={retry} />;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>User Management</h2>
          <p style={{ color: '#64748b' }}>Monitor and moderate user accounts across the platform.</p>
        </div>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '0.95rem' }} 
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
            <Filter size={18} /> Filters
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {['User Info', 'Role', 'Location', 'Joined', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0 1rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ background: '#ffffff', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#3b82f6' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{user.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.8rem' }}><Mail size={12} /> {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ 
                      background: user.role === 'admin' ? '#ede9fe' : user.role === 'vendor' ? '#dbeafe' : '#f1f5f9', 
                      color: user.role === 'admin' ? '#6d28d9' : user.role === 'vendor' ? '#1d4ed8' : '#475569', 
                      padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'capitalize' 
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <MapPin size={14} /> {user.state || 'Not set'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: user.is_active ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.is_active ? '#10b981' : '#ef4444' }}></div>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>
                    {user.role !== 'admin' && (
                      <button
                        disabled={acting === user.id}
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        style={{ 
                          padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', 
                          background: user.is_active ? '#fff1f2' : '#f0fdf4', 
                          color: user.is_active ? '#e11d48' : '#16a34a', 
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                        }}
                      >
                        {acting === user.id ? <Loader2 size={14} className="animate-spin" /> : (user.is_active ? <UserX size={14} /> : <UserCheck size={14} />)}
                        {user.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p>No users found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

