import React from 'react';

export const Skeleton = ({ width, height, radius = 8, style }) => (
  <span
    className="tl-skel"
    style={{
      display: 'block',
      width: width || '100%',
      height: height || 14,
      borderRadius: radius,
      ...style,
    }}
  />
);

export const SkeletonCircle = ({ size = 48 }) => (
  <span
    className="tl-skel"
    style={{ display: 'block', width: size, height: size, borderRadius: '50%' }}
  />
);

export const ProductCardSkeleton = () => (
  <div className="tl-skel-card">
    <span className="tl-skel tl-skel-img" />
    <span className="tl-skel tl-skel-line lg" />
    <span className="tl-skel tl-skel-line w-70" />
    <span className="tl-skel tl-skel-line w-40" />
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '1.25rem',
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const VendorCardSkeleton = () => (
  <div className="tl-skel-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <SkeletonCircle size={56} />
    <div style={{ flex: 1 }}>
      <span className="tl-skel tl-skel-line lg w-70" />
      <span className="tl-skel tl-skel-line w-40" />
    </div>
  </div>
);

export const MessageThreadSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ alignSelf: i % 2 ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
        <span
          className="tl-skel"
          style={{ display: 'block', height: 36, width: 220, borderRadius: 14 }}
        />
      </div>
    ))}
  </div>
);

export default Skeleton;
