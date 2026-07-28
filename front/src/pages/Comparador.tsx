import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitCompare, Plus, Search, X, Check, MapPin, Sparkles, RotateCcw } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHero from '../components/layout/PageHero';
import { useCompare, COMPARE_MAX } from '../context/CompareContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { destinosApi } from '../api/destinos';
import { getImageUrl } from '../utils/images';
import { parseJsonSafe } from '../utils/parseJson';
import {
  parseTags,
  presupuestoIndex,
  masificacionIndex,
  getBestSeason,
  getSeasons,
} from '../utils/scales';
import { getMasificationColor } from '../utils/masification';
import type { Destino, ComparableDestino } from '../types';

const MAX = COMPARE_MAX;

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={`compare-chip ${highlight ? 'is-highlight' : ''}`}>
      {highlight && <Check className="icon-sm" />}
      {children}
    </span>
  );
}

export default function Comparador() {
  const [params, setParams] = useSearchParams();
  const { items: compareItems, setItems, addCompare, removeCompare, clearCompare } = useCompare();
  const selectedIds = useMemo(() => compareItems.map((x) => x.id), [compareItems]);
  const initialized = useRef(false);

  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: catalog } = useAbortableFetch<Destino[]>(
    (signal) => destinosApi.search({}, signal),
    [],
    { initialData: [] },
  );

  useEffect(() => {
    if (initialized.current || !catalog?.length) return;
    initialized.current = true;

    const urlIds = (params.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX);
    if (urlIds.length > 0) {
      const merged = urlIds
        .map((id) => {
          const fromCtx = compareItems.find((x) => x.id === id);
          if (fromCtx) return fromCtx;
          const fromCat = catalog.find((x) => x.id === id);
          return fromCat ? { id: fromCat.id, nombre: fromCat.nombre } : null;
        })
        .filter(Boolean) as typeof compareItems;
      if (merged.length) setItems(merged);
    } else if (compareItems.length > 0) {
      setParams({ ids: compareItems.map((x) => x.id).join(',') }, { replace: true });
    }
  }, [catalog, compareItems, params, setItems, setParams]);

  useEffect(() => {
    if (!initialized.current) return;
    const ids = compareItems.map((x) => x.id);
    if (ids.length) setParams({ ids: ids.join(',') }, { replace: true });
    else setParams({}, { replace: true });
  }, [compareItems, setParams]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const { data: items, loading } = useAbortableFetch<ComparableDestino[]>(
    (signal) => destinosApi.compare(selectedIds, signal),
    [selectedIds.join(',')],
    { enabled: selectedIds.length >= 2, initialData: [] },
  );

  const add = (destino: Destino) => {
    if (selectedIds.includes(destino.id)) return;
    if (addCompare({ id: destino.id, nombre: destino.nombre })) {
      setQuery('');
      setPickerOpen(false);
    }
  };
  const remove = (id: string) => removeCompare(id);

  const suggestions = useMemo(() => {
    const pool = (catalog ?? []).filter((d) => !selectedIds.includes(d.id));
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pool.filter((d) => d.nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [catalog, selectedIds, query]);
  const canCompare = selectedIds.length >= 2;

  const cols = items ?? [];
  const minPres = cols.length ? Math.min(...cols.map((d) => presupuestoIndex(d.presupuesto)).filter((i) => i >= 0)) : -1;
  const minMas = cols.length ? Math.min(...cols.map((d) => masificacionIndex(d.masificacion)).filter((i) => i >= 0)) : -1;

  const gridStyle = { gridTemplateColumns: `132px repeat(${cols.length}, minmax(0, 1fr))` };

  return (
    <div className="page-shell">
      <Header />

      <PageHero
        eyebrow="Comparador"
        icon={<GitCompare className="icon-md" style={{ color: 'var(--color-brand)' }} />}
        title="Cara a cara"
        description={`Dos destinos entran (hasta ${MAX}). Tú decides cuál gana: presupuesto, gente, tipo de turismo y mejor época.`}
      />

      <div className="page-wrap">
        <section className="page-section comparador-section">
          <div className="ui-card comparador-panel">
            <div className="comparador-panel__head">
              <div className="comparador-panel__hint">
                <Sparkles className="icon-sm" style={{ color: 'var(--color-brand-dark)' }} />
                Datos sin humo, uno al lado del otro.
              </div>
              {compareItems.length > 0 && (
                <button type="button" onClick={clearCompare} className="comparador-panel__reset">
                  <RotateCcw className="icon-sm" />
                  Reiniciar comparador
                </button>
              )}
            </div>

            <div className="comparador-chips">
              {compareItems.length === 0 && (
                <p className="comparador-chips__empty">Añade destinos y móntales el combate.</p>
              )}
              {compareItems.map((d) => (
                <span key={d.id} className="comparador-chip">
                  {d.nombre.trim()}
                  <button type="button" onClick={() => remove(d.id)} className="comparador-chip__remove" aria-label={`Quitar ${d.nombre}`}>
                    <X className="icon-sm" />
                  </button>
                </span>
              ))}
            </div>

            {selectedIds.length < MAX && (
              <div ref={pickerRef} className="comparador-picker">
                <Search className="comparador-picker__icon" />
                <input
                  value={query}
                  onFocus={() => setPickerOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPickerOpen(true);
                  }}
                  placeholder="Buscar un destino para añadir..."
                  className="comparador-picker__input"
                />
                {pickerOpen && suggestions.length > 0 && (
                  <ul className="comparador-dropdown">
                    {suggestions.map((d) => (
                      <li key={d.id} className="comparador-dropdown__item">
                        <button type="button" onClick={() => add(d)}>
                          <Plus className="icon-sm" style={{ color: 'var(--color-brand-dark)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre.trim()}</span>
                          <span className="comparador-dropdown__loc">{parseJsonSafe(d.ubicacion)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {pickerOpen && query.trim() && suggestions.length === 0 && (
                  <div className="comparador-dropdown__empty">
                    No hay coincidencias con esa búsqueda.
                  </div>
                )}
              </div>
            )}
          </div>

          {!canCompare ? (
            <div className="ui-card comparador-empty">
              <GitCompare className="comparador-empty__icon" />
              <p className="comparador-empty__title">Falta pelea</p>
              <p className="comparador-empty__text">Añade al menos dos destinos. Con uno solo no hay pelea.</p>
            </div>
          ) : loading ? (
            <div className="comparador-loading">Cargando comparación...</div>
          ) : (
            <div className="comparador-table-wrap">
              <div className="comparador-table" style={gridStyle}>
                <div className="comparador-cell comparador-cell--label" />
                {cols.map((d) => (
                  <div key={d.id} className="comparador-cell comparador-cell--header">
                    <Link to={`/destino/${d.id}`}>
                      <div className="comparador-cell__thumb">
                        <img src={getImageUrl(d.imagen)} alt={d.nombre} loading="lazy" />
                      </div>
                      <h3 className="comparador-cell__name">{d.nombre.trim()}</h3>
                    </Link>
                    <p className="comparador-cell__loc">
                      <MapPin className="icon-sm" /> {parseJsonSafe(d.ubicacion)}
                    </p>
                    <button type="button" onClick={() => remove(d.id)} className="comparador-cell__remove" aria-label="Quitar">
                      <X className="icon-sm" />
                    </button>
                  </div>
                ))}

                <div className="comparador-cell--label">Presupuesto</div>
                {cols.map((d) => (
                  <div key={d.id} className="comparador-cell">
                    <Chip highlight={presupuestoIndex(d.presupuesto) === minPres && minPres >= 0}>{parseJsonSafe(d.presupuesto)}</Chip>
                  </div>
                ))}

                <div className="comparador-cell--label">Masificación</div>
                {cols.map((d) => (
                  <div key={d.id} className="comparador-cell">
                    <Chip highlight={masificacionIndex(d.masificacion) === minMas && minMas >= 0}>{parseJsonSafe(d.masificacion)}</Chip>
                  </div>
                ))}

                <div className="comparador-cell--label">Turismo</div>
                {cols.map((d) => (
                  <div key={d.id} className="comparador-cell">
                    <div className="compare-tags">
                      {parseTags(d.tipoTurismoPrincipal).map((t) => (
                        <span key={t} className="compare-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="comparador-cell--label">Mejor época</div>
                {cols.map((d) => {
                  const best = getBestSeason(d);
                  return (
                    <div key={d.id} className="comparador-cell">
                      <p className="comparador-season__label">{best.label}</p>
                      <p className="comparador-season__months">{best.months}</p>
                    </div>
                  );
                })}

                <div className="comparador-cell--label">Afluencia</div>
                {cols.map((d) => (
                  <div key={d.id} className="comparador-cell">
                    <div className="comparador-afluencia">
                      {getSeasons(d).map((s) => (
                        <div key={s.key}>
                          <div className="comparador-afluencia__row-head">
                            <span>{s.label}</span>
                            <span>{s.value}%</span>
                          </div>
                          <div className="comparador-afluencia__bar">
                            <div className="comparador-afluencia__fill" style={{ width: `${s.value}%`, backgroundColor: getMasificationColor(s.value) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <Footer />
      </div>
    </div>
  );
}
