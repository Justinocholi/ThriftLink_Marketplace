import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Twitter, Instagram } from 'lucide-react';
import logo from '../assets/thriftlink-logo-.png';

const COL_TITLE = {
  fontSize: '0.85rem',
  fontWeight: 800,
  color: '#0f172a',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.85rem'
};
const LINK_STYLE = {
  color: '#475569',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  display: 'block',
  padding: '0.3rem 0',
  transition: 'color 0.15s'
};

const Footer = () => {
  return (
    <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#475569', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .tl-footer-grid { display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 2.5rem; padding: 3rem 1.5rem 2rem; max-width: 1280px; margin: 0 auto; }
        .tl-footer-link:hover { color: #25D366 !important; }
        .tl-footer-social { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; background: white; border: 1px solid #e2e8f0; color: #475569; transition: all 0.15s; }
        .tl-footer-social:hover { color: #25D366; border-color: #25D366; transform: translateY(-1px); }
        @media (max-width: 900px) {
          .tl-footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2.25rem 1.25rem 1.5rem; }
          .tl-footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 400px) {
          .tl-footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="tl-footer-grid">
        <div className="tl-footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <img src={logo} alt="ThriftLink" style={{ height: 56, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>ThriftLink</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.55, maxWidth: 360 }}>
            Verified WhatsApp thrift vendors · Nigeria
          </p>
        </div>

        <div>
          <div style={COL_TITLE}>Marketplace</div>
          <Link className="tl-footer-link" to="/categories" style={LINK_STYLE}>Browse</Link>
          <Link className="tl-footer-link" to="/all-categories" style={LINK_STYLE}>Categories</Link>
          <Link className="tl-footer-link" to="/vendors" style={LINK_STYLE}>Verified Vendors</Link>
          <Link className="tl-footer-link" to="/vendor/guide" style={LINK_STYLE}>Become a Vendor</Link>
        </div>

        <div>
          <div style={COL_TITLE}>Support</div>
          <Link className="tl-footer-link" to="/support/help" style={LINK_STYLE}>Help</Link>
          <Link className="tl-footer-link" to="/support/faq" style={LINK_STYLE}>FAQ</Link>
          <Link className="tl-footer-link" to="/support/contact" style={LINK_STYLE}>Contact</Link>
          <Link className="tl-footer-link" to="/support/report" style={LINK_STYLE}>Report Issue</Link>
        </div>

        <div>
          <div style={COL_TITLE}>Legal</div>
          <Link className="tl-footer-link" to="/legal/terms" style={LINK_STYLE}>Terms</Link>
          <Link className="tl-footer-link" to="/legal/privacy" style={LINK_STYLE}>Privacy</Link>
          <Link className="tl-footer-link" to="/legal/cookies" style={LINK_STYLE}>Cookies</Link>
          <Link className="tl-footer-link" to="/legal/vendor-policy" style={LINK_STYLE}>Vendor Policy</Link>
        </div>

        <div>
          <div style={COL_TITLE}>Connect</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <a className="tl-footer-social" href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
            <a className="tl-footer-social" href="https://twitter.com/thriftlink_ng" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
              <Twitter size={18} />
            </a>
            <a className="tl-footer-social" href="https://instagram.com/thriftlink_ng" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
          </div>
          <a className="tl-footer-link" href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>WhatsApp business</a>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>© 2026 ThriftLink. All rights reserved.</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem', borderRadius: 999, background: 'white', border: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: '#25D366' }} />
          Made in Nigeria
        </span>
      </div>
    </footer>
  );
};

export default Footer;
