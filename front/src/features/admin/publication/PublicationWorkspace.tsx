import { useEffect, useRef, useState } from 'react';
import {
  Globe2,
  BookOpen,
  Search,
  Plus,
  Check,
  Eye,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Building2,
  Compass,
  BedDouble,
  Utensils,
  Signpost,
} from 'lucide-react';
import { Dialog, Notice, Loader } from '../../../components/ui';
import { api } from '../../../services/api';
import Publication from './Publication';
import Tutorial from './Tutorial';
import { Flow, Countries, Badge } from './views';
import { resources, labels, outcome, type Country, type Entry, type Result } from './model';
import type { AdminTab } from '../types';
const resourceIcons: Record<string, typeof MapPin> = {
  destinos: MapPin,
  municipios: Building2,
  actividades: Compass,
  hoteles: BedDouble,
  restaurantes: Utensils,
  places: MapPin,
  'tipos-actividad': Compass,
  'tipos-viaje': Signpost,
};
function ResourceIcon({ resource }: { resource: string }) {
  const Icon = resourceIcons[resource] || Layers;
  return <Icon size={18} aria-hidden="true" />;
}
type Props = {
  token: string;
  onOpenCatalog: (tab: AdminTab, entry?: Entry) => Promise<void>;
  onLegacy: () => void;
};
type Page = {
  items: Entry[];
  total: number;
  counts: Partial<Record<Result, number>>;
  regions: string[];
};
type Modal =
  | { kind: 'entry'; draft: Entry; original: string }
  | { kind: 'country'; draft: Country; original: string }
  | { kind: 'tutorial' }
  | { kind: 'preview'; code: string };
type Preview = {
  country: { code: string; name: string; state: Result };
  items: { id: string; title: string; state: Result }[];
};
function initialContext() {
  try {
    const value = JSON.parse(sessionStorage.getItem('trav-admin-country-context') || '{}');
    return {
      country: typeof value.country === 'string' ? value.country : 'ES',
      region: typeof value.region === 'string' ? value.region : '',
    };
  } catch {
    return { country: 'ES', region: '' };
  }
}
export function PublicationWorkspace({ token, onOpenCatalog, onLegacy }: Props) {
  const [context, setContext] = useState(initialContext);
  const [resource, setResource] = useState('destinos');
  const [area, setArea] = useState<'content' | 'countries'>('content');
  const [countries, setCountries] = useState<Country[]>([]);
  const [pageKey, setPageKey] = useState('');
  const [page, setPage] = useState<Page>({ items: [], total: 0, counts: {}, regions: [] });
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Result | ''>('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [discard, setDiscard] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewRequest = useRef<AbortController | null>(null);
  const config = resources.find((r) => r.id === resource)!;
  const global = 'global' in config && config.global;
  const selected = countries.find((c) => c.code === context.country);
  const dirty = !!modal && 'draft' in modal && JSON.stringify(modal.draft) !== modal.original;
  const requestKey = JSON.stringify([
    resource,
    context.country,
    context.region,
    query,
    filter,
    offset,
  ]);
  const isCurrentPage = pageKey === requestKey;
  useEffect(() => {
    try {
      sessionStorage.setItem('trav-admin-country-context', JSON.stringify(context));
    } catch {
      /* browser storage optional */
    }
  }, [context]);
  useEffect(() => {
    setOffset(0);
  }, [resource, context.country, context.region, query, filter]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        resource,
        country: context.country,
        region: context.region,
        q: query,
        state: filter,
        offset: String(offset),
      });
      Promise.all([
        api<Country[]>('/admin/publication/countries', { signal: controller.signal }, token),
        api<Page>(`/admin/publication/records?${params}`, { signal: controller.signal }, token),
        api<Record<string, number>>(
          `/admin/publication/summary?${params}`,
          { signal: controller.signal },
          token,
        ),
      ])
        .then(([nextCountries, nextPage, nextSummary]) => {
          if (!controller.signal.aborted) {
            setCountries(nextCountries);
            setPage(nextPage);
            setPageKey(requestKey);
            setSummary(nextSummary);
          }
        })
        .catch((cause) => {
          if (!controller.signal.aborted) setError(cause.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, resource, context.country, context.region, query, filter, offset, revision]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(() => () => previewRequest.current?.abort(), []);
  const open = (entry: Entry) => {
    setDialogError('');
    setDiscard(false);
    setModal({ kind: 'entry', draft: { ...entry }, original: JSON.stringify(entry) });
  };
  const openCountry = (country: Country) => {
    setDialogError('');
    setDiscard(false);
    setModal({ kind: 'country', draft: { ...country }, original: JSON.stringify(country) });
  };
  const close = () => {
    if (busy) return;
    if (dirty) {
      setDiscard(true);
      return;
    }
    previewRequest.current?.abort();
    setModal(null);
    setDialogError('');
  };
  const update = (values: Partial<Entry & Country>) => {
    setDialogError('');
    setDiscard(false);
    setModal((m) =>
      m && 'draft' in m ? ({ ...m, draft: { ...m.draft, ...values } } as Modal) : m,
    );
  };
  const chooseCountry = (code: string) => {
    setResource('destinos');
    setContext({ country: code, region: '' });
    setArea('content');
    setQuery('');
    setFilter('');
    setOffset(0);
  };
  async function save() {
    if (!modal || !('draft' in modal) || busy) return;
    setBusy(true);
    setDialogError('');
    try {
      const draft = modal.draft;
      await api(
        modal.kind === 'country'
          ? `/admin/publication/countries/${modal.draft.code}`
          : `/admin/publication/records/${modal.draft.resource}/${encodeURIComponent(modal.draft.id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            preparationComplete: draft.preparationComplete,
            showOnWebsite: draft.showOnWebsite,
            ...(modal.kind === 'entry'
              ? { countryCode: modal.draft.countryCode, region: modal.draft.region }
              : {}),
          }),
        },
        token,
      );
      setNotice('Configuración guardada. La visibilidad pública se ha actualizado.');
      setModal(null);
      setRevision((r) => r + 1);
    } catch (cause) {
      setDialogError(
        cause instanceof Error ? cause.message : 'No se pudo guardar. El borrador se conserva.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function openPreview(code: string) {
    previewRequest.current?.abort();
    const controller = new AbortController();
    previewRequest.current = controller;
    setPreview(null);
    setDialogError('');
    setModal({ kind: 'preview', code });
    try {
      const value = await api<Preview>(
        `/admin/publication/preview/${code}`,
        { signal: controller.signal },
        token,
      );
      if (!controller.signal.aborted) setPreview(value);
    } catch (cause) {
      if (!controller.signal.aborted)
        setDialogError(
          cause instanceof Error ? cause.message : 'No se pudo cargar la vista previa',
        );
    }
  }
  async function advanced(entry?: Entry) {
    if (dirty) {
      setDiscard(true);
      return;
    }
    setBusy(true);
    setDialogError('');
    try {
      await onOpenCatalog((entry?.editorTab || config.tab) as AdminTab, entry);
      setModal(null);
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo abrir la ficha');
    } finally {
      setBusy(false);
    }
  }
  const value =
    modal && 'draft' in modal
      ? outcome(
          modal.draft.preparationComplete,
          modal.draft.showOnWebsite,
          modal.kind === 'entry' && !modal.draft.global
            ? countries.find((c) => c.code === modal.draft.countryCode)
            : undefined,
          modal.kind === 'country' || modal.draft.teaser,
        )
      : null;
  return (
    <div className="admin-publication">
      <header className="ex-top">
        <strong>Administración · Publicación por países</strong>
        <div>
          <button className="ex-btn" onClick={onLegacy}>
            Catálogo detallado
          </button>
          <button className="ex-btn" onClick={() => setModal({ kind: 'tutorial' })}>
            <BookOpen size={17} />
            Guía del equipo
          </button>
        </div>
      </header>
      <div className="ex-shell">
        <nav className="ex-sidebar" aria-label="Catálogos">
          <span className="ex-eyebrow">ESPACIO EDITORIAL</span>
          <button aria-pressed={area === 'countries'} onClick={() => setArea('countries')}>
            <Globe2 size={18} />
            Países<span>{countries.length}</span>
          </button>
          <span className="ex-sidebar-label">CONTENIDO</span>
          {resources.map((r) => (
            <button
              key={r.id}
              aria-pressed={area === 'content' && resource === r.id}
              onClick={() => {
                setResource(r.id);
                setArea('content');
                setQuery('');
                setFilter('');
                setOffset(0);
              }}
            >
              <ResourceIcon resource={r.id} />
              {r.name}
              <span>{summary[r.id] ?? '—'}</span>
            </button>
          ))}
          <div className="ex-global-note">
            <Layers size={18} />
            <strong>Tipos compartidos</strong>
            <p>Los tipos de viaje y actividad son globales. No se duplican por país.</p>
          </div>
          <button className="ex-sidebar-help" onClick={() => setModal({ kind: 'tutorial' })}>
            <BookOpen size={18} />
            Cómo preparar y publicar
          </button>
        </nav>
        <section className="ex-main" aria-label="Publicación y catálogos">
          <div className="ex-context">
            <div>
              <Globe2 size={20} />
              <span>
                Contexto de trabajo<small>Se conserva al cambiar de catálogo.</small>
              </span>
            </div>
            <label>
              País
              <select
                value={context.country}
                onChange={(e) => setContext({ country: e.target.value, region: '' })}
              >
                <option value="">Todos los países</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Región
              <select
                value={context.region}
                disabled={!context.country || global || area === 'countries' || !isCurrentPage}
                onChange={(e) => setContext({ ...context, region: e.target.value })}
              >
                <option value="">Todas las regiones</option>
                {[...new Set([...page.regions, ...(context.region ? [context.region] : [])])].map(
                  (region) => (
                    <option key={region}>{region}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <header className="ex-heading">
            <div>
              <span className="ex-eyebrow">PREPARAR NO ES PUBLICAR</span>
              <h1>
                {area === 'countries'
                  ? 'Un catálogo. Más países.'
                  : `${config.name}${!global && selected ? ` en ${selected.name}` : ''}`}
              </h1>
              <p>Completa las fichas, comprueba su visibilidad y decide cuándo publicarlas.</p>
            </div>
            {area === 'content' && (
              <button className="ex-btn ex-btn--primary" onClick={() => void advanced()}>
                <Plus size={18} />
                Crear o editar fichas
              </button>
            )}
          </header>
          {error && (
            <Notice
              tone="error"
              action={
                <button className="ex-link" onClick={() => setRevision((r) => r + 1)}>
                  Reintentar
                </button>
              }
            >
              {error}
            </Notice>
          )}
          {notice && (
            <div className="ex-feedback" role="status">
              <Check size={18} />
              <span>{notice}</span>
              <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {global && area === 'content' && (
            <p className="ex-global-alert">
              Catálogo global: los filtros de país y región no se aplican a los tipos compartidos.
            </p>
          )}
          {area === 'content' && (
            <div className="ex-metrics">
              {(['draft', 'ready', 'public', 'blocked'] as Result[]).map((state) => (
                <button
                  key={state}
                  aria-pressed={filter === state}
                  onClick={() => setFilter(filter === state ? '' : state)}
                >
                  <span>{labels[state]}</span>
                  <strong>{isCurrentPage ? page.counts[state] || 0 : '…'}</strong>
                </button>
              ))}
            </div>
          )}
          {selected && !global && area === 'content' && selected.state !== 'public' && (
            <div className="ex-country-alert">
              <Globe2 size={20} />
              <div>
                <strong>{selected.name} aún no está publicado.</strong>
                <p>
                  Las fichas con Mostrar: Sí seguirán ocultas hasta que el país esté acabado y
                  visible.
                </p>
              </div>
              <button className="ex-link" onClick={() => openCountry(selected)}>
                Gestionar país <ArrowUpRight size={16} />
              </button>
            </div>
          )}
          {area === 'content' && (
            <div className="ex-toolbar">
              <label>
                <Search size={18} />
                <input
                  aria-label="Buscar contenido"
                  placeholder="Buscar contenido"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select
                className="ex-status-filter"
                aria-label="Resultado público"
                value={filter}
                onChange={(e) => setFilter(e.target.value as Result | '')}
              >
                <option value="">Todos los estados</option>
                {Object.entries(labels).map(([state, label]) => (
                  <option key={state} value={state}>
                    {label}
                  </option>
                ))}
              </select>
              <span>{isCurrentPage ? page.total : '…'} resultados</span>
              {selected && !global && (
                <button className="ex-link" onClick={() => void openPreview(selected.code)}>
                  <Eye size={17} />
                  Vista pública
                </button>
              )}
            </div>
          )}
          {loading || (!isCurrentPage && !error) ? (
            <Loader label="Cargando publicación…" />
          ) : (
            !error && (
              <>
                {area === 'countries' ? (
                  <>
                    <p className="ex-country-scope">
                      Vista global de países. El selector territorial se aplica al contenido de cada
                      catálogo.
                    </p>
                    <Countries
                      countries={countries}
                      onEdit={openCountry}
                      onSelect={chooseCountry}
                      onPreview={(code) => void openPreview(code)}
                    />
                  </>
                ) : (
                  <>
                    <p className="ex-country-scope">
                      Las columnas muestran las fichas de esta página. Los contadores superiores
                      incluyen todos los resultados.
                    </p>
                    <Flow entries={page.items} onEdit={open} />
                    {!page.items.length && (
                      <div className="ex-empty">
                        <h3>No hay fichas con estos filtros.</h3>
                        <button
                          className="ex-btn"
                          onClick={() => {
                            setQuery('');
                            setFilter('');
                            setContext({ ...context, region: '' });
                          }}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                    <div className="ex-pagination">
                      <button
                        className="ex-btn"
                        disabled={offset === 0}
                        onClick={() => setOffset((n) => Math.max(0, n - 40))}
                      >
                        <ArrowLeft size={17} />
                        Anterior
                      </button>
                      <span>
                        {page.total ? offset + 1 : 0}–{Math.min(offset + 40, page.total)} de{' '}
                        {page.total}
                      </span>
                      <button
                        className="ex-btn"
                        disabled={offset + 40 >= page.total}
                        onClick={() => setOffset((n) => n + 40)}
                      >
                        Siguiente
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )
          )}
        </section>
      </div>
      {modal && (
        <Dialog
          title={
            modal.kind === 'tutorial'
              ? 'Preparar, terminar y publicar'
              : modal.kind === 'preview'
                ? 'Vista previa pública'
                : modal.kind === 'country'
                  ? `Publicación de ${modal.draft.name}`
                  : modal.draft.title
          }
          className="ex-dialog"
          onClose={close}
          busy={busy}
        >
          <div className="ex-dialog-body">
            {dialogError && <Notice tone="error">{dialogError}</Notice>}
            {modal.kind === 'tutorial' ? (
              <Tutorial />
            ) : modal.kind === 'preview' ? (
              preview ? (
                <div className="ex-public-preview">
                  <span className="ex-eyebrow">SOLO VISTA PREVIA · NO PUBLICA NADA</span>
                  <Badge value={preview.country.state} />
                  <h3>{preview.country.name}</h3>
                  {preview.country.state === 'public' ? (
                    <>
                      {preview.items.map((item) => (
                        <article key={item.id}>
                          <Badge value={item.state} />
                          <h4>{item.title}</h4>
                        </article>
                      ))}
                      {!preview.items.length && <p>Aún no hay destinos visibles.</p>}
                    </>
                  ) : (
                    <p>
                      {preview.country.state === 'upcoming'
                        ? 'Solo estará disponible el anuncio Próximamente. Las fichas del país siguen ocultas.'
                        : 'Este país no aparece en el catálogo público.'}
                    </p>
                  )}
                </div>
              ) : (
                !dialogError && <Loader />
              )
            ) : (
              <>
                {modal.kind === 'entry' && (
                  <div className="ex-fields">
                    <p>{modal.draft.description || 'La ficha todavía no tiene descripción.'}</p>
                    {!modal.draft.global && (
                      <div>
                        <label>
                          País del contenido
                          <select
                            disabled={busy}
                            value={modal.draft.countryCode || ''}
                            onChange={(e) => update({ countryCode: e.target.value, region: '' })}
                          >
                            {countries.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Región del contenido
                          <input
                            disabled={busy}
                            maxLength={160}
                            value={modal.draft.region}
                            onChange={(e) => update({ region: e.target.value })}
                          />
                        </label>
                      </div>
                    )}
                    <button
                      className="ex-link"
                      disabled={busy}
                      onClick={() => void advanced(modal.draft)}
                    >
                      Abrir ficha completa <ArrowUpRight size={17} />
                    </button>
                  </div>
                )}
                <fieldset disabled={busy} className="ex-control-fieldset">
                  <Publication
                    ready={modal.draft.preparationComplete}
                    show={modal.draft.showOnWebsite}
                    teaser={modal.kind === 'country' || modal.draft.teaser}
                    onReady={(ready) =>
                      update({
                        preparationComplete: ready,
                        ...(!ready && modal.kind === 'entry' && !modal.draft.teaser
                          ? { showOnWebsite: false }
                          : {}),
                      })
                    }
                    onShow={(show) => update({ showOnWebsite: show })}
                  />
                </fieldset>
                <div className="ex-result">
                  <span>Al guardar, el resultado será</span>
                  <Badge value={value!} />
                  <p>
                    {value === 'blocked'
                      ? 'La ficha seguirá oculta porque su país aún no está publicado.'
                      : value === 'ready'
                        ? 'Está acabado, pero no se muestra. Activa Mostrar cuando quieras publicarlo.'
                        : value === 'upcoming'
                          ? 'Se habilita un anuncio Próximamente, sin exponer la ficha incompleta.'
                          : value === 'public'
                            ? 'El contenido acabado será visible.'
                            : 'Solo estará disponible en administración.'}
                  </p>
                  {modal.kind === 'country' && (
                    <p>
                      Este ajuste condiciona la visibilidad de sus {modal.draft.contentCount}{' '}
                      contenidos, sin cambiar sus interruptores.
                    </p>
                  )}
                </div>
                {discard && (
                  <div className="ex-discard" role="alert">
                    <p>Tienes cambios sin guardar.</p>
                    <button className="ex-btn" onClick={() => setDiscard(false)}>
                      Seguir editando
                    </button>
                    <button
                      className="ex-btn"
                      onClick={() => {
                        setModal(null);
                        setDialogError('');
                      }}
                    >
                      Descartar cambios
                    </button>
                  </div>
                )}
                <div className="ex-dialog-actions">
                  <button className="ex-btn" disabled={busy} onClick={close}>
                    Cancelar
                  </button>
                  <button
                    className="ex-btn ex-btn--primary"
                    disabled={busy || !dirty}
                    aria-busy={busy}
                    onClick={() => void save()}
                  >
                    {busy ? 'Guardando…' : dialogError ? 'Reintentar guardado' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
