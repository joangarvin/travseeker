import { LocalizedField } from './LocalizedField';
import { t, locale } from '../../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ListPlus, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import type { MunicipalityRecord } from '../../../types';
import { Button, Empty, Field, Notice } from '../../../components/ui';
import { EssentialIconGlyph, inferEssentialIcon } from '../../essentials/essentialIcons';
import type { EssentialGroup, EssentialItem, Place } from '../../../types';
import type { DestinationUpdater } from './DestinationEditorSections';
import { SectionHeading } from './DestinationEditorSections';
import { EssentialIconPicker } from './essentials/EssentialIconPicker';
import { EssentialItemEditor } from './essentials/EssentialItemEditor';

type DestinationEssentialsSectionProps = {
  groups: EssentialGroup[];
  places: Place[];
  destinationId?: string;
  token: string;
  update: DestinationUpdater;
  onRequestPlace: (target: { groupId: string; itemId: string; place?: Place }) => void;
};

function draftId() {
  return globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random()}`;
}

function newItem(title = ''): EssentialItem {
  return {
    id: draftId(),
    title,
    description: '',
    icon: null,
    imageUrl: null,
    imageAlt: null,
    duration: null,
    bestTime: null,
    reservationRequired: null,
    officialUrl: null,
    placeId: null,
    place: null,
    sortOrder: 0,
  };
}

function newGroup(title = ''): EssentialGroup {
  return {
    id: draftId(),
    title,
    icon: inferEssentialIcon(title),
    sortOrder: 0,
    items: [newItem()],
  };
}

function reorderGroups(groups: EssentialGroup[]) {
  return groups.map((group, sortOrder) => ({
    ...group,
    sortOrder,
    items: group.items.map((item, itemOrder) => ({ ...item, sortOrder: itemOrder })),
  }));
}

function parsePastedList(value: string) {
  const groups: EssentialGroup[] = [];
  let current: EssentialGroup | null = null;
  const ensureGroup = () => {
    if (!current) {
      current = { ...newGroup(t('Selección esencial')), items: [] };
      groups.push(current);
    }
    return current;
  };

  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const isItem = /^(?:[-*•·]|\d+[.)])\s+/.test(line);
      const isHeading = /^#{1,3}\s+/.test(line) || (!isItem && line.endsWith(':'));
      if (isHeading) {
        const title = line
          .replace(/^#{1,3}\s+/, '')
          .replace(/:$/, '')
          .trim();
        current = { ...newGroup(title), items: [] };
        groups.push(current);
        return;
      }
      const title = line.replace(/^(?:[-*•·]|\d+[.)])\s+/, '').trim();
      if (title) ensureGroup().items.push(newItem(title));
    });

  return reorderGroups(groups.filter((group) => group.title && group.items.length));
}

function move<Value>(values: Value[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= values.length) return values;
  const copy = [...values];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy;
}

export function DestinationEssentialsSection({
  groups,
  places,
  destinationId,
  token,
  update,
  onRequestPlace,
}: DestinationEssentialsSectionProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalog, setCatalog] = useState<MunicipalityRecord[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogId, setCatalogId] = useState('');
  const [catalogGroup, setCatalogGroup] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [catalogBusy, setCatalogBusy] = useState(false);
  useEffect(() => {
    if (!catalogOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api<MunicipalityRecord[]>(
        `/admin/fichas/actividades?unified=1&q=${encodeURIComponent(catalogQuery)}`,
        { signal: controller.signal },
        token,
      )
        .then(setCatalog)
        .catch((cause) => {
          if (!controller.signal.aborted) setCatalogError(cause.message);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [catalogOpen, catalogQuery, token]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<{
    restore: (current: EssentialGroup[]) => EssentialGroup[];
  } | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [pastedList, setPastedList] = useState('');
  const parsedGroups = useMemo(() => parsePastedList(pastedList), [pastedList]);
  const parsedItems = parsedGroups.reduce((total, group) => total + group.items.length, 0);
  const setGroups = (nextGroups: EssentialGroup[]) =>
    update('essentialGroups', reorderGroups(nextGroups));
  const updateGroup = (groupIndex: number, patch: Partial<EssentialGroup>) =>
    setGroups(
      groups.map((group, index) => (index === groupIndex ? { ...group, ...patch } : group)),
    );
  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<EssentialItem>) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item)),
    });
  };

  const addGroup = () => {
    const group = newGroup();
    setGroups([...groups, group]);
    setOpenGroups((current) => new Set(current).add(group.id));
  };

  const addCatalogActivity = async () => {
    const selected = catalog.find((row) => row.id === catalogId);
    if (!selected) return;
    setCatalogBusy(true);
    setCatalogError('');
    try {
      const record = selected.id.startsWith('source_')
        ? await api<MunicipalityRecord>(
            '/admin/fichas/actividades',
            { method: 'POST', body: JSON.stringify({ essentialItemId: selected.essentialItemId }) },
            token,
          )
        : selected;
      if (
        groups.some((group) =>
          group.items.some(
            (item) => item.catalogActivityId === record.id || item.id === record.essentialItemId,
          ),
        )
      )
        throw new Error('Esta actividad ya es un imprescindible del destino.');
      const item: EssentialItem = {
        ...newItem(record.nombre),
        catalogActivityId: record.id,
        description: record.descripcion || '',
        imageUrl: record.imagen || null,
        imageAlt: record.imagenAlt || record.nombre,
        duration: record.duration || null,
        bestTime: record.bestTime || null,
        officialUrl: record.website || null,
      };
      const target = groups.find((group) => group.id === catalogGroup);
      const nextGroup = target || { ...newGroup('Actividades imprescindibles'), items: [] };
      setGroups(
        target
          ? groups.map((group) =>
              group.id === target.id ? { ...group, items: [...group.items, item] } : group,
            )
          : [...groups, { ...nextGroup, items: [item] }],
      );
      setOpenGroups((current) => new Set(current).add(nextGroup.id));
      setCatalogId('');
    } catch (cause) {
      setCatalogError(cause instanceof Error ? cause.message : 'No se pudo añadir la actividad');
    } finally {
      setCatalogBusy(false);
    }
  };
  return (
    <section className="editor-section" aria-labelledby="editor-essentials">
      <SectionHeading
        number="03"
        id="editor-essentials"
        title={t('Lo imprescindible')}
        description={t(
          'Agrupa recomendaciones por temas y completa solo la información que ayude a preparar la visita.',
        )}
      />

      <div className="essential-editor__toolbar">
        <div className="essential-editor__counts">
          <strong>{t(groups.length === 1 ? '{0} tema' : '{0} temas', { 0: groups.length })}</strong>
          <span>
            {groups.reduce((total, group) => total + group.items.length, 0)} {t('imprescindibles')}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowImporter((value) => !value)}
        >
          <ListPlus /> {t('Pegar una lista')}
        </Button>
        <Button type="button" onClick={addGroup}>
          <Plus /> {t('Añadir tema')}
        </Button>
      </div>

      <Button type="button" variant="secondary" onClick={() => setCatalogOpen((value) => !value)}>
        Elegir del catálogo de actividades
      </Button>
      {catalogOpen && (
        <div className="municipality-source-picker">
          <p>
            Destaca una actividad existente sin duplicar su ficha. Guarda el destino para confirmar
            la selección.
          </p>
          {catalogError && <Notice tone="error">{catalogError}</Notice>}
          <label>
            Buscar actividad
            <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} />
          </label>
          <label>
            Actividad
            <select value={catalogId} onChange={(event) => setCatalogId(event.target.value)}>
              <option value="">Selecciona una actividad</option>
              {catalog.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.nombre}
                  {row.isPublished ? '' : ' · Borrador'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tema
            <select value={catalogGroup} onChange={(event) => setCatalogGroup(event.target.value)}>
              <option value="">Nuevo tema de actividades</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            loading={catalogBusy}
            disabled={!catalogId}
            onClick={() => void addCatalogActivity()}
          >
            Marcar como imprescindible
          </Button>
        </div>
      )}
      {removed && (
        <div className="essential-editor__undo" role="status">
          <span>{t('Elemento eliminado.')}</span>
          <button
            type="button"
            onClick={() => {
              setGroups(removed.restore(groups));
              setRemoved(null);
            }}
          >
            {t('Deshacer')}
          </button>
        </div>
      )}

      {showImporter && (
        <div className="essential-importer">
          <header>
            <div>
              <h4>{t('Convertir una lista')}</h4>
              <p>{t('Usa títulos terminados en dos puntos y una recomendación por línea.')}</p>
            </div>
            <span aria-live="polite">
              {parsedGroups.length} {t('temas ·')} {parsedItems} {t('elementos')}
            </span>
          </header>
          <Field label={t('Lista para importar')} htmlFor="essential-import-list">
            <textarea
              id="essential-import-list"
              value={pastedList}
              placeholder={t(
                'Costa:\n- Recorrer el paseo marítimo\n- Visitar el faro\n\nInterior:\n- Subir al castillo',
              )}
              onChange={(event) => setPastedList(event.target.value)}
            />
          </Field>
          <Button
            type="button"
            disabled={!parsedGroups.length}
            onClick={() => {
              setGroups([...groups, ...parsedGroups]);
              setPastedList('');
              setShowImporter(false);
            }}
          >
            {t('Añadir lista al destino')}
          </Button>
        </div>
      )}

      {!groups.length ? (
        <Empty
          title={t('Aún no hay imprescindibles')}
          action={
            <Button type="button" onClick={addGroup}>
              <Plus /> {t('Crear el primer tema')}
            </Button>
          }
        >
          {t('Añade lugares y experiencias que de verdad ayuden a decidir y organizar el viaje.')}
        </Empty>
      ) : (
        <div className="essential-editor__groups">
          {groups.map((group, groupIndex) => {
            return (
              <details
                className="essential-editor__group"
                key={group.id}
                open={openGroups.has(group.id)}
                onToggle={(event) => {
                  const open = event.currentTarget.open;
                  setOpenGroups((current) => {
                    if (current.has(group.id) === open) return current;
                    const next = new Set(current);
                    if (open) next.add(group.id);
                    else next.delete(group.id);
                    return next;
                  });
                }}
              >
                <summary>
                  <span className="essential-editor__group-symbol" aria-hidden>
                    <EssentialIconGlyph name={group.icon} />
                  </span>
                  <span>
                    <strong>
                      {group.translations?.[locale]?.title || group.title || t('Tema sin título')}
                    </strong>
                    <small>
                      {t(group.items.length === 1 ? '{0} imprescindible' : '{0} imprescindibles', {
                        0: group.items.length,
                      })}
                    </small>
                  </span>
                  <ChevronDown className="essential-editor__chevron" aria-hidden />
                </summary>
                <div className="essential-editor__group-body">
                  <div className="essential-editor__group-heading">
                    <LocalizedField
                      resource="essentialGroup"
                      field="title"
                      translations={group.translations}
                      onTranslationsChange={(translations) =>
                        updateGroup(groupIndex, { translations })
                      }
                      label={t('Nombre del tema')}
                      htmlFor={`essential-group-${group.id}`}
                    >
                      <input
                        id={`essential-group-${group.id}`}
                        value={group.title}
                        maxLength={140}
                        placeholder={t('Ej. Arquitectura y patrimonio')}
                        onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                        onBlur={() => {
                          if (!group.icon || group.icon === 'Compass') {
                            updateGroup(groupIndex, { icon: inferEssentialIcon(group.title) });
                          }
                        }}
                      />
                    </LocalizedField>
                    <div
                      className="essential-editor__order"
                      aria-label={t('Orden de {0}', { 0: group.title || 'tema' })}
                    >
                      <button
                        type="button"
                        disabled={groupIndex === 0}
                        onClick={() => setGroups(move(groups, groupIndex, -1))}
                        aria-label={t('Mover tema hacia arriba')}
                      >
                        <ArrowUp />
                      </button>
                      <button
                        type="button"
                        disabled={groupIndex === groups.length - 1}
                        onClick={() => setGroups(move(groups, groupIndex, 1))}
                        aria-label={t('Mover tema hacia abajo')}
                      >
                        <ArrowDown />
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => {
                          setRemoved({
                            restore: (current) => [
                              ...current.slice(0, groupIndex),
                              group,
                              ...current.slice(groupIndex),
                            ],
                          });
                          setGroups(groups.filter((_, index) => index !== groupIndex));
                        }}
                        aria-label={t('Eliminar {0}', { 0: group.title || 'tema' })}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  <EssentialIconPicker
                    id={`essential-group-icon-${group.id}`}
                    label={t('Símbolo del tema')}
                    value={group.icon}
                    onChange={(icon) => updateGroup(groupIndex, { icon: icon || 'Compass' })}
                  />

                  <div className="essential-editor__items">
                    {group.items.map((item, itemIndex) => (
                      <EssentialItemEditor
                        key={item.id}
                        item={item}
                        groupIcon={group.icon}
                        places={places}
                        destinationId={destinationId}
                        token={token}
                        canMoveUp={itemIndex > 0}
                        canMoveDown={itemIndex < group.items.length - 1}
                        onChange={(patch) => updateItem(groupIndex, itemIndex, patch)}
                        onMove={(direction) =>
                          updateGroup(groupIndex, {
                            items: move(group.items, itemIndex, direction),
                          })
                        }
                        onRemove={() => {
                          setRemoved({
                            restore: (current) =>
                              current.map((candidate) =>
                                candidate.id === group.id
                                  ? {
                                      ...candidate,
                                      items: [
                                        ...candidate.items.slice(0, itemIndex),
                                        item,
                                        ...candidate.items.slice(itemIndex),
                                      ],
                                    }
                                  : candidate,
                              ),
                          });
                          updateGroup(groupIndex, {
                            items: group.items.filter((_, index) => index !== itemIndex),
                          });
                        }}
                        onRequestPlace={(place) =>
                          onRequestPlace({ groupId: group.id, itemId: item.id, place })
                        }
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => updateGroup(groupIndex, { items: [...group.items, newItem()] })}
                  >
                    <Plus /> {t('Añadir imprescindible')}
                  </Button>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
