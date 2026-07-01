import React, { useState } from 'react';
import { admin } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';

const AdminReviews = () => {
  const { data, loading, error: fetchError, retry, setData } = useFetch(
    () => admin.reviews().then(d => d.reviews || d),
    []
  );
  const reviews = data || [];
  const setReviews = (updater) => setData(prev => updater(prev || []));
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);

  const handleApprove = async (id, is_approved) => {
    setActing(id);
    try {
      await admin.updateReview(id, is_approved);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: is_approved ? 1 : 0 } : r));
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    setActing(id);
    try {
      await admin.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 'bold' }}>Review Management</h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Moderate and manage customer reviews</p>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          All Reviews ({reviews.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading reviews...</div>
        ) : fetchError ? (
          <ErrorState error={fetchError} onRetry={retry} />
        ) : reviews.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
            <p>No reviews to moderate</p>
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ color: '#fbbf24', fontSize: '1rem', marginBottom: '0.25rem' }}>{'⭐'.repeat(r.rating)}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>by {r.user_name || 'User'} • {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                    background: r.is_approved ? '#dcfce7' : '#fef3c7',
                    color: r.is_approved ? '#15803d' : '#b45309',
                  }}>
                    {r.is_approved ? 'Approved' : 'Pending'}
                  </span>
                  <button
                    disabled={acting === r.id}
                    onClick={() => handleApprove(r.id, !r.is_approved)}
                    style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: r.is_approved ? '#fef3c7' : '#dcfce7', color: r.is_approved ? '#b45309' : '#15803d', fontWeight: '600', fontSize: '0.8rem' }}
                  >
                    {r.is_approved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button
                    disabled={acting === r.id}
                    onClick={() => handleDelete(r.id)}
                    style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: '600', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ color: '#475569', lineHeight: '1.6' }}>{r.comment}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
