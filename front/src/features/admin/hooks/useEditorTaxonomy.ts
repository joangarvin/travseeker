import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts';
import { api } from '../../../services/api';
/** Private editors can reuse unfinished types without exposing them in public filters. */
export function useEditorTaxonomy<T>(
  kind: 'activities' | 'tourism-types',
  publicRecords: T[],
  enabled: boolean,
) {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<T[] | null>(null);
  const internal = enabled && user?.role === 'admin';
  useEffect(() => {
    if (!internal || !token) return;
    const controller = new AbortController();
    api<T[]>(`/admin/${kind}`, { signal: controller.signal }, token)
      .then((value) => {
        if (!controller.signal.aborted) setRecords(value);
      })
      .catch(() => {
        /* Existing public options remain usable on failure. */
      });
    return () => controller.abort();
  }, [kind, internal, token, publicRecords]);
  return { records: internal && records ? records : publicRecords, internal };
}
