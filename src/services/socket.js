import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

/**
 * Lazy singleton — reuses the same socket for the whole tab, reconnects
 * automatically, and re-establishes when the JWT changes (login/logout).
 */
export function getSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket && currentToken === token && socket.connected !== false) {
    return socket;
  }

  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io({
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
