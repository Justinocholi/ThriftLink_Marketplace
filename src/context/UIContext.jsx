import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import AuthModal from '../components/ui/AuthModal';
import ReportModal from '../components/ui/ReportModal';

const UIContext = createContext(null);

const PENDING_INTENT_KEY = 'tl_pending_intent';

export const UIProvider = ({ children }) => {
  const { user } = useAuth();
  const [authState, setAuthState] = useState({ open: false, intent: null });
  const [reportState, setReportState] = useState({
    open: false,
    targetType: 'product',
    targetId: null,
    targetName: null,
  });

  // Resume any pending intent after the user logs in (e.g. across reload).
  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem(PENDING_INTENT_KEY);
      if (!raw) return;
      const intent = JSON.parse(raw);
      sessionStorage.removeItem(PENDING_INTENT_KEY);
      if (intent?.path) {
        // Preserve scroll for SPA navigation.
        window.history.replaceState({}, '', intent.path);
      }
    } catch {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    }
  }, [user]);

  const requireAuth = useCallback(
    ({ label = 'continue', onAuthed, intentPath } = {}) => {
      if (user) {
        onAuthed?.();
        return true;
      }
      // Persist intent so a hard reload doesn't lose it.
      try {
        sessionStorage.setItem(
          PENDING_INTENT_KEY,
          JSON.stringify({ label, path: intentPath || window.location.pathname })
        );
      } catch {}
      setAuthState({
        open: true,
        intent: { label, onAuthed, intentPath: intentPath || window.location.pathname },
      });
      return false;
    },
    [user]
  );

  const openReport = useCallback(({ targetType, targetId, targetName }) => {
    setReportState({ open: true, targetType, targetId, targetName });
  }, []);

  const value = {
    requireAuth,
    openReport,
    closeAuth: () => setAuthState({ open: false, intent: null }),
  };

  const handleAuthSuccess = () => {
    const cb = authState.intent?.onAuthed;
    setAuthState({ open: false, intent: null });
    try {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    } catch {}
    // Defer to allow context to flush user state.
    setTimeout(() => cb?.(), 30);
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      <AuthModal
        open={authState.open}
        intent={authState.intent}
        onClose={() => setAuthState({ open: false, intent: null })}
        onSuccess={handleAuthSuccess}
      />
      <ReportModal
        open={reportState.open}
        targetType={reportState.targetType}
        targetId={reportState.targetId}
        targetName={reportState.targetName}
        onClose={() => setReportState({ open: false, targetType: 'product', targetId: null, targetName: null })}
      />
    </UIContext.Provider>
  );
};

export const useAuthGate = () => {
  const ctx = useContext(UIContext);
  if (!ctx) {
    return {
      requireAuth: ({ onAuthed } = {}) => {
        onAuthed?.();
        return true;
      },
      openReport: () => {},
      closeAuth: () => {},
    };
  }
  return ctx;
};

export const useReportGate = () => {
  const { openReport } = useAuthGate();
  return openReport;
};
