import React, { useEffect, useRef, useState } from 'react';

const ProgressiveImage = ({ src, alt = '', className = '', style, lazy = true }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!lazy || inView) return;
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [lazy, inView]);

  return (
    <div
      ref={wrapRef}
      className={`tl-pimg ${loaded ? 'loaded' : ''} ${className}`}
      style={style}
    >
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
    </div>
  );
};

export default ProgressiveImage;
