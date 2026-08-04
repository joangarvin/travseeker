import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { EssentialGroup, EssentialItem } from '../../../types';
import { plain, safeHtml } from '../../../utils';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { essentialPresentation } from '../../essentials/essentialPresentation';
import { EssentialDetail } from './EssentialDetail';

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

function hasDetail(item: EssentialItem) {
  const presentation = essentialPresentation(item);
  return Boolean(
    presentation.description ||
      item.imageUrl ||
      item.duration ||
      item.bestTime ||
      item.reservationRequired != null ||
      item.officialUrl ||
      item.place,
  );
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
  const [activeMobileItemKey, setActiveMobileItemKey] = useState('');
  const [openMobileItemKeys, setOpenMobileItemKeys] = useState<Set<string>>(new Set());
  const [pinnedMobileItemKey, setPinnedMobileItemKey] = useState('');
  const itemNodes = useRef(new Map<string, HTMLLIElement>());
  const activeMobileItemRef = useRef('');
  const pinnedMobileItemRef = useRef('');
  const focusWithinRouteRef = useRef(false);
  const pendingGroupFocusRef = useRef(false);
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
  const resolvedMobileItemKey = activeGroup?.items.some(
    (item, index) => itemKey(item, index) === activeMobileItemKey,
  )
    ? activeMobileItemKey
    : initialItemKey;

  useEffect(() => {
    activeMobileItemRef.current = resolvedMobileItemKey;
  }, [resolvedMobileItemKey]);

  useEffect(() => {
    pinnedMobileItemRef.current = pinnedMobileItemKey;
  }, [pinnedMobileItemKey]);

  useEffect(() => {
    if (!activeGroup || !initialItemKey) return;

    setSelectedItemKey(initialItemKey);
    setActiveMobileItemKey(initialItemKey);
    setOpenMobileItemKeys(new Set([initialItemKey]));
    setPinnedMobileItemKey('');

    if (!pendingGroupFocusRef.current) return;
    pendingGroupFocusRef.current = false;
    window.requestAnimationFrame(() => {
      const firstStop = itemNodes.current.get(initialItemKey);
      const trigger = firstStop?.querySelector<HTMLElement>('[data-essential-trigger]');
      firstStop?.scrollIntoView({ block: 'start' });
      trigger?.focus({ preventScroll: true });
    });
  }, [activeGroup, initialItemKey, resolvedGroupKey]);

  useEffect(() => {
    if (!mobile || !activeGroup) return;

    const stops = activeGroup.items
      .map((item, index) => itemNodes.current.get(itemKey(item, index)))
      .filter(Boolean) as HTMLLIElement[];
    if (!stops.length) return;

    const root = document.documentElement;
    const body = document.body;
    const previousOverflowAnchor = root.style.overflowAnchor;
    const previousBodyOverflowAnchor = body.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    body.style.overflowAnchor = 'none';

    const pendingClosures = new Map<string, number>();
    const cancelClosure = (key: string) => {
      const timer = pendingClosures.get(key);
      if (timer) window.clearTimeout(timer);
      pendingClosures.delete(key);
    };
    const scheduleClosure = (key: string, departingStop: HTMLLIElement) => {
      cancelClosure(key);
      const timer = window.setTimeout(() => {
        pendingClosures.delete(key);
        if (key === activeMobileItemRef.current || departingStop.matches(':focus-within')) {
          return;
        }

        const bounds = departingStop.getBoundingClientRect();
        if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
          scheduleClosure(key, departingStop);
          return;
        }

        const leavingAbove = bounds.bottom <= 0;
        const readingAnchor = itemNodes.current.get(activeMobileItemRef.current);
        const anchorTopBefore = readingAnchor?.getBoundingClientRect().top;
        const previousScrollBehavior = root.style.getPropertyValue('scroll-behavior');
        const previousScrollBehaviorPriority = root.style.getPropertyPriority('scroll-behavior');
        const panel = departingStop.querySelector<HTMLElement>('.essential-guide__stop-panel');
        const previousPanelTransition = panel?.style.getPropertyValue('transition') || '';

        root.style.setProperty('scroll-behavior', 'auto', 'important');
        panel?.style.setProperty('transition', 'none', 'important');
        if (panel) void panel.offsetHeight;
        flushSync(() => {
          if (key === pinnedMobileItemRef.current) {
            pinnedMobileItemRef.current = '';
            setPinnedMobileItemKey('');
          }
          setOpenMobileItemKeys((current) => {
            if (!current.has(key)) return current;
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        });

        let stabilizationFrame = 0;
        const stabilizeReadingPosition = () => {
          if (leavingAbove && readingAnchor && anchorTopBefore != null) {
            const anchorTopAfter = readingAnchor.getBoundingClientRect().top;
            window.scrollBy({ top: anchorTopAfter - anchorTopBefore, behavior: 'auto' });
          }

          stabilizationFrame += 1;
          if (stabilizationFrame < 3) {
            window.requestAnimationFrame(stabilizeReadingPosition);
            return;
          }

          if (panel) {
            if (previousPanelTransition) {
              panel.style.setProperty('transition', previousPanelTransition);
            } else {
              panel.style.removeProperty('transition');
            }
          }
          if (previousScrollBehavior) {
            root.style.setProperty(
              'scroll-behavior',
              previousScrollBehavior,
              previousScrollBehaviorPriority,
            );
          } else {
            root.style.removeProperty('scroll-behavior');
          }
        };
        window.requestAnimationFrame(stabilizeReadingPosition);
      }, 650);
      pendingClosures.set(key, timer);
    };

    const activationObserver = new IntersectionObserver(
      (entries) => {
        if (focusWithinRouteRef.current || pinnedMobileItemRef.current) return;
        const entering = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              Math.abs(first.boundingClientRect.top - window.innerHeight * 0.42) -
              Math.abs(second.boundingClientRect.top - window.innerHeight * 0.42),
          )[0];
        if (!entering) return;

        const key =
          (entering.target as HTMLElement).closest<HTMLElement>('[data-essential-key]')?.dataset
            .essentialKey || '';
        if (!key) return;
        const previousKey = activeMobileItemRef.current;
        cancelClosure(key);
        activeMobileItemRef.current = key;
        setActiveMobileItemKey(key);

        if (previousKey && previousKey !== key) {
          const previousStop = itemNodes.current.get(previousKey);
          if (previousStop) scheduleClosure(previousKey, previousStop);
        }

        const item = activeGroup.items.find(
          (candidate, index) => itemKey(candidate, index) === key,
        );
        if (!item || !hasDetail(item)) return;
        setOpenMobileItemKeys((current) => new Set(current).add(key));
      },
      { rootMargin: '-30% 0px -48% 0px', threshold: 0 },
    );

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = (entry.target as HTMLElement).dataset.essentialKey || '';
          if (entry.isIntersecting) {
            cancelClosure(key);
            return;
          }
          if (!key || key === activeMobileItemRef.current) return;
          scheduleClosure(key, entry.target as HTMLLIElement);
        });
      },
      { threshold: 0 },
    );

    stops.forEach((stop) => {
      const trigger = stop.querySelector('[data-essential-trigger]');
      if (trigger) activationObserver.observe(trigger);
      visibilityObserver.observe(stop);
    });

    return () => {
      activationObserver.disconnect();
      visibilityObserver.disconnect();
      pendingClosures.forEach((timer) => window.clearTimeout(timer));
      root.style.overflowAnchor = previousOverflowAnchor;
      body.style.overflowAnchor = previousBodyOverflowAnchor;
    };
  }, [activeGroup, mobile, resolvedGroupKey]);

  if (!populatedGroups.length && !plain(legacyHtml)) return null;

  const selectGroup = (key: string) => {
    if (key === resolvedGroupKey) return;
    pendingGroupFocusRef.current = true;
    itemNodes.current.clear();
    setActiveGroupKey(key);
  };

  const toggleMobileItem = (key: string, open: boolean) => {
    activeMobileItemRef.current = key;
    setActiveMobileItemKey(key);
    if (open) {
      pinnedMobileItemRef.current = '';
      setPinnedMobileItemKey('');
      setOpenMobileItemKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      return;
    }

    pinnedMobileItemRef.current = key;
    setPinnedMobileItemKey(key);
    setOpenMobileItemKeys((current) => new Set(current).add(key));
  };

  return (
    <section className="essential-guide" aria-labelledby="essential-guide-title">
      <header className="essential-guide__intro">
        <div>
          <p className="kicker">Guía de campo</p>
          <h2 id="essential-guide-title">Lo imprescindible</h2>
        </div>
        <p>
          Lugares y experiencias que ayudan a entender el destino, con la información práctica
          necesaria para decidir cómo encajarlos en el viaje.
        </p>
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

          {activeGroup && (
            <section className="essential-guide__route" aria-labelledby="essential-active-theme">
              <header className="essential-guide__route-heading">
                <span className="essential-guide__theme-symbol" aria-hidden>
                  <EssentialIconGlyph name={activeGroup.icon} />
                </span>
                <div>
                  <p>Tema seleccionado</p>
                  <h3 id="essential-active-theme">{activeGroup.title}</h3>
                  <span>{activeGroup.items.length} lugares y experiencias</span>
                </div>
              </header>

              <ul className="essential-guide__route-list">
                {activeGroup.items.map((item, index) => {
                  const key = itemKey(item, index);
                  const presentation = essentialPresentation(item);
                  const detailed = hasDetail(item);
                  const open = mobile
                    ? openMobileItemKeys.has(key) ||
                      (!openMobileItemKeys.size && key === initialItemKey)
                    : key === resolvedItemKey;
                  const active = mobile ? key === resolvedMobileItemKey : open;
                  const panelId = `essential-panel-${key}`;
                  const headingId = `essential-title-${key}`;

                  return (
                    <li
                      className={`${active ? 'is-active' : ''} ${open ? 'is-open' : ''}`}
                      data-essential-key={key}
                      key={key}
                      ref={(node) => {
                        if (node) itemNodes.current.set(key, node);
                        else itemNodes.current.delete(key);
                      }}
                      onFocusCapture={() => {
                        focusWithinRouteRef.current = true;
                      }}
                      onBlurCapture={(event) => {
                        const stop = event.currentTarget;
                        window.requestAnimationFrame(() => {
                          focusWithinRouteRef.current = stop.contains(document.activeElement);
                        });
                      }}
                    >
                      <span className="essential-guide__route-marker" aria-hidden>
                        <EssentialIconGlyph name={item.icon || activeGroup.icon} />
                      </span>

                      <article className="essential-guide__stop">
                        {detailed ? (
                          <h4 id={headingId}>
                            <button
                              type="button"
                              data-essential-trigger
                              aria-expanded={open}
                              aria-controls={panelId}
                              onClick={() => {
                                if (mobile) toggleMobileItem(key, open);
                                else setSelectedItemKey(key);
                              }}
                            >
                              <span>{presentation.title}</span>
                              <ChevronDown aria-hidden />
                            </button>
                          </h4>
                        ) : (
                          <h4 id={headingId} className="essential-guide__stop-title">
                            {presentation.title}
                          </h4>
                        )}

                        {detailed && (
                          <div
                            className="essential-guide__stop-panel"
                            id={panelId}
                            aria-hidden={!open}
                            inert={!open}
                          >
                            <div className="essential-guide__stop-panel-inner">
                              <EssentialDetail
                                item={item}
                                groupIcon={activeGroup.icon}
                                headingId={headingId}
                                showHeading={false}
                                expanded={open}
                              />
                            </div>
                          </div>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
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
