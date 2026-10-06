import {
  budgetLevels as budgets,
  crowdPercentage,
  lowestScored,
} from '../../utils/compareInsights';
import { normalizeCompareIds } from '../../utils/compareSelection';
import { t } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, GitCompare, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useCompare } from '../../contexts';
import { imageUrl, plain } from '../../utils';
import type { Destino } from '../../types';
import { Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { PageHeading, Shell } from '../../components/layout';
import { ActivityMarks, activityValues } from '../../features/activities/activities';

const seasons = [
  ['mesesMayJunSeptOct', 'Mayo–junio · septiembre–octubre'],
  ['mesesJulioAgosto', 'Julio y agosto'],
  ['mesesNovAbril', 'Noviembre a abril'],
] as const;
export default function ComparePage() {
  const compare = useCompare();
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 701px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 701px)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [params, setParams] = useSearchParams();
  const [priority, setPriority] = useState<'budget' | 'quiet' | 'activities'>('budget');
  const [season, setSeason] = useState(() =>
    Math.max(
      0,
      seasons.findIndex(([key]) => key === params.get('epoca')),
    ),
  );
  const [wishes, setWishes] = useState<string[]>([]);
  const [preferred, setPreferred] = useState('');
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
  const activityOptions = [
    ...new Set([...wishes, ...items.flatMap((item) => activityValues(item.tipoTurismoSecundario))]),
  ].sort();
  const crowdValue = (item: Destino): number | null => {
    return crowdPercentage(item[seasons[season][0]]);
  };
  const scores = items.map((item) => ({
    item,
    score: priority === 'budget' ? budgets[item.presupuesto] : crowdValue(item),
  }));
  const names = lowestScored(scores)
    .map((item) => item.nombre)
    .join(', ');
  const insight =
    priority === 'activities'
      ? t(
          wishes.length
            ? 'Los planes que has elegido, destino a destino.'
            : '¿Qué puedes hacer en cada destino?',
        )
      : !names
        ? t('Todavía no hay datos para este criterio.')
        : priority === 'budget'
          ? t('Menor nivel de gasto: {0}', { 0: names })
          : t('Menor afluencia estimada: {0}', { 0: names });
  return (
    <Shell>
      <PageHeading kicker={t('Decide con los datos delante')} title={t('Comparar destinos')}>
        <p>{t('Compara presupuesto, afluencia y actividades. Elige qué te importa más.')}</p>
      </PageHeading>
      <div className="compare-workspace">
        <details className="compare-manage" open={desktop || compare.ids.length < 2}>
          <summary>
            <span>{t('{0} destinos seleccionados', { 0: compare.ids.length })}</span>
            <span>
              {t('Cambiar destinos')} <ChevronDown aria-hidden />
            </span>
          </summary>
          <section
            className="compare-picker"
            data-tour="comparison"
            aria-label={t('Destinos seleccionados')}
          >
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
                      <p role="status">
                        {t('No hay destinos que coincidan. Prueba otra búsqueda.')}
                      </p>
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
        </details>
        <section className="compare-content">
          <div className="compare-priorities" role="group" aria-label={t('¿Qué te importa más?')}>
            <h2>{t('¿Qué te importa más?')}</h2>
            <div>
              {(
                [
                  ['budget', 'Presupuesto'],
                  ['quiet', 'Menos gente'],
                  ['activities', 'Actividades'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={priority === key}
                  onClick={() => setPriority(key)}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          <label className={`compare-season ${priority === 'quiet' ? 'is-relevant' : ''}`}>
            {t('¿En qué época viajarías?')}
            <select
              value={season}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSeason(value);
                setParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set('epoca', seasons[value][0]);
                    return next;
                  },
                  { replace: true },
                );
              }}
            >
              {seasons.map(([key, label], index) => (
                <option key={key} value={index}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          {priority === 'activities' && (
            <details className="compare-plans">
              <summary>
                {t('Elegir planes')}{' '}
                <span>
                  {wishes.length
                    ? t('Planes elegidos: {0}', { 0: wishes.length })
                    : t('Todos los planes')}{' '}
                  <ChevronDown aria-hidden />
                </span>
              </summary>
              <div>
                {activityOptions.map((value) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={wishes.includes(value)}
                      onChange={(event) =>
                        setWishes((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        )
                      }
                    />
                    {t(value)}
                  </label>
                ))}
              </div>
            </details>
          )}
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
              {t(
                'Añade lugares desde el buscador o desde cualquier ficha para verlos cara a cara.',
              )}
            </Empty>
          ) : loading ? (
            <Loader label={t('Preparando la comparación')} />
          ) : (
            <>
              <div className="compare-insight">
                <h2>{insight}</h2>
                <p>
                  {priority === 'budget'
                    ? t(
                        'Comparamos niveles de gasto publicados. El coste final depende de tu viaje.',
                      )
                    : priority === 'quiet'
                      ? t('Afluencia estimada para {0}. Un valor menor indica menos gente.', {
                          0: t(seasons[season][1]),
                        })
                      : t('Comprueba qué tipos de actividades aparecen en cada guía.')}
                </p>
              </div>
              <div className="compare-cards">
                {items.map((item) => {
                  const activities = activityValues(item.tipoTurismoSecundario);
                  const matches = wishes.filter((value) => activities.includes(value));
                  const missing = wishes.filter((value) => !activities.includes(value));
                  const crowd = crowdValue(item);
                  return (
                    <article className="compare-card" key={item.id}>
                      <MediaImage src={imageUrl(item.imagen)} alt="" />
                      <div className="compare-card__body">
                        <h3>
                          <Link to={`/destino/${item.id}`}>{item.nombre.trim()}</Link>
                        </h3>
                        <small>{plain(item.ubicacion)}</small>
                        <div className="compare-card__metric">
                          {priority === 'budget'
                            ? t(item.presupuesto || 'Sin datos')
                            : priority === 'quiet'
                              ? crowd === null
                                ? t('Sin datos')
                                : `${crowd}%`
                              : wishes.length
                                ? t('{0} de {1}', { 0: matches.length, 1: wishes.length })
                                : t('{0} tipos de actividades', { 0: activities.length })}
                        </div>
                        {priority === 'budget' && (
                          <>
                            <small>{t('Nivel de presupuesto')}</small>
                            <div className="compare-budget-bar" aria-hidden>
                              {Array.from({ length: 5 }, (_, index) => (
                                <span
                                  key={index}
                                  className={
                                    index < (budgets[item.presupuesto] || 0) ? 'is-filled' : ''
                                  }
                                />
                              ))}
                            </div>
                          </>
                        )}
                        {priority === 'quiet' && (
                          <small>
                            {t('Afluencia estimada')} · {t(seasons[season][1])}
                          </small>
                        )}
                        {priority === 'activities' && (
                          <>
                            <ActivityMarks
                              value={JSON.stringify(wishes.length ? matches : activities)}
                            />
                            {missing.length > 0 && (
                              <p className="compare-missing">
                                {t('No aparecen en su guía: {0}', {
                                  0: missing.map((value) => t(value)).join(', '),
                                })}
                              </p>
                            )}
                          </>
                        )}
                        <p className="compare-card__secondary">
                          {priority === 'budget'
                            ? t('Afluencia · {0}: {1}', {
                                0: t(seasons[season][1]),
                                1: crowd === null ? t('Sin datos') : `${crowd}%`,
                              })
                            : t('Presupuesto: {0}', { 0: t(item.presupuesto || 'Sin datos') })}
                        </p>
                        <button
                          type="button"
                          className="button compare-choice"
                          aria-pressed={preferred === item.id}
                          onClick={() =>
                            setPreferred((current) => (current === item.id ? '' : item.id))
                          }
                        >
                          {preferred === item.id && <Check aria-hidden />}
                          {t(preferred === item.id ? 'Mi opción' : 'Marcar opción')}
                          <span className="sr-only"> · {item.nombre}</span>
                        </button>
                        <Link className="compare-guide-link" to={`/destino/${item.id}`}>
                          {t('Abrir guía')}
                          <span className="sr-only"> · {item.nombre}</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
              {items.some((item) => item.id === preferred) && (
                <p className="compare-preferred" role="status">
                  {t('Tu opción: {0}', { 0: items.find((item) => item.id === preferred)!.nombre })}
                </p>
              )}
            </>
          )}
          <p className="decision-help">
            {t(
              'Presupuesto: nivel orientativo de gasto, no una tarifa. Afluencia: estimación editorial de ocupación; un porcentaje menor indica más tranquilidad. No son datos en tiempo real.',
            )}
          </p>
        </section>
      </div>
    </Shell>
  );
}
