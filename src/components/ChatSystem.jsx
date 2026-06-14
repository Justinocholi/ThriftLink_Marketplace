import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Image as ImageIcon,
  MoreVertical,
  Search,
  Loader2,
  User,
  Check,
  CheckCheck,
  Flag,
  ArrowLeft,
  Paperclip,
  Plus,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { messages as messagesApi, users as usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { useAuthGate } from '../context/UIContext';
import { useRealtime, useRealtimeEvent } from '../context/RealtimeContext';
import { Skeleton, SkeletonCircle, MessageThreadSkeleton } from './ui/Skeleton';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const MessageBubble = ({ msg, isMe }) => {
  const isImage = !!msg.image_url;
  const isRead = msg.is_read === 1 || !!msg.read_at;
  return (
    <div
      className="tl-gpu"
      style={{
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        animation: 'tl-pop 0.22s var(--tl-ease-out) both',
      }}
    >
      <div
        style={{
          padding: isImage ? 4 : '0.65rem 0.95rem',
          borderRadius: 16,
          background: isMe ? '#25D366' : 'white',
          color: isMe ? 'white' : '#0f172a',
          boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
          borderTopRightRadius: isMe ? 4 : 16,
          borderTopLeftRadius: isMe ? 16 : 4,
          border: isMe ? 'none' : '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {isImage && (
          <img
            src={msg.image_url}
            alt="attachment"
            style={{
              maxWidth: 260,
              maxHeight: 260,
              borderRadius: 12,
              display: 'block',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        )}
        {msg.content && (
          <p
            style={{
              margin: isImage ? '0.45rem 0.55rem 0.1rem' : 0,
              fontSize: '0.94rem',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </p>
        )}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: '0.7rem',
          color: '#94a3b8',
          textAlign: isMe ? 'right' : 'left',
          display: 'flex',
          gap: 4,
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          alignItems: 'center',
        }}
      >
        <span>{formatTime(msg.created_at)}</span>
        {isMe && (
          <span aria-label={isRead ? 'Read' : 'Delivered'}>
            {isRead ? <CheckCheck size={13} color="#22c55e" /> : <Check size={13} />}
          </span>
        )}
      </div>
    </div>
  );
};

const ChatSystem = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { openReport } = useAuthGate();
  const { emit: rtEmit, isOnline } = useRealtime();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [newChatResults, setNewChatResults] = useState([]);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await messagesApi.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!activeChat) return;
    if (!silent) setLoadingThread(true);
    try {
      const data = await messagesApi.getMessages(activeChat.partner_id);
      // Backend now returns { messages, partner }; tolerate either shape.
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages(data.messages || []);
        if (data.partner) setPartner(data.partner);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [activeChat]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Honor /user/messages?to=<userId> deep-links from product/vendor pages.
  // The conversation may not exist yet — open a synthetic active chat anyway;
  // ChatSystem fetches messages by partner id and renders an empty thread.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const to = params.get('to');
    if (!to || to === user.id) return;
    if (activeChat?.partner_id === to) return;
    setActiveChat({ partner_id: to, partner_name: '…' });
    // Strip the query string once consumed so refreshes don't keep re-opening.
    navigate(location.pathname, { replace: true });
  }, [location.search]);

  // Debounced user search inside the New-chat modal.
  useEffect(() => {
    if (!newChatOpen) return;
    const q = newChatQuery.trim();
    if (q.length < 2) {
      setNewChatResults([]);
      return;
    }
    setNewChatLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await usersApi.search(q);
        setNewChatResults(res.users || []);
      } catch (err) {
        console.error('user search failed', err);
        setNewChatResults([]);
      } finally {
        setNewChatLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [newChatOpen, newChatQuery]);

  const startChatWith = (u) => {
    setActiveChat({
      partner_id: u.id,
      partner_name: u.vendor_shop_name || u.name,
      partner_avatar: u.avatar,
    });
    setNewChatOpen(false);
    setNewChatQuery('');
    setNewChatResults([]);
  };

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      setPartner(null);
      return;
    }
    fetchMessages();
    // Tell the other end we're looking at the thread so their bubbles flip
    // to double-check immediately. Backend also marks messages as read in DB.
    rtEmit('message:read', { partnerId: activeChat.partner_id });
  }, [activeChat, fetchMessages, rtEmit]);

  // ---- Realtime: incoming message ----
  useRealtimeEvent('message:new', useCallback((m) => {
    if (!m) return;
    const involvesActive = activeChat && (
      m.sender_id === activeChat.partner_id ||
      m.receiver_id === activeChat.partner_id
    );
    if (involvesActive) {
      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, m];
      });
      // We are viewing this thread — immediately mark partner's messages as read.
      if (m.sender_id === activeChat.partner_id) {
        rtEmit('message:read', { partnerId: activeChat.partner_id });
      }
    } else if (m.receiver_id === user.id) {
      // Background ping — update sidebar previews.
      fetchConversations();
    }
    fetchConversations();
  }, [activeChat, fetchConversations, rtEmit, user.id]));

  // ---- Realtime: read receipts ----
  useRealtimeEvent('message:read', useCallback(({ by }) => {
    if (!activeChat || by !== activeChat.partner_id) return;
    setMessages((prev) =>
      prev.map((m) => (m.sender_id === user.id && !m.is_read ? { ...m, is_read: 1 } : m))
    );
  }, [activeChat, user.id]));

  // ---- Realtime: typing ----
  useRealtimeEvent('typing', useCallback(({ from }) => {
    if (!activeChat || from !== activeChat.partner_id) return;
    setPartner((p) => ({ ...(p || {}), is_typing: true }));
    clearTimeout(window.__tlTypingTimer);
    window.__tlTypingTimer = setTimeout(() => {
      setPartner((p) => p && { ...p, is_typing: false });
    }, 3500);
  }, [activeChat]));

  // ---- Realtime: partner presence ----
  useRealtimeEvent('presence:change', useCallback(({ userId, online }) => {
    if (activeChat && userId === activeChat.partner_id) {
      setPartner((p) => ({ ...(p || {}), is_online: online }));
    }
    setConversations((prev) =>
      prev.map((c) => (c.partner_id === userId ? { ...c, is_online: online } : c))
    );
  }, [activeChat]));

  const handleTyping = (value) => {
    setNewMessage(value);
    if (!activeChat) return;
    if (typingTimerRef.current) return; // throttle to ~one ping per 3s
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, 3000);
    rtEmit('typing', { to: activeChat.partner_id });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);

    // Optimistic UI
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: activeChat.partner_id,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: 0,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const draft = newMessage;
    setNewMessage('');

    try {
      const sent = await messagesApi.sendMessage(activeChat.partner_id, { content: draft });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m))
      );
      fetchConversations();
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    e.target.value = '';
    setUploading(true);
    try {
      const { url } = await messagesApi.uploadImage(file);
      const sent = await messagesApi.sendMessage(activeChat.partner_id, {
        content: '',
        image_url: url,
      });
      setMessages((prev) => [...prev, sent]);
      fetchConversations();
      toast.success('Image sent');
    } catch (err) {
      toast.error(err.message || 'Failed to send image');
    } finally {
      setUploading(false);
    }
  };

  const handleReportPartner = () => {
    if (!partner && !activeChat) return;
    const targetId = partner?.id || activeChat?.partner_id;
    const targetName = partner?.name || activeChat?.partner_name;
    setShowMenu(false);
    openReport({ targetType: 'user', targetId, targetName });
  };

  const filtered = conversations.filter((c) =>
    !search ? true : (c.partner_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="tl-chat-shell"
      data-active-chat={activeChat ? '1' : '0'}
      style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        height: 'calc(100vh - 200px)',
        minHeight: 520,
        display: 'flex',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Sidebar */}
      <div
        className="tl-chat-sidebar"
        style={{
          width: 340,
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="tl-input"
                style={{ paddingLeft: '2.4rem', background: '#f8fafc' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              title="Start a new chat"
              aria-label="Start a new chat"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: '#0f172a', color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && conversations.length === 0 ? (
            <div style={{ padding: '1rem' }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0' }}
                >
                  <SkeletonCircle size={44} />
                  <div style={{ flex: 1 }}>
                    <Skeleton height={12} width="60%" />
                    <div style={{ height: 6 }} />
                    <Skeleton height={10} width="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              <p>No conversations yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                Tap “Chat Seller” on any listing to start a conversation.
              </p>
            </div>
          ) : (
            filtered.map((chat) => (
              <button
                key={chat.partner_id}
                onClick={() => setActiveChat(chat)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  gap: 12,
                  cursor: 'pointer',
                  background: activeChat?.partner_id === chat.partner_id ? '#f0fdf4' : 'white',
                  borderBottom: '1px solid #f1f5f9',
                  border: 'none',
                  borderLeft: activeChat?.partner_id === chat.partner_id
                    ? '3px solid #25D366'
                    : '3px solid transparent',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {chat.partner_avatar ? (
                      <img
                        src={chat.partner_avatar}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={22} color="#94a3b8" />
                    )}
                  </div>
                  <span
                    className={chat.is_online ? 'tl-online-dot' : 'tl-offline-dot'}
                    style={{ position: 'absolute', bottom: -2, right: -2 }}
                    aria-hidden
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <h4
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {chat.partner_name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {formatTime(chat.last_message_time)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    {chat.is_typing ? (
                      <span style={{ color: '#22c55e', fontSize: '0.82rem', fontStyle: 'italic' }}>
                        typing...
                      </span>
                    ) : (
                      <p
                        style={{
                          color: '#64748b',
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0,
                          fontWeight: chat.unread_count > 0 ? 700 : 400,
                        }}
                      >
                        {chat.last_image ? '📷 Photo' : chat.last_message || 'No messages yet'}
                      </p>
                    )}
                    {chat.unread_count > 0 && (
                      <span
                        style={{
                          background: '#25D366',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 999,
                          fontWeight: 700,
                          minWidth: 18,
                          textAlign: 'center',
                        }}
                      >
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main */}
      <div
        className="tl-chat-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}
      >
        {activeChat ? (
          <>
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setActiveChat(null)}
                  className="tl-chat-back"
                  aria-label="Back"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'none',
                    padding: 4,
                  }}
                >
                  <ArrowLeft size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {activeChat.partner_avatar ? (
                      <img
                        src={activeChat.partner_avatar}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={20} color="#94a3b8" />
                    )}
                  </div>
                  <span
                    className={partner?.is_online || activeChat.is_online ? 'tl-online-dot' : 'tl-offline-dot'}
                    style={{ position: 'absolute', bottom: -2, right: -2 }}
                    aria-hidden
                  />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                    {activeChat.partner_name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: partner?.is_online ? '#22c55e' : '#94a3b8' }}>
                    {partner?.is_typing
                      ? 'typing…'
                      : partner?.is_online || activeChat.is_online
                      ? 'Online now'
                      : 'Last seen recently'}
                  </span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6 }}
                  aria-label="More options"
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      background: 'white',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                      width: 200,
                      padding: 4,
                      zIndex: 50,
                      animation: 'tl-pop 0.2s var(--tl-ease-out) both',
                    }}
                  >
                    <button
                      onClick={handleReportPartner}
                      style={menuBtnStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Flag size={16} color="#ef4444" /> Report user
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: '1.25rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {loadingThread && messages.length === 0 ? (
                <MessageThreadSkeleton />
              ) : messages.length === 0 ? (
                <div
                  style={{
                    margin: 'auto',
                    textAlign: 'center',
                    color: '#94a3b8',
                    padding: '2rem',
                  }}
                >
                  Say hello 👋 — start the conversation.
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} isMe={m.sender_id === user.id} />
                ))
              )}
              {partner?.is_typing && (
                <div className="tl-typing" style={{ alignSelf: 'flex-start' }} aria-live="polite">
                  <span /> <span /> <span />
                </div>
              )}
              <div ref={messagesEndRef} />

              {/* Inline safety tip */}
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  color: '#92400e',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  alignSelf: 'center',
                  maxWidth: 460,
                }}
              >
                Never share OTPs, bank PINs or pay before inspecting items. Report suspicious chats anytime.
              </div>
            </div>

            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '0.85rem 1.25rem',
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImagePick}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6 }}
                aria-label="Attach image"
                title="Attach image"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                className="tl-input"
                style={{ flex: 1, padding: '0.7rem 1rem', background: '#f8fafc' }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="tl-btn tl-btn-primary"
                style={{ width: 44, height: 44, padding: 0, borderRadius: 12 }}
                aria-label="Send"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '2rem',
            }}
            className="tl-chat-empty"
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: '#f1f5f9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Send size={36} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Select a conversation
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Choose a chat from the list or message a seller from any product page.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .tl-chat-shell { height: calc(100vh - 160px) !important; }
          .tl-chat-sidebar { width: 100% !important; border-right: none !important; }
          .tl-chat-shell[data-active-chat="1"] .tl-chat-sidebar { display: none !important; }
          .tl-chat-shell[data-active-chat="0"] .tl-chat-main { display: none !important; }
          .tl-chat-back { display: inline-flex !important; }
          .tl-chat-empty { display: none !important; }
        }
      `}</style>

      {newChatOpen && (
        <div
          onClick={() => setNewChatOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16,
              maxWidth: 480, width: '100%', maxHeight: '80vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Start a new chat
              </h3>
              <button
                onClick={() => setNewChatOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  value={newChatQuery}
                  onChange={(e) => setNewChatQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  autoFocus
                  className="tl-input"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Find buyers and vendors to message.
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
              {newChatLoading && (
                <div style={{ padding: '1rem 1.25rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={14} className="tl-spin" /> Searching…
                </div>
              )}
              {!newChatLoading && newChatQuery.trim().length >= 2 && newChatResults.length === 0 && (
                <div style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
                  No users found.
                </div>
              )}
              {!newChatLoading && newChatQuery.trim().length < 2 && (
                <div style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Type at least 2 characters to search.
                </div>
              )}
              {newChatResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startChatWith(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '0.7rem 1.25rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: u.avatar ? `url(${u.avatar}) center/cover` : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', flexShrink: 0,
                  }}>
                    {!u.avatar && <User size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.vendor_shop_name || u.name}
                      </span>
                      {u.vendor_is_verified ? (
                        <ShieldCheck size={14} color="#16a34a" />
                      ) : null}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'capitalize' }}>
                      {u.role}{u.city ? ` • ${u.city}` : ''}{u.state ? `, ${u.state}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const menuBtnStyle = {
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: '0.6rem 0.75rem',
  fontSize: '0.88rem',
  borderRadius: 8,
  cursor: 'pointer',
  color: '#0f172a',
};

export default ChatSystem;
