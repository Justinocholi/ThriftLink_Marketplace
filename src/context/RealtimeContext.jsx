import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSocket, closeSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';

const RealtimeContext = createContext(null);

/**
 * Single source of truth for the WebSocket connection.
 *
 * Components subscribe to specific server events via `useRealtimeEvent(event, handler)`
 * and read presence / connection state via `useRealtime()`.
 */
export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [notifications, setNotifications] = useState([]);
  const handlersRef = useRef(new Map()); // event -> Set<fn>

  // Re-emit every server event into the local pub/sub so multiple components
  // can react to the same event independently.
  const dispatch = useCallback((event, payload) => {
    const set = handlersRef.current.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error('Realtime handler failed:', e); }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      closeSocket();
      setConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err) => console.warn('socket connect_error:', err.message);

    const onPresence = ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
      dispatch('presence:change', { userId, online });
    };

    const onNotification = (n) => {
      setNotifications((prev) => [{ ...n, _seen: false, _at: Date.now() }, ...prev].slice(0, 50));
      if (n?.title) {
        const variant = n.type === 'warning' ? 'warning' : 'info';
        toast[variant]?.(n.title + (n.message ? ` — ${n.message}` : ''));
      }
      dispatch('notification:new', n);
    };

    // Generic relay for the rest of the events we care about so subscribers
    // can listen via useRealtimeEvent without us listing each one twice.
    const relayEvents = [
      'message:new',
      'message:read',
      'typing',
      'cart:updated',
      'order:new',
      'order:updated',
      'report:new',
      'report:updated',
      'product:created',
      'product:updated',
      'product:removed',
      'review:new',
      'vendor:verification',
      'vendor:updated',
      'user:updated',
      'account:status',
    ];

    const relayHandlers = relayEvents.map((evt) => {
      const h = (payload) => dispatch(evt, payload);
      socket.on(evt, h);
      return [evt, h];
    });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('presence:change', onPresence);
    socket.on('notification:new', onNotification);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('presence:change', onPresence);
      socket.off('notification:new', onNotification);
      relayHandlers.forEach(([evt, h]) => socket.off(evt, h));
    };
  }, [user?.id]);

  const subscribe = useCallback((event, handler) => {
    let set = handlersRef.current.get(event);
    if (!set) {
      set = new Set();
      handlersRef.current.set(event, set);
    }
    set.add(handler);
    return () => set.delete(handler);
  }, []);

  const emit = useCallback((event, payload) => {
    const socket = getSocket();
    socket?.emit(event, payload);
  }, []);

  const markNotificationsSeen = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, _seen: true })));
  }, []);

  const isOnline = useCallback((userId) => onlineUsers.has(userId), [onlineUsers]);

  const value = {
    connected,
    onlineUsers,
    notifications,
    unreadNotifications: notifications.filter((n) => !n._seen).length,
    isOnline,
    subscribe,
    emit,
    markNotificationsSeen,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    return {
      connected: false,
      onlineUsers: new Set(),
      notifications: [],
      unreadNotifications: 0,
      isOnline: () => false,
      subscribe: () => () => {},
      emit: () => {},
      markNotificationsSeen: () => {},
    };
  }
  return ctx;
};

export const useRealtimeEvent = (event, handler) => {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    return subscribe(event, (payload) => handlerRef.current?.(payload));
  }, [event, subscribe]);
};
