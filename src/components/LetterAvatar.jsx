import React from 'react';

const PALETTE = ['#25D366', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#0ea5e9'];

function colorFor(seed) {
  if (!seed) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function LetterAvatar({ name = '', src, size = 40, fontSize, style = {}, alt }) {
  const hasRealImage = src && typeof src === 'string' && !src.includes('dicebear.com');
  const letter = (String(name).trim()[0] || '?').toUpperCase();
  const bg = colorFor(name || letter);

  const dim = typeof size === 'number' ? `${size}px` : size;
  const fz = fontSize || (typeof size === 'number' ? `${Math.round(size * 0.45)}px` : '1rem');

  if (hasRealImage) {
    return (
      <img
        src={src}
        alt={alt || name}
        style={{ width: dim, height: dim, borderRadius: '50%', objectFit: 'cover', ...style }}
      />
    );
  }
  return (
    <div
      aria-label={alt || name || 'Avatar'}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: bg,
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: fz,
        lineHeight: 1,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {letter}
    </div>
  );
}
