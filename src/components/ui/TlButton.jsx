import React from 'react';
import { Link } from 'react-router-dom';

const sizes = {
  sm: { padding: '0.5rem 1rem', fontSize: 'var(--tl-text-sm)' },
  md: { padding: '0.75rem 1.5rem', fontSize: 'var(--tl-text-body)' },
  lg: { padding: '0.9rem 2rem', fontSize: '1.05rem' },
};

const variants = {
  primary: {
    background: 'var(--tl-green)',
    color: '#ffffff',
    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
  },
  secondary: {
    background: 'var(--tl-surface)',
    color: 'var(--tl-ink)',
    boxShadow: 'var(--tl-shadow-1)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--tl-muted)',
    boxShadow: 'none',
  },
};

export default function TlButton({
  variant = 'primary',
  size = 'md',
  full = false,
  to,
  style,
  children,
  className = '',
  ...rest
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    borderRadius: 'var(--tl-radius-pill)',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform var(--tl-fast) var(--tl-ease), box-shadow var(--tl-fast) var(--tl-ease), background var(--tl-fast) var(--tl-ease)',
    width: full ? '100%' : undefined,
    ...sizes[size],
    ...variants[variant],
    ...style,
  };
  const cls = `tl-btn-press ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={cls} style={baseStyle} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} style={baseStyle} {...rest}>
      {children}
    </button>
  );
}
