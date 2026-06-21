import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal, X, LogOut } from 'lucide-react';

/**
 * Instagram/TikTok style mobile bottom tab bar.
 * Visible at <=768px only (CSS-controlled by parent layout's media query).
 *
 * Props:
 *  - primary: [{ path, icon, label }, ...] up to 4 items shown directly
 *  - more:    [{ path, icon, label }, ...] items shown inside the bottom sheet
 *  - accent:  active color (brand green/blue)
 *  - onLogout: function called when the bottom-sheet logout is tapped
 */
const MobileTabBar = ({ primary = [], more = [], accent = '#25D366', onLogout }) => {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const inMore = more.some((m) => isActive(m.path));

  const tabBtn = (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: '6px 2px',
    color: active ? accent : '#94a3b8',
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    fontSize: 11,
    transition: 'color 0.15s',
  });

  return (
    <>
      <nav
        className="mobile-tab-bar"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '1px solid #f1f5f9',
          boxShadow: '0 -4px 16px rgba(15,23,42,0.08)',
          zIndex: 50,
          padding: '4px 6px calc(4px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', maxWidth: 600, margin: '0 auto' }}>
          {primary.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} style={tabBtn(active)}>
                <span style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setSheetOpen(true)} style={tabBtn(inMore)}>
            <span style={{ transform: inMore ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
              <MoreHorizontal size={22} />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <>
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60,
            }}
          />
          <div
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 61,
              background: 'white',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 -8px 32px rgba(15,23,42,0.18)',
              maxHeight: '75vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>More</h3>
              <button
                onClick={() => setSheetOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            {more.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSheetOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 8px',
                    color: active ? accent : '#0f172a',
                    background: active ? '#f8fafc' : 'transparent',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.95rem',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {onLogout && (
              <button
                onClick={() => { setSheetOpen(false); onLogout(); }}
                style={{
                  marginTop: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 8px',
                  width: '100%', textAlign: 'left',
                  color: '#ef4444', background: 'transparent',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem',
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-tab-bar { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default MobileTabBar;
