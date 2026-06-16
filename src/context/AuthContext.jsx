import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth as authApi } from '../services/api';
import { identifyUser, resetUser, trackEvent } from '../analytics/posthog';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(({ user }) => {
          setUser(user);
          identifyUser(user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user } = await authApi.login(email, password);
      localStorage.setItem('token', token);
      setUser(user);
      identifyUser(user);
      trackEvent('user_logged_in', { role: user.role });
      return { success: true, type: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (payload) => {
    try {
      const res = await authApi.register(payload);
      // When Supabase requires email confirmation the backend returns 202
      // with { requiresEmailConfirmation: true } and no token. We surface this
      // to the caller so the UI can show a "check your email" screen.
      if (res?.requiresEmailConfirmation) {
        trackEvent('user_registered', { role: payload.role, requires_confirmation: true });
        return { success: true, requiresEmailConfirmation: true, message: res.message };
      }
      const { token, user } = res;
      localStorage.setItem('token', token);
      setUser(user);
      identifyUser(user);
      trackEvent('user_registered', { role: user.role });
      return { success: true, type: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    trackEvent('user_logged_out');
    resetUser();
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
