import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'tl_install_dismissed';
const SHOW_AFTER_MS = 30_000;

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (!isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    setIos(isIOS());

    const onBIP = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
      }
    } catch {}
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 80,
        zIndex: 9999,
        maxWidth: 320,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        padding: 14,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      role="dialog"
      aria-label="Install ThriftLink"
    >
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#111827' }}>
        Install ThriftLink
      </div>
      <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12, lineHeight: 1.4 }}>
        {ios
          ? 'Install ThriftLink for the full app experience. Tap Share, then "Add to Home Screen".'
          : 'Install ThriftLink for the full app experience.'}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={dismiss}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        {!ios && (
          <button
            onClick={install}
            disabled={!deferredPrompt}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: deferredPrompt ? '#25D366' : '#9ca3af',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              cursor: deferredPrompt ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
