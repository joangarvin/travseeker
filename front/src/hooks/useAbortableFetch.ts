import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface Options<T> {
  enabled?: boolean;
  initialData?: T | null;
}

/**
 * Generic data-fetching hook that handles the AbortController + loading + error
 * lifecycle shared across pages. Pass a fetcher that accepts an AbortSignal and
 * a dependency array; the request is aborted on unmount, dependency change, or
 * reload().
 */
export function useAbortableFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: Options<T> = {},
) {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcherRef.current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar la información');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  return { data, loading, error, reload, setData };
}
