import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bookmark, Check, ChevronDown, ChevronRight, Route } from 'lucide-react';
import type { EssentialGroup, EssentialItem } from '../../../types';
import { imageUrl, plain, safeHtml } from '../../../utils';
import { MediaImage } from '../../../components/ui';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { essentialPresentation } from '../../essentials/essentialPresentation';
import { EssentialDetail } from './EssentialDetail';

type EssentialRouteProps = {
  groups?: EssentialGroup[];
  legacyHtml?: string;
  authenticated?: boolean;
  onAddToTrip?: (item: EssentialItem) => void;
};

const SAVED_STORAGE_KEY = 'travseeker:saved-essentials';

function groupKey(group: EssentialGroup, index: number) {
  return group.id || `essential-group-${index}`;
}

function itemKey(item: EssentialItem, index: number) {
  return item.id || `essential-item-${index}`;
}

function priorityLabel(index: number, total: number) {
  if (index === 0) return 'Primera elección';
  if (index < Math.min(3, total)) return 'Recomendada';
  return 'Alternativa';
}

function useStoredKeys(storageKey: string) {
  const [keys, setKeys] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      return new Set(
        Array.isArray(stored) ? stored.filter((value) => typeof value === 'string') : [],
      );
    } catch {
      return new Set();
    }
  });

  const toggle = (key: string) => {
    setKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  return { keys, toggle };
}

function useMobileGuide() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const onChange = (event: MediaQueryListEvent) => setMobile(event.matches);
    setMobile(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return mobile;
}

export function EssentialRoute({
  groups = [],
  legacyHtml = '',
  authenticated = false,
  onAddToTrip,
}: EssentialRouteProps) {
  const populatedGroups = groups.filter((group) => group.items?.length);
  const initialGroupKey = populatedGroups[0] ? groupKey(populatedGroups[0], 0) : '';
  const [activeGroupKey, setActiveGroupKey] = useState(initialGroupKey);
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [expandedMobileKey, setExpandedMobileKey] = useState('');
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const saved = useStoredKeys(SAVED_STORAGE_KEY);
  const mobile = useMobileGuide();

  const resolvedGroupKey = populatedGroups.some(
    (group, index) => groupKey(group, index) === activeGroupKey,
  )
    ? activeGroupKey
    : initialGroupKey;
  const activeGroupIndex = Math.max(
    0,
    populatedGroups.findIndex((group, index) => groupKey(group, index) === resolvedGroupKey),
  );
  const activeGroup = populatedGroups[activeGroupIndex];
  const initialItemKey = activeGroup?.items[0] ? itemKey(activeGroup.items[0], 0) : '';
  const resolvedItemKey = activeGroup?.items.some(
    (item, index) => itemKey(item, index) === selectedItemKey,
  )
    ? selectedItemKey
    : initialItemKey;
  const selectedItemIndex = Math.max(
    0,
    activeGroup?.items.findIndex((item, index) => itemKey(item, index) === resolvedItemKey) ?? 0,
  );
  const selectedItem = activeGroup?.items[selectedItemIndex];
  const visibleItems = itemsExpanded ? activeGroup?.items : activeGroup?.items.slice(0, 5);

  useEffect(() => {
    setSelectedItemKey(initialItemKey);
    setExpandedMobileKey('');
    setItemsExpanded(false);
  }, [initialItemKey, resolvedGroupKey]);

  if (!populatedGroups.length && !plain(legacyHtml)) return null;

  const selectGroup = (key: string) => {
    setActiveGroupKey(key);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = populatedGroups.length - 1;
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;
    else return;

    event.preventDefault();
    const nextKey = groupKey(populatedGroups[nextIndex], nextIndex);
    selectGroup(nextKey);
    tabRefs.current.get(nextKey)?.focus();
  };

  const selectItem = (key: string) => {
    setSelectedItemKey(key);
    if (mobile) setExpandedMobileKey((current) => (current === key ? '' : key));
  };

  const closeMobileDetail = (key: string) => {
    setExpandedMobileKey('');
    window.requestAnimationFrame(() => itemRefs.current.get(key)?.focus());
  };

  const toggleSaved = (key: string, title: string) => {
    const willSave = !saved.keys.has(key);
    saved.toggle(key);
    setAnnouncement(
      willSave ? `${title} se ha guardado en esta guía.` : `${title} ya no está guardada.`,
    );
  };

  const toggleRoute = (key: string, title: string) => {
    const item = activeGroup?.items.find((candidate, index) => itemKey(candidate, index) === key);
    if (authenticated && item && onAddToTrip) {
      onAddToTrip(item);
      return;
    }
    setAnnouncement(`${title} solo puede añadirse a un viaje después de iniciar sesión.`);
  };

  return (
    <section className="essential-discovery" aria-labelledby="essential-discovery-title">
      <header className="essential-discovery__intro">
        <div>
          <p className="kicker">Selección sobre el terreno</p>
          <h2 id="essential-discovery-title">Lo imprescindible</h2>
          <p className="essential-discovery__lede">
            Una selección editorial para entender qué merece tu tiempo y encajarlo en el viaje sin
            perder el contexto.
          </p>
        </div>
        <div className="essential-discovery__summary" aria-label="Resumen de tu selección local">
          <span>
            <Bookmark aria-hidden /> {saved.keys.size} guardadas
          </span>
          {authenticated && (
            <span>
              <Route aria-hidden /> Itinerario conectado
            </span>
          )}
        </div>
      </header>

      {populatedGroups.length ? (
        <div className="essential-discovery__workspace">
          <label className="essential-discovery__mobile-select">
            <span>Tipo de experiencia</span>
            <select value={resolvedGroupKey} onChange={(event) => selectGroup(event.target.value)}>
              {populatedGroups.map((group, index) => (
                <option key={groupKey(group, index)} value={groupKey(group, index)}>
                  {group.title} · {group.items.length}
                </option>
              ))}
            </select>
          </label>

          <div
            className="essential-discovery__tabs"
            role="tablist"
            aria-label="Tipos de experiencia imprescindible"
          >
            {populatedGroups.map((group, index) => {
              const key = groupKey(group, index);
              const active = key === resolvedGroupKey;
              return (
                <button
                  type="button"
                  role="tab"
                  id={`essential-tab-${key}`}
                  aria-selected={active}
                  aria-controls={`essential-tabpanel-${key}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectGroup(key)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  ref={(node) => {
                    if (node) tabRefs.current.set(key, node);
                    else tabRefs.current.delete(key);
                  }}
                  key={key}
                >
                  <span aria-hidden>
                    <EssentialIconGlyph name={group.icon} />
                  </span>
                  <strong>{group.title}</strong>
                  <small>{group.items.length}</small>
                </button>
              );
            })}
          </div>

          {activeGroup && (
            <section
              className="essential-discovery__panel"
              role="tabpanel"
              id={`essential-tabpanel-${resolvedGroupKey}`}
              aria-labelledby={`essential-tab-${resolvedGroupKey}`}
              tabIndex={0}
            >
              <div className="essential-discovery__catalogue">
                <header>
                  <div>
                    <p className="kicker">Orden editorial</p>
                    <h3>{activeGroup.title}</h3>
                  </div>
                  <span>{activeGroup.items.length} opciones</span>
                </header>

                <ol className="essential-discovery__list">
                  {visibleItems?.map((item, index) => {
                    const key = itemKey(item, index);
                    const presentation = essentialPresentation(item);
                    const active = key === resolvedItemKey;
                    const expanded = key === expandedMobileKey;
                    const priority = priorityLabel(index, activeGroup.items.length);
                    return (
                      <li className={active ? 'is-selected' : ''} key={key}>
                        <button
                          type="button"
                          className="essential-discovery__choice"
                          aria-pressed={active}
                          aria-expanded={mobile ? expanded : undefined}
                          aria-controls={mobile ? `essential-mobile-detail-${key}` : undefined}
                          onClick={() => selectItem(key)}
                          ref={(node) => {
                            if (node) itemRefs.current.set(key, node);
                            else itemRefs.current.delete(key);
                          }}
                        >
                          <span className="essential-discovery__thumb" aria-hidden>
                            {item.imageUrl ? (
                              <MediaImage src={imageUrl(item.imageUrl)} alt="" loading="lazy" />
                            ) : (
                              <EssentialIconGlyph name={item.icon || activeGroup.icon} />
                            )}
                          </span>
                          <span className="essential-discovery__choice-copy">
                            <small>{priority}</small>
                            <strong>{presentation.title}</strong>
                            <span>
                              {[item.duration, item.place?.nombre].filter(Boolean).join(' · ') ||
                                'Ver criterio editorial'}
                            </span>
                          </span>
                          <span className="essential-discovery__choice-state" aria-hidden>
                            {active ? <Check /> : mobile ? <ChevronDown /> : <ChevronRight />}
                          </span>
                        </button>

                        {mobile && expanded && (
                          <div
                            className="essential-discovery__mobile-detail"
                            id={`essential-mobile-detail-${key}`}
                          >
                            <EssentialDetail
                              item={item}
                              groupIcon={activeGroup.icon}
                              headingId={`essential-mobile-title-${key}`}
                              priority={priority}
                              saved={saved.keys.has(key)}
                              inRoute={false}
                              onToggleSaved={() => toggleSaved(key, presentation.title)}
                              onToggleRoute={() => toggleRoute(key, presentation.title)}
                              authenticated={authenticated}
                              onClose={() => closeMobileDetail(key)}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {activeGroup.items.length > 5 && (
                  <button
                    type="button"
                    className="essential-discovery__more"
                    aria-expanded={itemsExpanded}
                    onClick={() => setItemsExpanded((value) => !value)}
                  >
                    {itemsExpanded
                      ? 'Ver selección breve'
                      : `Ver las ${activeGroup.items.length} experiencias`}
                  </button>
                )}
              </div>

              {!mobile && selectedItem && (
                <aside
                  className="essential-discovery__detail"
                  aria-label="Experiencia seleccionada"
                >
                  <EssentialDetail
                    item={selectedItem}
                    groupIcon={activeGroup.icon}
                    headingId={`essential-detail-title-${resolvedItemKey}`}
                    priority={priorityLabel(selectedItemIndex, activeGroup.items.length)}
                    saved={saved.keys.has(resolvedItemKey)}
                    inRoute={false}
                    onToggleSaved={() =>
                      toggleSaved(resolvedItemKey, essentialPresentation(selectedItem).title)
                    }
                    onToggleRoute={() =>
                      toggleRoute(resolvedItemKey, essentialPresentation(selectedItem).title)
                    }
                    authenticated={authenticated}
                  />
                </aside>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="essential-discovery__legacy">
          <p className="essential-discovery__legacy-note">
            Esta guía conserva el contenido editorial original; todavía no dispone de imágenes ni
            datos prácticos estructurados.
          </p>
          <div className="prose" dangerouslySetInnerHTML={{ __html: safeHtml(legacyHtml) }} />
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <p className="essential-discovery__storage-note">
        {authenticated
          ? 'Los guardados de la guía permanecen en este dispositivo; “Añadir a un viaje” actualiza tu itinerario real.'
          : 'Estas selecciones se guardan únicamente en este dispositivo. Entra para añadirlas a un viaje real.'}
      </p>
    </section>
  );
}
