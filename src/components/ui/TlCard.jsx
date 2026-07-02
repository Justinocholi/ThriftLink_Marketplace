import React from 'react';

export default function TlCard({ hover = false, className = '', style, children, ...rest }) {
  const cls = `tl-card ${hover ? 'tl-card-hover' : ''} ${className}`.trim();
  return (
    <div className={cls} style={style} {...rest}>
      {children}
    </div>
  );
}
