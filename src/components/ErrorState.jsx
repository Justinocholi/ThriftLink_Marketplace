import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, onRetry, title = 'Something went wrong', message }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', maxWidth: 480, margin: '2rem auto' }}>
      <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem', display: 'block' }} />
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>
        {message || error?.message || 'We could not load this content. Please try again.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#25D366', color: 'white', border: 'none', borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
