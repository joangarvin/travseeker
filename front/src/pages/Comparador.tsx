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
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md border ${
        highlight
          ? 'bg-[var(--color-brand)]/12 border-[var(--color-brand)]/30 text-[var(--color-brand-dark)]'
          : 'bg-[var(--color-secondary)] border-[var(--color-border)] text-[var(--color-primary)]'
      }`}
    >
      {highlight && <Check className="w-3.5 h-3.5" />}
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
  const labelCell = 'sticky left-0 z-10 p-4 bg-[var(--color-surface)] flex items-center text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]';
  const cell = 'p-4 bg-[var(--color-surface)]';

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <PageHero
        eyebrow="Comparador"
        icon={<GitCompare className="w-6 h-6 text-[var(--color-brand)]" />}
        title="Cara a cara"
        description={`Dos destinos entran (hasta ${MAX}). Tú decides cuál gana: presupuesto, gente, tipo de turismo y mejor época.`}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-20 space-y-6 sm:space-y-8">
        <div className="ui-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Sparkles className="w-4 h-4 text-[var(--color-brand-dark)]" />
              Datos sin humo, uno al lado del otro.
            </div>
            {compareItems.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar comparador
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {compareItems.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">Añade destinos y móntales el combate.</p>
            )}
            {compareItems.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-sm font-medium text-[var(--color-primary)]">
                {d.nombre.trim()}
                <button onClick={() => remove(d.id)} className="w-6 h-6 rounded-md hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)] flex items-center justify-center transition-colors" aria-label={`Quitar ${d.nombre}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {selectedIds.length < MAX && (
            <div ref={pickerRef} className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                value={query}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPickerOpen(true);
                }}
                placeholder="Buscar un destino para añadir..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all shadow-sm"
              />
              {pickerOpen && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xl py-1">
                  {suggestions.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => add(d)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[var(--color-brand-dark)] shrink-0" />
                        <span className="truncate">{d.nombre.trim()}</span>
                        <span className="ml-auto text-xs text-[var(--color-muted)] truncate">{parseJsonSafe(d.ubicacion)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {pickerOpen && query.trim() && suggestions.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xl px-3 py-2 text-sm text-[var(--color-muted)]">
                  No hay coincidencias con esa búsqueda.
                </div>
              )}
            </div>
          )}
        </div>

        {!canCompare ? (
          <div className="ui-card text-center py-16 px-6">
            <GitCompare className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4 opacity-70" />
            <p className="font-serif text-xl text-[var(--color-primary)] mb-2">Falta pelea</p>
            <p className="text-[var(--color-muted)]">Añade al menos dos destinos. Con uno solo no hay pelea.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-[var(--color-muted)]">Cargando comparación...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-strong)] shadow-sm">
            <div className="min-w-[640px] grid gap-px bg-[var(--color-border)] overflow-hidden" style={gridStyle}>
              {/* Header row */}
              <div className={`${cell} sticky left-0 z-10`} />
              {cols.map((d) => (
                <div key={d.id} className={`${cell} relative`}>
                  <Link to={`/destino/${d.id}`} className="block group">
                    <div className="relative h-24 rounded-lg overflow-hidden mb-3">
                      <img src={getImageUrl(d.imagen)} alt={d.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    </div>
                    <h3 className="font-semibold text-[var(--color-primary)] leading-tight line-clamp-2">{d.nombre.trim()}</h3>
                  </Link>
                  <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {parseJsonSafe(d.ubicacion)}
                  </p>
                  <button onClick={() => remove(d.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white/90 flex items-center justify-center hover:bg-[var(--color-danger)] transition-colors" aria-label="Quitar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Presupuesto */}
              <div className={labelCell}>Presupuesto</div>
              {cols.map((d) => (
                <div key={d.id} className={cell}>
                  <Chip highlight={presupuestoIndex(d.presupuesto) === minPres && minPres >= 0}>{parseJsonSafe(d.presupuesto)}</Chip>
                </div>
              ))}

              {/* Masificación */}
              <div className={labelCell}>Masificación</div>
              {cols.map((d) => (
                <div key={d.id} className={cell}>
                  <Chip highlight={masificacionIndex(d.masificacion) === minMas && minMas >= 0}>{parseJsonSafe(d.masificacion)}</Chip>
                </div>
              ))}

              {/* Turismo */}
              <div className={labelCell}>Turismo</div>
              {cols.map((d) => (
                <div key={d.id} className={cell}>
                  <div className="flex flex-wrap gap-1.5">
                    {parseTags(d.tipoTurismoPrincipal).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-secondary)] border border-[var(--color-border)] text-[var(--color-primary)]">{t}</span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Mejor época */}
              <div className={labelCell}>Mejor época</div>
              {cols.map((d) => {
                const best = getBestSeason(d);
                return (
                  <div key={d.id} className={cell}>
                    <p className="font-semibold text-[var(--color-primary)] text-sm">{best.label}</p>
                    <p className="text-xs text-[var(--color-muted)]">{best.months}</p>
                  </div>
                );
              })}

              {/* Afluencia por temporada */}
              <div className={labelCell}>Afluencia</div>
              {cols.map((d) => (
                <div key={d.id} className={`${cell} space-y-2`}>
                  {getSeasons(d).map((s) => (
                    <div key={s.key}>
                      <div className="flex justify-between text-[11px] text-[var(--color-muted)] mb-0.5">
                        <span>{s.label}</span>
                        <span>{s.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-primary)]/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: getMasificationColor(s.value) }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
