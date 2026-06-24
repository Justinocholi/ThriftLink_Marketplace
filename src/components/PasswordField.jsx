import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ value, onChange, autoComplete, placeholder = 'Password', name = 'password', id, required, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        name={name}
        id={id}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        style={{ width: '100%', padding: '0.9rem 2.5rem 0.9rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }}
      />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
