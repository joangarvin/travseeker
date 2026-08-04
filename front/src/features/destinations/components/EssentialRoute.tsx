import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { EssentialGroup, EssentialItem } from '../../../types';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { plain, safeHtml } from '../../../utils';
import { EssentialDetail } from './EssentialDetail';
import { essentialPresentation } from '../../essentials/essentialPresentation';

type EssentialRouteProps = {
  groups?: EssentialGroup[];
  legacyHtml?: string;
};

function groupKey(group: EssentialGroup, index: number) {
  return group.id || `essential-group-${index}`;
}

function itemKey(item: EssentialItem, index: number) {
  return item.id || `essential-item-${index}`;
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

export function EssentialRoute({ groups = [], legacyHtml = '' }: EssentialRouteProps) {
  const populatedGroups = groups.filter((group) => group.items?.length);
  const initialGroupKey = populatedGroups[0] ? groupKey(populatedGroups[0], 0) : '';
  const [activeGroupKey, setActiveGroupKey] = useState(initialGroupKey);
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [openMobileItemKey, setOpenMobileItemKey] = useState('');
  const mobile = useMobileGuide();

  if (!populatedGroups.length && !plain(legacyHtml)) return null;

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
  const selectedItem = activeGroup?.items.find(
    (item, index) => itemKey(item, index) === resolvedItemKey,
  );
  const totalItems = populatedGroups.reduce((total, group) => total + group.items.length, 0);

  const selectGroup = (key: string) => {
    const nextGroup = populatedGroups.find((group, index) => groupKey(group, index) === key);
    setActiveGroupKey(key);
    setSelectedItemKey(nextGroup?.items[0] ? itemKey(nextGroup.items[0], 0) : '');
    setOpenMobileItemKey('');
  };

  return (
    <section className="essential-guide" aria-labelledby="essential-guide-title">
      <header className="essential-guide__intro">
        <div>
          <p className="kicker">Guía de campo</p>
          <h2 id="essential-guide-title">Lo que merece un lugar en tu viaje</h2>
        </div>
        <p>
          Una selección concreta para entender qué ver, cuánto tiempo reservar y cómo llegar sin
          convertir la visita en una lista de tareas.
        </p>
        <dl className="essential-guide__stats" aria-label="Resumen de la guía">
          <div>
            <dt>Temas</dt>
            <dd>{populatedGroups.length}</dd>
          </div>
          <div>
            <dt>Selecciones</dt>
            <dd>{totalItems}</dd>
          </div>
        </dl>
      </header>

      {populatedGroups.length ? (
        <div className="essential-guide__workspace">
          <label className="essential-guide__mobile-select">
            <span>Explorar por tema</span>
            <select value={resolvedGroupKey} onChange={(event) => selectGroup(event.target.value)}>
              {populatedGroups.map((group, index) => (
                <option key={groupKey(group, index)} value={groupKey(group, index)}>
                  {group.title} · {group.items.length}
                </option>
              ))}
            </select>
          </label>

          <nav className="essential-guide__themes" aria-label="Temas imprescindibles">
            {populatedGroups.map((group, index) => {
              const key = groupKey(group, index);
              const active = key === resolvedGroupKey;
              return (
                <button
                  type="button"
                  className={active ? 'is-active' : ''}
                  aria-pressed={active}
                  onClick={() => selectGroup(key)}
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
          </nav>

          {activeGroup && !mobile && selectedItem && (
            <div className="essential-guide__master-detail">
              <section className="essential-guide__list" aria-labelledby="essential-active-theme">
                <header>
                  <p>Tema seleccionado</p>
                  <h3 id="essential-active-theme">{activeGroup.title}</h3>
                  <span>{activeGroup.items.length} lugares y experiencias</span>
                </header>
                <ul>
                  {activeGroup.items.map((item, index) => {
                    const key = itemKey(item, index);
                    const presentation = essentialPresentation(item);
                    const selected = key === resolvedItemKey;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          className={selected ? 'is-active' : ''}
                          aria-current={selected ? 'true' : undefined}
                          aria-controls="essential-selected-detail"
                          onClick={() => setSelectedItemKey(key)}
                        >
                          <span className="essential-guide__item-symbol" aria-hidden>
                            <EssentialIconGlyph name={item.icon || activeGroup.icon} />
                          </span>
                          <span>{presentation.title}</span>
                          <ChevronRight aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <article
                className="essential-guide__selected-detail"
                id="essential-selected-detail"
                aria-labelledby={`essential-detail-${selectedItem.id}`}
                aria-live="polite"
              >
                <EssentialDetail
                  item={selectedItem}
                  groupIcon={activeGroup.icon}
                  headingId={`essential-detail-${selectedItem.id}`}
                />
              </article>
            </div>
          )}

          {activeGroup && mobile && (
            <section
              className="essential-guide__mobile-list"
              aria-labelledby="essential-mobile-theme"
            >
              <header>
                <p>Tema seleccionado</p>
                <h3 id="essential-mobile-theme">{activeGroup.title}</h3>
              </header>
              <div>
                {activeGroup.items.map((item, index) => {
                  const key = itemKey(item, index);
                  const presentation = essentialPresentation(item);
                  const open = openMobileItemKey === key;
                  const panelId = `essential-mobile-panel-${key}`;
                  return (
                    <article className={open ? 'is-open' : ''} key={key}>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenMobileItemKey(open ? '' : key)}
                      >
                        <span className="essential-guide__item-symbol" aria-hidden>
                          <EssentialIconGlyph name={item.icon || activeGroup.icon} />
                        </span>
                        <span>{presentation.title}</span>
                        <ChevronDown aria-hidden />
                      </button>
                      {open && (
                        <div id={panelId}>
                          <EssentialDetail
                            item={item}
                            groupIcon={activeGroup.icon}
                            headingId={`${panelId}-title`}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div
          className="essential-guide__legacy prose"
          dangerouslySetInnerHTML={{ __html: safeHtml(legacyHtml) }}
        />
      )}
    </section>
  );
}
