// Sentry MUST be the first import so React error boundaries can catch
// errors thrown during the initial render.
import { Sentry } from './instrument'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initAnalytics } from './analytics/posthog'

// Initialize analytics before the first React render so the initial
// $pageview / scroll listeners are armed.
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{ padding: '4rem 1.25rem', maxWidth: 560, margin: '0 auto', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Our team has been notified. You can try again, or refresh the page.
          </p>
          <button
            onClick={resetError}
            style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
