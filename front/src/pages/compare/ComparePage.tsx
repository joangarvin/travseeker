import { normalizeCompareIds } from '../../utils/compareSelection';
import { t } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, GitCompare, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useCompare } from '../../contexts';
import { imageUrl, plain } from '../../utils';
import type { Destino } from '../../types';
import { Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { PageHeading, Shell } from '../../components/layout';
import { TourismMarks } from '../../features/tourism/tourism';
import { ActivityMarks } from '../../features/activities/activities';

const rows: Array<[string, keyof Destino]> = [
  [t('Presupuesto'), 'presupuesto'],
  [t('Afluencia'), 'masificacion'],
  [t('Tipos de viaje'), 'tipoTurismoPrincipal'],
  [t('Actividades'), 'tipoTurismoSecundario'],
  [t('Julio y agosto'), 'mesesJulioAgosto'],
  [t('Entretiempo'), 'mesesMayJunSeptOct'],
  [t('Noviembre a abril'), 'mesesNovAbril'],
];

export default function ComparePage() {
  const compare = useCompare();
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState<Destino[]>([]);
  const [items, setItems] = useState<Destino[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    if (params.has('ids'))
      compare.replace(normalizeCompareIds((params.get('ids') || '').split(',')));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (compare.ids.length) next.set('ids', compare.ids.join(','));
        else next.delete('ids');
        return next;
      },
      { replace: true },
    );
    setError('');
    setItems([]);
    if (!compare.ids.length) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const request =
      compare.ids.length === 1
        ? api<Destino>(`/destinos/${encodeURIComponent(compare.ids[0])}`, {
            signal: controller.signal,
          }).then((item) => [item])
        : api<Destino[]>(`/destinos/compare?ids=${compare.ids.join(',')}`, {
            signal: controller.signal,
          });
    request
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(data);
        if (data.length !== compare.ids.length)
          setError(t('Algún destino ya no está disponible. Retíralo de la comparación.'));
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : t('No se pudo preparar la comparación'),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ready, compare.ids.join(','), retry]);
  useEffect(() => {
    const controller = new AbortController();
    setCatalog([]);
    setSearchError('');
    setActiveSuggestion(-1);
    if (!query.trim()) {
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = window.setTimeout(() => {
      api<Destino[]>(`/destinos?q=${encodeURIComponent(query.trim())}&limit=12`, {
        signal: controller.signal,
      })
        .then(setCatalog)
        .catch((cause) => {
          if (!controller.signal.aborted)
            setSearchError(
              cause instanceof Error ? cause.message : t('No se pudo cargar el catálogo'),
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry]);
  const suggestions = useMemo(
    () => catalog.filter((item) => !compare.ids.includes(item.id)).slice(0, 8),
    [catalog, compare.ids],
  );
  const chooseSuggestion = (id: string) => {
    if (!compare.toggle(id)) {
      setError(t('Puedes comparar un máximo de cuatro destinos'));
      return;
    }
    setQuery('');
    setActiveSuggestion(-1);
  };
  return (
    <Shell>
      <PageHeading kicker={t('Decide con los datos delante')} title={t('Comparar destinos')}>
        <p>
          {t(
            'Hasta cuatro lugares, criterio por criterio. Sin ganador automático: la mejor opción depende de tu viaje.',
          )}
        </p>
      </PageHeading>
      <section className="compare-picker">
        <div className="compare-picker__selected">
          {compare.ids.map((id) => {
            const item = items.find((d) => d.id === id) || catalog.find((d) => d.id === id);
            return (
              <span key={id}>
                {item?.nombre || t('Destino')}
                <button
                  type="button"
                  onClick={() => compare.toggle(id)}
                  aria-label={t('Quitar {0}', { 0: item?.nombre || 'destino' })}
                >
                  <X />
                </button>
              </span>
            );
          })}
        </div>
        {compare.ids.length < 4 && (
          <div className="compare-picker__search">
            <Search />
            <input
              id="compare-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Añade otro destino')}
              aria-label={t('Buscar destino para comparar')}
              role="combobox"
              aria-expanded={Boolean(query)}
              aria-controls="compare-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={
                activeSuggestion >= 0
                  ? `compare-option-${suggestions[activeSuggestion]?.id}`
                  : undefined
              }
              onKeyDown={(event) => {
                if (!suggestions.length) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveSuggestion((current) => (current + 1) % suggestions.length);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveSuggestion(
                    (current) => (current - 1 + suggestions.length) % suggestions.length,
                  );
                } else if (event.key === 'Enter' && activeSuggestion >= 0) {
                  event.preventDefault();
                  chooseSuggestion(suggestions[activeSuggestion].id);
                } else if (event.key === 'Escape') {
                  setQuery('');
                  setActiveSuggestion(-1);
                }
              }}
            />
            {query && (
              <div id="compare-suggestions" role="listbox" aria-label={t('Destinos sugeridos')}>
                {searchLoading && <p role="status">{t('Buscando destinos…')}</p>}
                {searchError && (
                  <Notice tone="error">
                    {searchError}{' '}
                    <button type="button" onClick={() => setRetry((value) => value + 1)}>
                      {t('Reintentar')}
                    </button>
                  </Notice>
                )}
                {!searchLoading && !searchError && !suggestions.length && (
                  <p role="status">{t('No hay destinos que coincidan. Prueba otra búsqueda.')}</p>
                )}
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    id={`compare-option-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestion}
                    onClick={() => chooseSuggestion(item.id)}
                  >
                    <Plus /> {item.nombre}
                    <small>{plain(item.ubicacion)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {compare.ids.length > 0 && (
          <button className="button button--quiet" onClick={compare.clear}>
            <Trash2 /> {t('Vaciar')}
          </button>
        )}
      </section>
      <section className="compare-content">
        <p className="decision-help">
          {t(
            'Presupuesto: nivel orientativo de gasto, no una tarifa. Afluencia: estimación editorial de ocupación; un porcentaje menor indica más tranquilidad. No son datos en tiempo real.',
          )}
        </p>
        {error ? (
          <Notice tone="error">
            {error}{' '}
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setRetry((value) => value + 1)}
            >
              {t('Reintentar')}
            </button>
          </Notice>
        ) : compare.ids.length < 2 ? (
          <Empty icon={<GitCompare />} title={t('Elige al menos dos destinos')}>
            {t('Añade lugares desde el buscador o desde cualquier ficha para verlos cara a cara.')}
          </Empty>
        ) : loading ? (
          <Loader label={t('Preparando la comparación')} />
        ) : (
          <div
            className="compare-table"
            role="table"
            aria-label={t('Comparación de destinos')}
            style={{ '--compare-count': items.length } as React.CSSProperties}
          >
            <div className="compare-table__header-row" role="row">
              <div className="compare-table__corner" role="columnheader" />
              {items.map((item) => (
                <article key={item.id} className="compare-table__head" role="columnheader">
                  <MediaImage src={imageUrl(item.imagen)} alt="" />
                  <Link to={`/destino/${item.id}`}>{item.nombre.trim()}</Link>
                  <span>{plain(item.ubicacion)}</span>
                </article>
              ))}
            </div>
            {rows.map(([label, key]) => (
              <div className="compare-table__row" key={key} role="row">
                <strong role="rowheader">{t(label)}</strong>
                {items.map((item) => {
                  const value = item[key];
                  const isTourism = key === 'tipoTurismoPrincipal';
                  const isActivity = key === 'tipoTurismoSecundario';
                  const crowd = key.toString().startsWith('meses')
                    ? `${value}%`
                    : plain(String(value || '—'));
                  return (
                    <div key={item.id} role="cell">
                      {isTourism ? (
                        <TourismMarks value={String(value || '')} compact />
                      ) : isActivity ? (
                        <ActivityMarks value={String(value || '')} />
                      ) : (
                        <>
                          {key.toString().startsWith('meses') && Number(value) <= 40 && <Check />}
                          <span>{t(crowd)}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
