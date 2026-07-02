import React, { useState } from 'react';
import { Heart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userMe } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';
import { ROUTES } from '../../routes';

const UserSaved = () => {
  const { data, loading, error, retry, setData } = useFetch(() => userMe.getSaved(), []);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const saved = data || [];

  const handleUnsave = async (id) => {
    try {
      await userMe.unsaveItem(id);
      setData(prev => (prev || []).filter(item => item.id !== id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading saved items...</div>;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        Saved Items ({saved.length})
      </h4>

      {actionError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionError}</div>}

      {saved.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ marginBottom: '1rem' }}><Heart size={48} strokeWidth={1.5} /></div>
          <p>No saved items yet. Browse vendors to save items you like!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {saved.map(item => {
            const images = (() => { try { return JSON.parse(item.images || '[]'); } catch { return []; } })();
            const img = images[0];
            return (
              <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '200px', background: '#f1f5f9', cursor: 'pointer' }}
                  onClick={() => item.product_id && navigate(ROUTES.product(item.product_id))}>
                  {img
                    ? <img src={img} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Package size={32} strokeWidth={1.5} /></div>}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnsave(item.id); }}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    title="Remove from saved"
                  >
                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                  </button>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    {item.product_name || 'Product'}
                  </h5>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {item.vendor_name || item.shop_name || ''}
                  </p>
                  {item.price && (
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>₦{Number(item.price).toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSaved;
