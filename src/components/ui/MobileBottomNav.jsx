import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, MessageCircle, Heart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/UIContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const is = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleProtected = (e, label, to) => {
    if (!user) {
      e.preventDefault();
      requireAuth({
        label,
        intentPath: to,
        onAuthed: () => {
          window.location.assign(to);
        },
      });
    }
  };

  const messagesPath = user?.role === 'vendor' ? '/vendor/messages' : '/user/messages';
  const savedPath = user?.role === 'vendor' ? '/vendor/products' : '/user/saved';
  const accountPath = !user
    ? '/login'
    : user.role === 'vendor'
    ? '/vendor'
    : user.role === 'admin'
    ? '/admin'
    : '/user';

  return (
    <nav className="tl-bottom-nav" aria-label="Primary mobile navigation">
      <Link to="/" className={is('/') && location.pathname === '/' ? 'active' : ''}>
        <Home size={20} />
        <span>Home</span>
      </Link>
      <Link to="/categories" className={is('/categories') ? 'active' : ''}>
        <Grid3X3 size={20} />
        <span>Browse</span>
      </Link>
      <Link
        to={messagesPath}
        onClick={(e) => handleProtected(e, 'view your messages', messagesPath)}
        className={is('/user/messages') || is('/vendor/messages') ? 'active' : ''}
      >
        <MessageCircle size={20} />
        <span>Chats</span>
      </Link>
      <Link
        to={savedPath}
        onClick={(e) => handleProtected(e, 'view saved items', savedPath)}
        className={is('/user/saved') ? 'active' : ''}
      >
        <Heart size={20} />
        <span>Saved</span>
      </Link>
      <Link
        to={accountPath}
        onClick={(e) => !user && handleProtected(e, 'access your account', accountPath)}
        className={is('/user') || is('/vendor') || is('/admin') ? 'active' : ''}
      >
        <User size={20} />
        <span>Account</span>
      </Link>
    </nav>
  );
};

export default MobileBottomNav;
