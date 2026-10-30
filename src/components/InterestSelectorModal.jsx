import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, MapPin, Tag, Palette, CheckCircle2, Loader2 } from 'lucide-react';
import { recommendations as recApi, userMe } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CATEGORIES_LIST = [
  'Fashion & Clothing',
  'Shoes & Footwear',
  'Bags & Accessories',
  'Jewelry & Watches',
  'Beauty & Skincare',
  'Electronics',
  'Home & Kitchen',
  'Books & Education',
];

export const STYLES_LIST = [
  'Vintage & Retro',
  '90s & Y2K',
  'Streetwear & Casual',
  'Chic & Corporate',
  'Luxury & Designer',
  'Everyday Budget Thrift',
];

export const LOCATIONS_LIST = [
  'Lagos',
  'Abuja (FCT)',
  'Rivers (Port Harcourt)',
  'Oyo (Ibadan)',
  'Edo (Benin)',
  'Enugu',
  'Delta',
  'Nationwide',
];

const InterestSelectorModal = ({ isOpen, onClose, onSaved }) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setLoading(true);
        recApi.getUserInterests()
          .then((res) => {
            setSelected(Array.isArray(res.interests) ? res.interests : []);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        try {
          const cached = JSON.parse(localStorage.getItem('tl_guest_interests') || '[]');
          setSelected(cached);
        } catch (_) {}
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Immediate save on every change
  const persistChanges = async (newSelected, stateToUpdate = null) => {
    setSaveStatus('saving');
    try {
      if (user) {
        await recApi.setUserInterests(newSelected);
        if (stateToUpdate && stateToUpdate !== 'Nationwide') {
          userMe.updateProfile({ state: stateToUpdate }).catch(() => {});
        }
      } else {
        localStorage.setItem('tl_guest_interests', JSON.stringify(newSelected));
      }
      setSaveStatus('saved');
      if (onSaved) onSaved(newSelected);
      setTimeout(() => {
        setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 1800);
    } catch (err) {
      console.error('Failed to auto-save interests:', err);
      setSaveStatus('idle');
    }
  };

  const toggleItem = (item, isLocation = false) => {
    setSelected((prev) => {
      let updated;
      if (isLocation) {
        // Only allow one primary location selected at a time
        const withoutLocations = prev.filter((i) => !LOCATIONS_LIST.includes(i));
        if (prev.includes(item)) {
          updated = withoutLocations;
        } else {
          updated = [...withoutLocations, item];
        }
        persistChanges(updated, prev.includes(item) ? null : item.replace(' (FCT)', '').replace(' (Port Harcourt)', '').replace(' (Ibadan)', '').replace(' (Benin)', ''));
      } else {
        updated = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
        persistChanges(updated);
      }
      return updated;
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.75rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
              <Sparkles size={15} /> Personalize Your ThriftLink Feed
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
              Your Thrifting Preferences
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
              Select what you love to discover matching verified thrift vendors.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
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
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2" />
              Loading preferences...
            </div>
          ) : (
            <>
              {/* Section 1: Categories */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                  <Tag size={16} color="#059669" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    What items are you looking for?
                  </h4>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                  {CATEGORIES_LIST.map((cat) => {
                    const isSelected = selected.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleItem(cat)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0.5rem 0.95rem',
                          borderRadius: 999,
                          border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc',
                          color: isSelected ? '#047857' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Style Preference */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                  <Palette size={16} color="#3b82f6" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    What style do you prefer?
                  </h4>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                  {STYLES_LIST.map((style) => {
                    const isSelected = selected.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleItem(style)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0.5rem 0.95rem',
                          borderRadius: 999,
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Location */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                  <MapPin size={16} color="#8b5cf6" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Preferred Vendor Location
                  </h4>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                  {LOCATIONS_LIST.map((loc) => {
                    const isSelected = selected.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleItem(loc, true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0.5rem 0.95rem',
                          borderRadius: 999,
                          border: isSelected ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#f8fafc',
                          color: isSelected ? '#6d28d9' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Instant Save Status */}
        <div style={{ padding: '1rem 2rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
            {saveStatus === 'saving' ? (
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Loader2 size={14} className="animate-spin" /> Saving changes...
              </span>
            ) : saveStatus === 'saved' ? (
              <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                <CheckCircle2 size={15} color="#059669" /> All changes saved
              </span>
            ) : (
              <span style={{ color: '#94a3b8' }}>
                {selected.length} preference{selected.length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 12,
              border: 'none',
              background: '#0f172a',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelectorModal;