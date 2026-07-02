import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      minHeight: '100vh',
      background: 'radial-gradient(1200px 600px at 10% 10%, rgba(37, 211, 102, 0.12), transparent 60%), radial-gradient(900px 500px at 90% 90%, rgba(59, 130, 246, 0.12), transparent 60%), linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <style>{`
        @keyframes floatA { 0%,100% { transform: translate(0,0) } 50% { transform: translate(20px,-30px) } }
        @keyframes floatB { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-25px,20px) } }
        .nf-orb { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; z-index: 0; }
        .nf-cta:hover { transform: translateY(-2px); }
        .nf-cta { transition: transform 0.18s ease; }
      `}</style>

      <div className="nf-orb" style={{ width: 320, height: 320, background: 'rgba(37, 211, 102, 0.35)', top: -80, left: -60, animation: 'floatA 12s ease-in-out infinite' }} />
      <div className="nf-orb" style={{ width: 280, height: 280, background: 'rgba(59, 130, 246, 0.3)', bottom: -60, right: -40, animation: 'floatB 14s ease-in-out infinite' }} />
      <div className="nf-orb" style={{ width: 200, height: 200, background: 'rgba(250, 204, 21, 0.22)', top: '45%', right: '38%', animation: 'floatA 16s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
        <div style={{
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          fontSize: 'clamp(6rem, 18vw, 10rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #25D366 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem'
        }}>
          404
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
          We couldn't find that page
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back to finding great deals.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            className="nf-cta"
            style={{
              background: '#25D366',
              color: 'white',
              padding: '0.85rem 1.75rem',
              borderRadius: '999px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px -8px rgba(37,211,102,0.5)'
            }}
          >
            Back to home
          </Link>
          <Link
            to="/vendors"
            className="nf-cta"
            style={{
              background: 'transparent',
              color: '#0f172a',
              padding: '0.85rem 1.75rem',
              borderRadius: '999px',
              fontWeight: 700,
              textDecoration: 'none',
              border: '2px solid #0f172a'
            }}
          >
            Browse vendors
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
