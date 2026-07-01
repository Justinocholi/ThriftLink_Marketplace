import React from 'react';

export default function SectionHeading({ eyebrow, title, sub, align = 'center', style }) {
  return (
    <div style={{ textAlign: align, marginBottom: 'var(--tl-space-4)', ...style }}>
      {eyebrow && (
        <div
          style={{
            color: 'var(--tl-green-dark)',
            fontSize: 'var(--tl-text-xs)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          fontSize: 'var(--tl-text-h2)',
          fontWeight: 700,
          color: 'var(--tl-ink)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            color: 'var(--tl-muted)',
            fontSize: 'var(--tl-text-body)',
            maxWidth: '620px',
            margin: align === 'center' ? '0.75rem auto 0' : '0.75rem 0 0',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
