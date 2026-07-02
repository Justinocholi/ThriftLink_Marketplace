import React from 'react';

const tones = {
  green: { background: 'var(--tl-green-tint)', color: 'var(--tl-green-dark)' },
  blue: { background: '#eff6ff', color: '#2563eb' },
  amber: { background: '#fffbeb', color: '#b45309' },
  red: { background: '#fef2f2', color: '#dc2626' },
  neutral: { background: '#f1f5f9', color: 'var(--tl-muted)' },
};

export default function TlBadge({ tone = 'neutral', style, children, ...rest }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.7rem',
        borderRadius: 'var(--tl-radius-pill)',
        fontSize: 'var(--tl-text-xs)',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...tones[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
