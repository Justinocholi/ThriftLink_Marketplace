import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

let counter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++counter;
      const next = { id, type: 'success', duration: 3500, ...toast };
      setToasts((prev) => [...prev, next]);
      if (next.duration > 0) {
        setTimeout(() => dismiss(id), next.duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    show: push,
    success: (message, opts = {}) => push({ ...opts, message, type: 'success' }),
    error: (message, opts = {}) => push({ ...opts, message, type: 'error' }),
    info: (message, opts = {}) => push({ ...opts, message, type: 'info' }),
    warning: (message, opts = {}) => push({ ...opts, message, type: 'warning' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="tl-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const iconFor = (type) => {
  if (type === 'success') return <CheckCircle2 size={20} color="#25D366" />;
  if (type === 'error') return <XCircle size={20} color="#ef4444" />;
  if (type === 'warning') return <AlertTriangle size={20} color="#f59e0b" />;
  return <Info size={20} color="#3b82f6" />;
};

const ToastItem = ({ toast, onClose }) => (
  <div className={`tl-toast ${toast.type}`} role="status">
    {iconFor(toast.type)}
    <div style={{ flex: 1 }}>
      {toast.title && (
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{toast.title}</div>
      )}
      <div>{toast.message}</div>
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94a3b8',
        padding: 0,
        display: 'flex',
      }}
      aria-label="Dismiss"
    >
      <X size={16} />
    </button>
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback so calls don't crash before provider mounts.
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
};

export default ToastProvider;
