import React from 'react';

const FloatingActionButton = ({ icon, label, onClick, bottom, right, color = '#25D366' }) => (
  <button
    onClick={onClick}
    className="tl-fab"
    aria-label={label}
    title={label}
    style={{
      background: color,
      bottom: bottom != null ? bottom : undefined,
      right: right != null ? right : undefined,
    }}
  >
    {icon}
  </button>
);

export default FloatingActionButton;
