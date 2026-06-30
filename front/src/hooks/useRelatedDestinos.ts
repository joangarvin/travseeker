import { useState, useEffect } from 'react';
import type { Destino } from '../types';
import { destinosApi } from '../api/destinos';

export function useRelatedDestinos(destinoId: string) {
  const [relacionados, setRelacionados] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    destinosApi.getRelacionados(destinoId, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setRelacionados(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRelacionados([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [destinoId]);

  return { relacionados, loading };
}
