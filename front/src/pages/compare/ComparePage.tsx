import {
  budgetLevels as budgets,
  crowdPercentage,
  lowestScored,
  canCompareBudgets,
} from '../../utils/compareInsights';
import { normalizeCompareIds } from '../../utils/compareSelection';
import { t } from '../../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  GitCompare,
  Globe2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useCompare } from '../../contexts';
import { imageUrl, plain } from '../../utils';
import type { Destino } from '../../types';
import { Dialog, Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { PageHeading, Shell } from '../../components/layout';
import { ActivityMarks, activityValues } from '../../features/activities/activities';

type Priority = 'budget' | 'quiet' | 'activities' | 'practical';
const priorities = [
  ['quiet', 'Tranquilidad'],
  ['activities', 'Qué hacer'],
  ['budget', 'Presupuesto'],
  ['practical', 'Lo práctico'],
] as const;
const seasons = [
  ['mesesMayJunSeptOct', 'Mayo–junio · septiembre–octubre'],
  ['mesesJulioAgosto', 'Julio y agosto'],
  ['mesesNovAbril', 'Noviembre a abril'],
] as const;
export default function ComparePage() {
  const compare = useCompare();
  const [params, setParams] = useSearchParams();
  const [priority, setPriority] = useState<Priority>(() =>
    priorities.some(([key]) => key === params.get('prioridad'))
      ? (params.get('prioridad') as Priority)
      : 'quiet',
  );
  const [season, setSeason] = useState(() =>
    Math.max(
      0,
      seasons.findIndex(([key]) => key === params.get('epoca')),
    ),
  );
  const [wishes, setWishes] = useState<string[]>(() =>
    [...new Set((params.get('planes') || '').split('|').filter(Boolean))].slice(0, 50),
  );
  const [preferred, setPreferred] = useState(() => params.get('opcion') || '');
  const [manageOpen, setManageOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [undo, setUndo] = useState<{ ids: string[]; preferred: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const [knownItems, setKnownItems] = useState<Record<string, Destino>>({});
  const manageRef = useRef<HTMLButtonElement>(null);
  const shareRef = useRef<HTMLInputElement>(null);
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
        setKnownItems((current) => ({
          ...current,
          ...Object.fromEntries(data.map((item) => [item.id, item])),
        }));
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
        .then((data) => {
          if (!controller.signal.aborted) {
            setKnownItems((current) => ({
              ...current,
              ...Object.fromEntries(data.map((item) => [item.id, item])),
            }));
            setCatalog(data);
          }
        })
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
    setFeedback(
      t('{0} añadido a la comparación', {
        0: catalog.find((item) => item.id === id)?.nombre || t('Destino'),
      }),
    );
    requestAnimationFrame(() => (searchRef.current || doneRef.current)?.focus());
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
  const hasMissingCrowd = items.some((item) => crowdValue(item) === null);
  const comparableBudgets = canCompareBudgets(items);
  const insight =
    priority === 'practical'
      ? t('Los detalles que conviene tener a mano')
      : priority === 'activities'
        ? t(
            wishes.length
              ? 'Los planes que has elegido, destino a destino.'
              : '¿Qué puedes hacer en cada destino?',
          )
        : priority === 'budget' && !comparableBudgets
          ? t('El nivel de gasto necesita contexto')
          : priority === 'quiet' && hasMissingCrowd
            ? t('Falta información para comparar la afluencia')
            : !names
              ? t('Todavía no hay datos para este criterio.')
              : priority === 'budget'
                ? t('Menor nivel de gasto: {0}', { 0: names })
                : t('Menor afluencia estimada: {0}', { 0: names });

  useEffect(() => {
    if (!ready) return;
    if (preferred && !compare.ids.includes(preferred)) setPreferred('');
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('ids', compare.ids.join(','));
        next.set('prioridad', priority);
        next.set('epoca', seasons[season][0]);
        if (wishes.length) next.set('planes', wishes.join('|'));
        else next.delete('planes');
        if (preferred && compare.ids.includes(preferred)) next.set('opcion', preferred);
        else next.delete('opcion');
        return next;
      },
      { replace: true },
    );
  }, [ready, priority, season, wishes.join('|'), preferred, compare.ids.join(',')]);

  function removeDestination(id: string) {
    const name = knownItems[id]?.nombre || t('Destino');
    setUndo({ ids: [...compare.ids], preferred });
    compare.toggle(id);
    setFeedback(t('{0} retirado de la comparación', { 0: name }));
    // Removed cards/chips leave focus behind; move it to a stable edit control.
    requestAnimationFrame(() =>
      (searchRef.current || manageRef.current)?.focus({ preventScroll: true }),
    );
  }
  function clearDestinations() {
    setUndo({ ids: [...compare.ids], preferred });
    compare.clear();
    setFeedback(t('Selección vaciada. Puedes recuperarla con Deshacer.'));
    requestAnimationFrame(() => searchRef.current?.focus());
  }
  function restoreDestinations() {
    if (!undo) return;
    compare.replace(undo.ids);
    setPreferred(undo.preferred);
    setUndo(null);
    setFeedback(t('Selección anterior recuperada'));
    requestAnimationFrame(() => (searchRef.current || manageRef.current)?.focus());
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback(t('Enlace copiado con tus destinos y preferencias'));
    } catch {
      setShareOpen(true);
    }
  }
  const practical = (item: Destino) => (
    <dl className="compare-facts">
      <div>
        <dt>{t('País')}</dt>
        <dd>{item.country?.name ? t(item.country.name) : t('Sin datos')}</dd>
      </div>
      <div>
        <dt>{t('Moneda')}</dt>
        <dd>{item.practicalInfo?.currency || t('Sin datos')}</dd>
      </div>
      <div>
        <dt>{t('Idiomas')}</dt>
        <dd>{item.practicalInfo?.languages || t('Sin datos')}</dd>
      </div>
    </dl>
  );
  const preferredItem = items.find((item) => item.id === preferred);
  return (
    <Shell>
      <div className="compare-back">
        <Link to="/">
          <ArrowLeft size={16} aria-hidden />
          {t('Volver a descubrir')}
        </Link>
      </div>
      <PageHeading
        className="compare-heading"
        title={t('¿Dónde empieza tu próximo viaje?')}
        action={
          <div className="compare-heading__actions">
            <button
              ref={manageRef}
              className="button button--primary"
              onClick={() => setManageOpen(true)}
            >
              <Plus aria-hidden />
              {t('Editar destinos')}
            </button>
            <button className="button" onClick={copyLink}>
              <Copy aria-hidden />
              {t('Copiar enlace')}
            </button>
          </div>
        }
      >
        <p>{t('Compara destinos. Encuentra lo que encaja contigo.')}</p>
      </PageHeading>
      <div className="compare-workspace">
        <div className="compare-feedback" role="status" aria-live="polite" aria-atomic="true">
          {feedback}
        </div>
        {undo && (
          <button className="button button--quiet compare-undo" onClick={restoreDestinations}>
            {t('Deshacer último cambio de destinos')}
          </button>
        )}
        <section className="compare-content" aria-busy={loading}>
          <div className="compare-controls">
            <div className="compare-priorities" role="group" aria-label={t('¿Qué te importa más?')}>
              <h2>{t('¿Qué te importa más?')}</h2>
              <div>
                {priorities.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={priority === key}
                    onClick={() => {
                      setPriority(key);
                      setFeedback(t('Comparación actualizada: {0}', { 0: t(label) }));
                    }}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
            <label className="compare-season">
              {t('Época del viaje')}
              <select
                value={season}
                onChange={(event) => {
                  setSeason(Number(event.target.value));
                  setFeedback(t('Época actualizada; comparación recalculada'));
                }}
              >
                {seasons.map(([key, label], index) => (
                  <option key={key} value={index}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {priority === 'activities' && (
            <details className="compare-plans" open>
              <summary>
                {t('Elegir planes')}
                <span>
                  {t('Planes elegidos: {0}', { 0: wishes.length })}
                  <ChevronDown aria-hidden />
                </span>
              </summary>
              <div>
                {activityOptions.length ? (
                  activityOptions.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={wishes.includes(value)}
                        onChange={(event) => {
                          setWishes((current) =>
                            event.target.checked
                              ? [...current, value]
                              : current.filter((item) => item !== value),
                          );
                          setFeedback(t('Tus planes se han actualizado'));
                        }}
                      />
                      {t(value)}
                    </label>
                  ))
                ) : (
                  <p>{t('No hay tipos de actividades disponibles en estas guías.')}</p>
                )}
              </div>
            </details>
          )}
          {error && (
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
          )}
          {compare.ids.length < 2 ? (
            <Empty icon={<GitCompare />} title={t('Elige al menos dos destinos')}>
              {t(
                'Añade lugares desde el buscador o desde cualquier ficha para verlos cara a cara.',
              )}
              <button className="button button--primary" onClick={() => setManageOpen(true)}>
                <Plus aria-hidden />
                {t('Añadir destinos')}
              </button>
            </Empty>
          ) : loading ? (
            <Loader label={t('Preparando la comparación')} />
          ) : (
            items.length >= 2 && (
              <>
                <div className="compare-insight">
                  <GitCompare aria-hidden />
                  <div>
                    <span className="eyebrow">{t('La diferencia, en claro')}</span>
                    <h2>{insight}</h2>
                    <p>
                      {priority === 'budget'
                        ? t(
                            comparableBudgets
                              ? 'Comparamos niveles de gasto publicados. El coste final depende de tu viaje.'
                              : 'Los niveles describen cada guía; no equivalen a precios comparables entre países. Mostramos la moneda original, sin conversiones ni un ganador automático.',
                          )
                        : priority === 'quiet'
                          ? hasMissingCrowd
                            ? t(
                                'Un dato pendiente no significa menos gente. No destacamos una opción hasta tener todas las estimaciones.',
                              )
                            : t('Afluencia estimada para {0}. Un valor menor indica menos gente.', {
                                0: t(seasons[season][1]),
                              })
                          : priority === 'practical'
                            ? t(
                                'Consulta país, moneda e idiomas. Estos datos complementan la comparación de cada destino.',
                              )
                            : t('Comprueba qué tipos de actividades aparecen en cada guía.')}
                    </p>
                  </div>
                </div>
                <div className="compare-section-heading">
                  <h2>{t('Tus destinos, cara a cara')}</h2>
                  <span>{t('{0} destinos seleccionados', { 0: items.length })}</span>
                </div>
                <div className="compare-cards">
                  {items.map((item) => {
                    const activities = activityValues(item.tipoTurismoSecundario),
                      matches = wishes.filter((value) => activities.includes(value)),
                      missing = wishes.filter((value) => !activities.includes(value)),
                      crowd = crowdValue(item);
                    const displayedActivities =
                      priority === 'activities' && wishes.length ? matches : activities;
                    return (
                      <article
                        className={`compare-card ${preferred === item.id ? 'is-chosen' : ''}`}
                        key={item.id}
                      >
                        <div className="compare-card__photo">
                          <MediaImage
                            src={imageUrl(item.imagen)}
                            alt={t('Paisaje de {0}', { 0: item.nombre })}
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          />
                          <button
                            className="compare-remove"
                            onClick={() => removeDestination(item.id)}
                            aria-label={t('Quitar {0}', { 0: item.nombre })}
                          >
                            <X aria-hidden />
                          </button>
                          {preferred === item.id && (
                            <span className="compare-card__badge">
                              <Check size={14} aria-hidden />
                              {t('Tu opción')}
                            </span>
                          )}
                        </div>
                        <div className="compare-card__body">
                          {item.country && (
                            <span className="compare-country">
                              <Globe2 size={14} aria-hidden />
                              {t(item.country.name)}
                            </span>
                          )}
                          <h3>
                            <Link to={`/destino/${item.id}`}>{item.nombre.trim()}</Link>
                          </h3>
                          <small>{plain(item.ubicacion)}</small>
                          <div
                            className="compare-card__metric"
                            key={`${priority}-${season}-${wishes.join('|')}`}
                          >
                            {priority === 'budget'
                              ? t(item.presupuesto || 'Sin datos')
                              : priority === 'quiet'
                                ? crowd === null
                                  ? t('Pendiente')
                                  : `${crowd}%`
                                : priority === 'activities'
                                  ? wishes.length
                                    ? t('{0} de {1}', { 0: matches.length, 1: wishes.length })
                                    : t('{0} tipos de actividades', { 0: activities.length })
                                  : item.practicalInfo?.currency || t('Sin datos')}
                          </div>
                          {priority === 'budget' && (
                            <small>
                              {t('Nivel de presupuesto')} ·{' '}
                              {item.practicalInfo?.currency || t('Moneda sin datos')}
                            </small>
                          )}
                          {priority === 'quiet' && (
                            <>
                              <small>
                                {crowd === null
                                  ? t('Sin estimación disponible')
                                  : t('Afluencia estimada')}{' '}
                                · {t(seasons[season][1])}
                              </small>
                              {crowd !== null && (
                                <div className="compare-crowd-meter" aria-hidden>
                                  <span style={{ transform: `scaleX(${crowd / 100})` }} />
                                </div>
                              )}
                            </>
                          )}
                          {priority === 'activities' && missing.length > 0 && (
                            <p className="compare-missing">
                              {t('No aparecen en su guía: {0}', {
                                0: missing.map((value) => t(value)).join(', '),
                              })}
                            </p>
                          )}
                          {priority !== 'practical' && displayedActivities.length > 0 && (
                            <div className="compare-card__activities">
                              <ActivityMarks value={JSON.stringify(displayedActivities)} />
                            </div>
                          )}
                          {priority === 'practical' ? (
                            practical(item)
                          ) : (
                            <details className="compare-practical">
                              <summary>
                                {t('Lo práctico')}
                                <ChevronDown size={17} aria-hidden />
                              </summary>
                              {practical(item)}
                            </details>
                          )}
                          <button
                            type="button"
                            className="button compare-choice"
                            aria-pressed={preferred === item.id}
                            onClick={() => {
                              setPreferred((current) => (current === item.id ? '' : item.id));
                              setFeedback(
                                t(
                                  preferred === item.id ? 'Elección desmarcada' : 'Tu opción: {0}',
                                  { 0: item.nombre },
                                ),
                              );
                            }}
                          >
                            <span>
                              {preferred === item.id && <Check size={17} aria-hidden />}
                              {t(preferred === item.id ? 'Mi opción' : 'Marcar opción')}
                              <span className="sr-only"> · {item.nombre}</span>
                            </span>
                            <ArrowUpRight aria-hidden />
                          </button>
                          <Link className="compare-guide-link" to={`/destino/${item.id}`}>
                            {t('Abrir guía')}
                            <ArrowUpRight size={16} aria-hidden />
                            <span className="sr-only"> · {item.nombre}</span>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {preferredItem && (
                  <div className="compare-preferred">
                    <div>
                      <span className="eyebrow">{t('Tu opción, por ahora')}</span>
                      <h2>
                        <Check aria-hidden />
                        {preferredItem.nombre}
                      </h2>
                      <p>{t('Tu elección se conserva en el enlace de esta comparación.')}</p>
                    </div>
                    <button
                      className="button"
                      onClick={() => {
                        setPreferred('');
                        setFeedback(t('Puedes marcar otra opción'));
                        manageRef.current?.focus();
                      }}
                    >
                      {t('Cambiar mi elección')}
                    </button>
                  </div>
                )}
              </>
            )
          )}
          <p className="decision-help">
            {t(
              'Presupuesto: nivel orientativo de gasto, no una tarifa. Afluencia: estimación editorial de ocupación; un porcentaje menor indica más tranquilidad. No son datos en tiempo real.',
            )}
          </p>
        </section>
      </div>
      {manageOpen && (
        <Dialog
          title={t('Elige tus destinos')}
          description={t(
            'Entre 2 y 4 destinos. Añade las opciones que te interesan para comparar sus diferencias.',
          )}
          onClose={() => setManageOpen(false)}
          initialFocusRef={searchRef}
          className="compare-dialog"
        >
          <section
            className="compare-picker"
            data-tour="comparison"
            aria-label={t('Destinos seleccionados')}
          >
            <div className="compare-picker__selected">
              {compare.ids.map((id) => {
                const item = items.find((d) => d.id === id) || knownItems[id];
                return (
                  <span key={id}>
                    {item?.nombre || t('Destino')}
                    <button
                      type="button"
                      onClick={() => removeDestination(id)}
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
                  ref={searchRef}
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
              <button className="button button--quiet" onClick={clearDestinations}>
                <Trash2 /> {t('Vaciar')}
              </button>
            )}
          </section>

          <div className="compare-dialog__footer">
            <p>{t('{0} de 4 destinos seleccionados', { 0: compare.ids.length })}</p>
            <p className="sr-only" role="status" aria-live="polite">
              {feedback}
            </p>
            {undo && (
              <button className="button button--quiet" onClick={restoreDestinations}>
                {t('Deshacer')}
              </button>
            )}
            <button
              ref={doneRef}
              className="button button--primary"
              onClick={() => setManageOpen(false)}
            >
              {t('Ver comparación')}
              <ArrowUpRight aria-hidden />
            </button>
          </div>
        </Dialog>
      )}
      {shareOpen && (
        <Dialog
          title={t('Enlace a esta comparación')}
          description={t('Copia este enlace para conservar tus destinos y preferencias.')}
          onClose={() => setShareOpen(false)}
          initialFocusRef={shareRef}
        >
          <input
            ref={shareRef}
            aria-label={t('Enlace a esta comparación')}
            value={window.location.href}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </Dialog>
      )}
    </Shell>
  );
}
