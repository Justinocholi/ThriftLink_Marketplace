import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { recommendations as recApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_CATEGORIES = [
  'Fashion & Clothing',
  'Electronics',
  'Shoes & Footwear',
  'Bags & Accessories',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Books & Education',
  'Sports & Fitness',
  'Baby & Kids',
  'Food & Drinks',
  'Automobiles',
  'General',
];

const InterestSelectorModal = ({ isOpen, onClose, onSaved }) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      recApi.getUserInterests()
        .then((res) => {
          setSelected(Array.isArray(res.interests) ? res.interests : []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleCategory = (cat) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        await recApi.setUserInterests(selected);
      } else {
        // Fallback for anonymous guests: store in localStorage
        localStorage.setItem('tl_guest_interests', JSON.stringify(selected));
      }
      if (onSaved) onSaved(selected);
      onClose();
    } catch (err) {
      console.error('Failed to save interests:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          animation: 'tl-modal-in 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.75rem 1.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16b865', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
              <Sparkles size={16} /> Personalize Your Experience
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              What do you love to thrift?
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.45 }}>
              Choose your interests to get recommended vendors matching your style.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories Chips Grid */}
        <div style={{ padding: '0.5rem 1.75rem 1.5rem', maxHeight: '340px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading preferences...</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.6rem 1rem',
                      borderRadius: 999,
                      border: isSelected ? '1.5px solid #16b865' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(22, 184, 101, 0.1)' : '#f8fafc',
                      color: isSelected ? '#15803d' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ padding: '1rem 1.75rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #1ed373 0%, #16b865 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 8px 16px -4px rgba(22, 184, 101, 0.4)',
            }}
          >
            {saving ? 'Saving...' : `Save Interests (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelectorModal;
