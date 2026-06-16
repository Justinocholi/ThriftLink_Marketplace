import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from './posthog';

/**
 * Fires a manual $pageview on every React-Router route change AND resets the
 * scroll-depth milestones so they re-arm per page. Mount once inside <Router>.
 */
export default function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview();
  }, [location.pathname]);
  return null;
}
