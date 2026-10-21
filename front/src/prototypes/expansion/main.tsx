import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Globe2,
  BookOpen,
  Search,
  Plus,
  Check,
  Eye,
  Layers,
  MapPin,
  Compass,
  BedDouble,
  Utensils,
  Building2,
  ArrowUpRight,
  RotateCcw,
  Moon,
  Sun,
} from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import '../../styles/index.css';
import './style.css';
import {
  initial,
  regions,
  kinds,
  labels,
  teaser,
  validate,
  entryResult,
  countryResult,
  type Country,
  type Entry,
  type Snapshot,
  type Kind,
  type Result,
} from './model';
import Mesa from './Mesa';
import Flujo from './Flujo';
import Territorio from './Territorio';
import Publication from './Publication';
import Tutorial from './Tutorial';
import { Badge } from './views';
const key = 'trav-expansion-prototype-v1';
const uiKey = key + '-context';
const variants = ['Mesa', 'Flujo', 'Territorio'];
const icons = {
  Destinos: MapPin,
  Localidades: Building2,
  Actividades: Compass,
  Hoteles: BedDouble,
  Restaurantes: Utensils,
};
type Modal =
  | { kind: 'entry'; draft: Entry; original: string }
  | { kind: 'country'; draft: Country; original: string }
  | { kind: 'tutorial' }
  | { kind: 'preview'; country: string }
  | { kind: 'reset' };
function readData(): Snapshot {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(value?.countries) && Array.isArray(value?.entries)) return value;
  } catch {
    /* demo fallback */
  }
  return structuredClone(initial);
}
function readContext() {
  try {
    return (
      JSON.parse(localStorage.getItem(uiKey) || 'null') || {
        country: 'PT',
        region: '',
        catalog: 'Destinos',
      }
    );
  } catch {
    return { country: 'PT', region: '', catalog: 'Destinos' };
  }
}
function App() {
  const [data, setData] = useState(readData);
  const [context, setContext] = useState(readContext);
  const [v, setV] = useState(() =>
    Math.max(0, Math.min(2, (Number(new URLSearchParams(location.search).get('v')) || 1) - 1)),
  );
  const [area, setArea] = useState<'content' | 'countries'>(() =>
    new URLSearchParams(location.search).get('area') === 'countries' ? 'countries' : 'content',
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Result | ''>('');
  const [countryFilter, setCountryFilter] = useState<Result | ''>('');
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [discard, setDiscard] = useState(false);
  const [dark, setDark] = useState(false);
  const [pickerReady, setPickerReady] = useState(false);
  const picker = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dirty = !!modal && 'draft' in modal && JSON.stringify(modal.draft) !== modal.original;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    try {
      localStorage.setItem(uiKey, JSON.stringify(context));
    } catch {
      /* filter storage optional */
    }
  }, [context]);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('v', String(v + 1));
    url.searchParams.set('area', area);
    history.replaceState(null, '', url);
  }, [v, area]);
  useLayoutEffect(() => {
    const el = picker.current?.querySelectorAll<HTMLButtonElement>('.proto-picker-item')[v];
    const hi = picker.current?.querySelector<HTMLElement>('.proto-picker-highlight');
    if (el && hi) {
      hi.style.width = el.offsetWidth + 'px';
      hi.style.transform = `translateX(${el.offsetLeft}px)`;
    }
  }, [v, modal]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setPickerReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    function keys(e: KeyboardEvent) {
      if (
        modal ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      )
        return;
      if (['1', '2', '3'].includes(e.key)) setV(Number(e.key) - 1);
      if (e.key === 'ArrowRight') setV((i) => (i + 1) % 3);
      if (e.key === 'ArrowLeft') setV((i) => (i + 2) % 3);
    }
    document.addEventListener('keydown', keys);
    return () => document.removeEventListener('keydown', keys);
  }, [modal]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const edit = (entry: Entry) => {
    setError('');
    setDiscard(false);
    setModal({ kind: 'entry', draft: { ...entry }, original: JSON.stringify(entry) });
  };
  const editCountry = (country: Country) => {
    setError('');
    setDiscard(false);
    setModal({ kind: 'country', draft: { ...country }, original: JSON.stringify(country) });
  };
  const selectCountry = (country: string) => {
    setContext({ ...context, country, region: '' });
    setArea('content');
    setQuery('');
    setFilter('');
  };
  const close = () => {
    if (busy) return;
    if (dirty) {
      setDiscard(true);
      return;
    }
    setModal(null);
    setError('');
  };
  const updateEntry = (change: Partial<Entry>) => {
    setError('');
    setDiscard(false);
    setModal((m) => (m?.kind === 'entry' ? { ...m, draft: { ...m.draft, ...change } } : m));
  };
  const updateCountry = (change: Partial<Country>) => {
    setError('');
    setDiscard(false);
    setModal((m) => (m?.kind === 'country' ? { ...m, draft: { ...m.draft, ...change } } : m));
  };
  async function save() {
    if (!modal || !('draft' in modal) || busy) return;
    const validation =
      modal.kind === 'entry'
        ? validate(modal.draft)
        : !modal.draft.name.trim()
          ? 'Escribe un nombre para el país.'
          : '';
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError('');
    await new Promise((r) => setTimeout(r, 650));
    try {
      if (fail) throw Error();
      const next =
        modal.kind === 'entry'
          ? {
              ...data,
              entries: data.entries.some((e) => e.id === modal.draft.id)
                ? data.entries.map((e) => (e.id === modal.draft.id ? modal.draft : e))
                : [...data.entries, modal.draft],
            }
          : {
              ...data,
              countries: data.countries.map((c) => (c.id === modal.draft.id ? modal.draft : c)),
            };
      localStorage.setItem(key, JSON.stringify(next));
      setData(next);
      setNotice(
        `${modal.kind === 'country' ? modal.draft.name : modal.draft.title} guardado. Solo se ha actualizado la demostración.`,
      );
      setModal(null);
    } catch {
      setError('No se ha podido guardar. Conservamos tu borrador; puedes reintentar.');
    } finally {
      setBusy(false);
    }
  }
  const scope = data.entries.filter(
    (e) =>
      (!context.country || e.country === context.country) &&
      (!context.region || e.region === context.region),
  );
  const catalog = scope.filter((e) => e.kind === context.catalog);
  const entries = catalog.filter(
    (e) =>
      (!filter || entryResult(e, data.countries) === filter) &&
      `${e.title} ${e.region}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const current = data.countries.find((c) => c.id === context.country);
  const Component = [Mesa, Flujo, Territorio][v];
  const result =
    modal?.kind === 'entry'
      ? entryResult(modal.draft, data.countries)
      : modal?.kind === 'country'
        ? countryResult(modal.draft)
        : null;
  const previewCountry =
    modal?.kind === 'preview' ? data.countries.find((c) => c.id === modal.country) : undefined;
  const newEntry = () => {
    const country = context.country || 'PT';
    edit({
      id: `demo-${Date.now()}`,
      country,
      region: context.region || regions[country][0],
      kind: context.catalog as Kind,
      title: '',
      description: '',
      ready: false,
      show: false,
    });
  };
  return (
    <>
      <header className="ex-top">
        <span className="ex-brand">
          <img src="/brand/travseeker-logo.svg" alt="" />
          TravSeeker<span>ADMIN</span>
        </span>
        <span className="ex-demo">PROTOTIPO · DATOS DE DEMOSTRACIÓN</span>
        <div>
          <button className="ex-icon" aria-label="Cambiar tema" onClick={() => setDark((x) => !x)}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="ex-btn ex-btn--help" onClick={() => setModal({ kind: 'tutorial' })}>
            <BookOpen size={17} />
            Guía del equipo
          </button>
          <span className="ex-avatar" aria-label="Editor de demostración">
            ED
          </span>
        </div>
      </header>
      <div className="ex-shell">
        <aside className="ex-sidebar">
          <span className="ex-eyebrow">ESPACIO EDITORIAL</span>
          <button
            className={area === 'countries' ? 'is-active' : ''}
            onClick={() => setArea('countries')}
          >
            <Globe2 size={18} />
            Países<span>{data.countries.length}</span>
          </button>
          <span className="ex-sidebar-label">CONTENIDO</span>
          {kinds.map((kind) => {
            const Icon = icons[kind];
            return (
              <button
                key={kind}
                className={area === 'content' && context.catalog === kind ? 'is-active' : ''}
                onClick={() => {
                  setArea('content');
                  setContext({ ...context, catalog: kind });
                  setFilter('');
                  setQuery('');
                }}
              >
                <Icon size={18} />
                {kind}
                <span>{scope.filter((e) => e.kind === kind).length}</span>
              </button>
            );
          })}
          <div className="ex-global-note">
            <Layers size={18} />
            <strong>Tipos compartidos</strong>
            <p>Los tipos de viaje y actividad son globales. No se duplican por país.</p>
          </div>
          <button className="ex-sidebar-help" onClick={() => setModal({ kind: 'tutorial' })}>
            <BookOpen size={17} />
            Cómo preparar y publicar
          </button>
        </aside>
        <main className="ex-main">
          <div className="ex-breadcrumb">
            Administración <span>/</span> Expansión internacional <span>/</span>
            <strong>{area === 'countries' ? 'Países' : context.catalog}</strong>
          </div>
          <div className="ex-context">
            <div>
              <Globe2 size={20} />
              <span>
                Contexto de trabajo<small>Se mantiene al cambiar de sección.</small>
              </span>
            </div>
            <label>
              País
              <select
                value={context.country}
                onChange={(e) => setContext({ ...context, country: e.target.value, region: '' })}
              >
                <option value="">Todos los países</option>
                {data.countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Región
              <select
                disabled={!context.country || area === 'countries'}
                value={context.region}
                onChange={(e) => setContext({ ...context, region: e.target.value })}
              >
                <option value="">Todas las regiones</option>
                {(regions[context.country] || []).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          <header className="ex-heading">
            <div>
              <span className="ex-eyebrow">
                {area === 'countries' ? 'EL PRÓXIMO CAPÍTULO' : 'PREPARAR NO ES PUBLICAR'}
              </span>
              <h1>
                {area === 'countries'
                  ? 'Un catálogo. Más países.'
                  : `${context.catalog}${current ? ` en ${current.name}` : ''}`}
              </h1>
              <p>
                {area === 'countries'
                  ? 'Prepara cada país a su ritmo. Tú decides cuándo se abre al público.'
                  : 'Completa el contenido, revisa cómo se mostrará y publícalo cuando esté listo.'}
              </p>
            </div>
            {area === 'countries' ? (
              <button
                className="ex-btn ex-btn--primary"
                onClick={() => setModal({ kind: 'tutorial' })}
              >
                <BookOpen size={17} />
                Cómo lanzar un país
              </button>
            ) : (
              <button className="ex-btn ex-btn--primary" onClick={newEntry}>
                <Plus size={18} />
                Crear contenido
              </button>
            )}
          </header>
          <div className="ex-metrics">
            {(
              (area === 'countries'
                ? ['draft', 'ready', 'public', 'upcoming']
                : ['draft', 'ready', 'public', 'blocked']) as Result[]
            ).map((state) => (
              <button
                key={state}
                aria-pressed={(area === 'countries' ? countryFilter : filter) === state}
                className={
                  (area === 'countries' ? countryFilter : filter) === state ? 'is-active' : ''
                }
                onClick={() => {
                  if (area === 'countries') setCountryFilter(countryFilter === state ? '' : state);
                  else setFilter(filter === state ? '' : state);
                }}
              >
                <span>{labels[state]}</span>
                <strong>
                  {area === 'countries'
                    ? data.countries.filter((c) => countryResult(c) === state).length
                    : catalog.filter((e) => entryResult(e, data.countries) === state).length}
                </strong>
              </button>
            ))}
          </div>
          {current && area === 'content' && countryResult(current) !== 'public' && (
            <div className="ex-country-alert">
              <Globe2 size={20} />
              <div>
                <strong>{current.name} aún no está publicado.</strong>
                <p>
                  Las fichas permanecen ocultas aunque tengan Mostrar en Sí. Su configuración se
                  conserva.
                </p>
              </div>
              <button className="ex-link" onClick={() => editCountry(current)}>
                Gestionar país <ArrowUpRight size={16} />
              </button>
            </div>
          )}
          <div className="ex-area-tabs" aria-label="Áreas del prototipo">
            <button aria-pressed={area === 'content'} onClick={() => setArea('content')}>
              1 · Estados y visibilidad
            </button>
            <button aria-pressed={area === 'countries'} onClick={() => setArea('countries')}>
              2 · Panel por países
            </button>
          </div>
          {notice && (
            <div className="ex-feedback" role="status">
              <Check size={18} />
              <span>{notice}</span>
              <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {area === 'content' && (
            <div className="ex-toolbar">
              <label>
                <Search size={18} />
                <input
                  placeholder="Buscar contenido"
                  aria-label="Buscar contenido"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="ex-status-filter">
                <span className="sr-only">Filtrar por resultado público</span>
                <select
                  aria-label="Filtrar por resultado público"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Result | '')}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(labels).map(([id, label]) => (
                    <option value={id} key={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <span>{entries.length} resultados</span>
              {current && (
                <button
                  className="ex-link"
                  onClick={() => setModal({ kind: 'preview', country: current.id })}
                >
                  <Eye size={17} />
                  Vista pública
                </button>
              )}
            </div>
          )}
          {area === 'countries' && (
            <p className="ex-country-scope">
              Vista global de países{countryFilter ? ` · ${labels[countryFilter]}` : ''}. El
              contexto de país y región se aplica a los catálogos de contenido.
            </p>
          )}
          <div key={`${v}-${area}`}>
            <Component
              data={
                area === 'countries' && countryFilter
                  ? {
                      ...data,
                      countries: data.countries.filter((c) => countryResult(c) === countryFilter),
                    }
                  : data
              }
              entries={entries}
              edit={edit}
              editCountry={editCountry}
              selectCountry={selectCountry}
              preview={(country) => setModal({ kind: 'preview', country })}
              area={area}
            />
          </div>
          {area === 'countries' &&
            countryFilter &&
            !data.countries.some((c) => countryResult(c) === countryFilter) && (
              <div className="ex-empty">
                <Globe2 size={26} />
                <h3>No hay países en este estado.</h3>
                <button className="ex-btn" onClick={() => setCountryFilter('')}>
                  Ver todos los países
                </button>
              </div>
            )}
          {area === 'content' && !entries.length && (
            <div className="ex-empty">
              <Search size={25} />
              <h3>No hay contenido con estos filtros.</h3>
              <button
                className="ex-btn"
                onClick={() => {
                  setQuery('');
                  setFilter('');
                  setContext({ ...context, region: '' });
                }}
              >
                Limpiar búsqueda y estado
              </button>
            </div>
          )}
          <footer className="ex-lab">
            <span>Laboratorio · Guardado local, sin API ni datos reales</span>
            <label>
              <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
              Simular error de guardado
            </label>
            <button className="ex-link" onClick={() => setModal({ kind: 'reset' })}>
              <RotateCcw size={14} />
              Restaurar ejemplo
            </button>
          </footer>
        </main>
      </div>
      {!modal && (
        <nav
          className="proto-picker"
          aria-label="Propuestas de administración"
          ref={picker}
          data-ready={pickerReady ? '' : undefined}
        >
          <span className="proto-picker-highlight" aria-hidden="true" />
          {variants.map((name, i) => (
            <button
              className="proto-picker-item"
              key={name}
              aria-current={v === i ? 'true' : undefined}
              data-active={v === i ? '' : undefined}
              onClick={() => setV(i)}
            >
              {name}
            </button>
          ))}
        </nav>
      )}
      {modal && (
        <Dialog
          title={
            modal.kind === 'tutorial'
              ? 'Preparar, terminar y publicar'
              : modal.kind === 'preview'
                ? 'Así lo vería un visitante'
                : modal.kind === 'reset'
                  ? '¿Restaurar los datos de ejemplo?'
                  : modal.kind === 'entry'
                    ? modal.draft.title || 'Nuevo contenido'
                    : `Publicación de ${modal.draft.name}`
          }
          onClose={close}
          busy={busy}
          initialFocusRef={modal.kind === 'entry' ? titleRef : undefined}
          className={`ex-dialog ${modal.kind === 'preview' ? 'ex-dialog--preview' : ''}`}
        >
          <div className="ex-dialog-body">
            {modal.kind === 'tutorial' ? (
              <Tutorial />
            ) : modal.kind === 'reset' ? (
              <>
                <p>
                  Se descartarán los cambios guardados de esta demostración. La administración real
                  no se modifica.
                </p>
                <div className="ex-dialog-actions">
                  <button className="ex-btn" onClick={close}>
                    Cancelar
                  </button>
                  <button
                    className="ex-btn ex-btn--primary"
                    onClick={() => {
                      try {
                        localStorage.setItem(key, JSON.stringify(initial));
                        setData(structuredClone(initial));
                        setNotice('Demostración restaurada.');
                        setModal(null);
                      } catch {
                        setError(
                          'No se ha podido restaurar. Comprueba el almacenamiento del navegador.',
                        );
                      }
                    }}
                  >
                    Restaurar demostración
                  </button>
                </div>
                {error && (
                  <p role="alert" className="ex-error">
                    {error}
                  </p>
                )}
              </>
            ) : modal.kind === 'preview' ? (
              <div className="ex-public-preview">
                <span className="ex-eyebrow">VISTA PÚBLICA SIMULADA · NO PUBLICA NADA</span>
                {previewCountry && countryResult(previewCountry) === 'public' ? (
                  <>
                    <h3>Descubre {previewCountry.name}</h3>
                    <p>
                      Solo aparecen fichas publicadas. Los borradores y el contenido listo pero
                      oculto se excluyen.
                    </p>
                    {data.entries
                      .filter(
                        (e) =>
                          e.country === previewCountry.id &&
                          ['public', 'upcoming'].includes(entryResult(e, data.countries)),
                      )
                      .map((e) => (
                        <article key={e.id}>
                          <Badge value={entryResult(e, data.countries)} />
                          <h4>{e.title}</h4>
                          <p>
                            {entryResult(e, data.countries) === 'upcoming'
                              ? 'Estamos preparando esta guía. La ficha todavía no está disponible.'
                              : e.description}
                          </p>
                        </article>
                      ))}
                    {!data.entries.some(
                      (e) =>
                        e.country === previewCountry.id &&
                        ['public', 'upcoming'].includes(entryResult(e, data.countries)),
                    ) && <p>Aún no hay fichas públicas en este país.</p>}
                  </>
                ) : previewCountry && countryResult(previewCountry) === 'upcoming' ? (
                  <>
                    <span className="ex-preview-globe">
                      <Globe2 size={45} />
                    </span>
                    <Badge value="upcoming" />
                    <h3>{previewCountry.name}, próximamente.</h3>
                    <p>
                      Solo este anuncio es visible. Las fichas del país no se muestran ni se abren.
                    </p>
                  </>
                ) : (
                  <>
                    <Eye size={36} />
                    <h3>Este país no aparece en la web.</h3>
                    <p>
                      No se muestra en el catálogo ni en búsquedas o mapas. Esta pantalla es una
                      simulación de la política propuesta.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="ex-editor-context">
                  <span>
                    {modal.kind === 'entry'
                      ? `${modal.draft.kind} · ${data.countries.find((c) => c.id === modal.draft.country)?.name}`
                      : 'Configuración del país'}
                  </span>
                  <Badge value={result!} />
                </div>
                {error && (
                  <p className="ex-error" role="alert">
                    {error}
                  </p>
                )}
                {modal.kind === 'entry' && (
                  <div className="ex-fields">
                    <label>
                      Nombre
                      <input
                        ref={titleRef}
                        maxLength={150}
                        value={modal.draft.title}
                        disabled={busy}
                        onChange={(e) => updateEntry({ title: e.target.value })}
                      />
                    </label>
                    <div>
                      <label>
                        País del contenido
                        <select
                          value={modal.draft.country}
                          disabled={busy}
                          onChange={(e) =>
                            updateEntry({
                              country: e.target.value,
                              region: regions[e.target.value][0],
                            })
                          }
                        >
                          {data.countries.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Región del contenido
                        <select
                          value={modal.draft.region}
                          disabled={busy}
                          onChange={(e) => updateEntry({ region: e.target.value })}
                        >
                          {regions[modal.draft.country].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Descripción
                      <textarea
                        aria-label="Descripción"
                        aria-describedby="expansion-description-help"
                        rows={3}
                        maxLength={1200}
                        value={modal.draft.description}
                        disabled={busy}
                        onChange={(e) => updateEntry({ description: e.target.value })}
                      />
                      <small id="expansion-description-help">
                        Para marcar Acabado: nombre, región y una descripción de al menos 20
                        caracteres en esta demostración.
                      </small>
                    </label>
                  </div>
                )}
                <fieldset disabled={busy} className="ex-control-fieldset">
                  <Publication
                    ready={modal.draft.ready}
                    show={modal.draft.show}
                    teaser={modal.kind === 'country' || teaser(modal.draft.kind)}
                    onReady={(ready) =>
                      modal.kind === 'country'
                        ? updateCountry({ ready })
                        : updateEntry({
                            ready,
                            ...(!ready && !teaser(modal.draft.kind) ? { show: false } : {}),
                          })
                    }
                    onShow={(show) =>
                      modal.kind === 'country' ? updateCountry({ show }) : updateEntry({ show })
                    }
                  />
                </fieldset>
                <div className="ex-result">
                  <span>Al guardar, el resultado será</span>
                  <Badge value={result!} />
                  <p>
                    {result === 'blocked'
                      ? 'El país aún no está publicado. Conservamos tu intención de mostrar la ficha, pero seguirá oculta.'
                      : result === 'ready'
                        ? 'Está acabado y preparado para publicar. Sigue oculto hasta que actives Mostrar.'
                        : result === 'upcoming'
                          ? 'Se verá un anuncio Próximamente. No se podrá abrir la ficha incompleta.'
                          : result === 'public'
                            ? 'La ficha completa será visible en la simulación pública.'
                            : 'El contenido solo estará disponible en administración.'}
                  </p>
                  {modal.kind === 'country' && (
                    <p>
                      Su cambio se aplicará también a la visibilidad efectiva de sus{' '}
                      {data.entries.filter((e) => e.country === modal.draft.id).length} contenidos.
                      No cambia sus interruptores individuales.
                    </p>
                  )}
                </div>
                {discard && (
                  <div className="ex-discard" role="alert">
                    <p>Tienes cambios sin guardar. ¿Quieres descartarlos?</p>
                    <button className="ex-btn" onClick={() => setDiscard(false)}>
                      Seguir editando
                    </button>
                    <button
                      className="ex-btn"
                      onClick={() => {
                        setModal(null);
                        setError('');
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
                    onClick={() => void save()}
                    aria-busy={busy}
                  >
                    {busy ? 'Guardando…' : error ? 'Reintentar guardado' : 'Guardar cambios'}
                    {!busy && <Check size={17} />}
                  </button>
                </div>
                <p className="ex-demo-help">
                  Prototipo: estos controles solo modifican la demostración local.
                </p>
              </>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
const root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<App />);
