import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';
type Upcoming = {
  countries: { code: string; name: string }[];
  destinations: { id: string; nombre: string }[];
  municipalities: { id: string; nombre: string }[];
};
export function UpcomingContent() {
  const [data, setData] = useState<Upcoming | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<Upcoming>('/proximamente', { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch(() => {
        /* Optional announcement; never blocks discovery. */
      });
    return () => controller.abort();
  }, []);
  if (!data || (!data.countries.length && !data.destinations.length && !data.municipalities.length))
    return null;
  return (
    <aside className="upcoming-content" aria-label={t('Próximamente')}>
      <Sparkles aria-hidden="true" />
      <div>
        <strong>{t('Estamos preparando nuevas guías')}</strong>
        <p>
          {[
            ...data.countries.map((c) => c.name),
            ...data.destinations.map((d) => d.nombre),
            ...data.municipalities.map((m) => m.nombre),
          ].join(' · ')}
        </p>
        <span>{t('Próximamente. Estas fichas todavía no están disponibles.')}</span>
      </div>
    </aside>
  );
}
