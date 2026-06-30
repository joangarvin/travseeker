import { useState, useEffect } from 'react';
import type { DestinoDetail } from '../types';
import { destinosApi } from '../api/destinos';

export function useDestinoDetail(id: string | undefined) {
  const [destino, setDestino] = useState<DestinoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    destinosApi.getById(id, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setDestino(data);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Error fetching destino:', err);
        setError('No se pudo cargar el destino');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return { destino, loading, error };
}
