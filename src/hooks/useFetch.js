import { useEffect, useState, useCallback, useRef } from 'react';

export function useFetch(fn, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => { run(); }, [run]);

  return { data, error, loading, retry: run, setData };
}

export function useFocusRefetch(fn) {
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') fn(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fn]);
}
