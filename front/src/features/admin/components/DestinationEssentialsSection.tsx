import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Link2, ListPlus, MapPin, Plus, Trash2 } from 'lucide-react';
import { Button, Empty, Field, Notice } from '../../../components/ui';
import type { EssentialGroup, EssentialItem, Place } from '../../../types';
import type { DestinationUpdater } from './DestinationEditorSections';
import { SectionHeading } from './DestinationEditorSections';

type DestinationEssentialsSectionProps = {
  groups: EssentialGroup[];
  places: Place[];
  update: DestinationUpdater;
};

function draftId() {
  return globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random()}`;
}

function newItem(title = ''): EssentialItem {
  return {
    id: draftId(),
    title,
    description: '',
    placeId: null,
    place: null,
    sortOrder: 0,
  };
}

function newGroup(title = ''): EssentialGroup {
  return { id: draftId(), title, sortOrder: 0, items: [newItem()] };
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
      current = { ...newGroup('Selección esencial'), items: [] };
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
  update,
}: DestinationEssentialsSectionProps) {
  const [showImporter, setShowImporter] = useState(false);
  const [pastedList, setPastedList] = useState('');
  const parsedGroups = useMemo(() => parsePastedList(pastedList), [pastedList]);
  const parsedItems = parsedGroups.reduce((total, group) => total + group.items.length, 0);
  const setGroups = (nextGroups: EssentialGroup[]) =>
    update('essentialGroups', reorderGroups(nextGroups));

  const updateGroup = (groupIndex: number, patch: Partial<EssentialGroup>) => {
    setGroups(
      groups.map((group, index) => (index === groupIndex ? { ...group, ...patch } : group)),
    );
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<EssentialItem>) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item)),
    });
  };

  return (
    <section className="editor-section" aria-labelledby="editor-essentials">
      <SectionHeading
        number="03"
        id="editor-essentials"
        title="Lo imprescindible"
        description="Organiza lugares y planes por recorridos claros. El orden será el mismo en la ficha pública."
      />

      <div className="essential-editor__toolbar">
        <div>
          <strong>{groups.length} recorridos</strong>
          <span>
            {groups.reduce((total, group) => total + group.items.length, 0)} elementos en total
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowImporter((value) => !value)}
        >
          <ListPlus /> Pegar una lista
        </Button>
        <Button type="button" onClick={() => setGroups([...groups, newGroup()])}>
          <Plus /> Añadir recorrido
        </Button>
      </div>

      {!places.length && (
        <Notice>
          <MapPin /> Este destino aún no tiene puntos en «Lugares». Puedes organizar los
          imprescindibles ahora y vincularlos cuando crees el mapa.
        </Notice>
      )}

      {showImporter && (
        <div className="essential-importer">
          <header>
            <div>
              <h4>Convertir una lista</h4>
              <p>
                Usa títulos terminados en dos puntos y un plan por línea. No sustituirá lo
                existente.
              </p>
            </div>
            <span aria-live="polite">
              {parsedGroups.length} bloques · {parsedItems} elementos
            </span>
          </header>
          <Field label="Lista para importar" htmlFor="essential-import-list">
            <textarea
              id="essential-import-list"
              value={pastedList}
              placeholder={
                'Costa:\n- Recorrer el paseo marítimo\n- Visitar el faro\n\nInterior:\n- Subir al castillo'
              }
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
            Añadir lista al destino
          </Button>
        </div>
      )}

      {!groups.length ? (
        <Empty
          title="Aún no hay imprescindibles"
          action={
            <Button type="button" onClick={() => setGroups([newGroup()])}>
              <Plus /> Crear el primer recorrido
            </Button>
          }
        >
          Crea un recorrido y añade los lugares o experiencias que realmente ayudan a decidir el
          viaje.
        </Empty>
      ) : (
        <div className="essential-editor__groups">
          {groups.map((group, groupIndex) => (
            <details className="essential-editor__group" key={group.id}>
              <summary>
                <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                <strong>{group.title || 'Recorrido sin título'}</strong>
                <small>{group.items.length} elementos</small>
              </summary>
              <div className="essential-editor__group-body">
                <div className="essential-editor__group-heading">
                  <Field label="Nombre del recorrido" htmlFor={`essential-group-${group.id}`}>
                    <input
                      id={`essential-group-${group.id}`}
                      value={group.title}
                      placeholder="Ej. Arquitectura y patrimonio"
                      onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                    />
                  </Field>
                  <div
                    className="essential-editor__order"
                    aria-label={`Orden de ${group.title || 'recorrido'}`}
                  >
                    <button
                      type="button"
                      disabled={groupIndex === 0}
                      onClick={() => setGroups(move(groups, groupIndex, -1))}
                      aria-label="Mover recorrido hacia arriba"
                    >
                      <ArrowUp />
                    </button>
                    <button
                      type="button"
                      disabled={groupIndex === groups.length - 1}
                      onClick={() => setGroups(move(groups, groupIndex, 1))}
                      aria-label="Mover recorrido hacia abajo"
                    >
                      <ArrowDown />
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => setGroups(groups.filter((_, index) => index !== groupIndex))}
                      aria-label={`Eliminar ${group.title || 'recorrido'}`}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>

                <div className="essential-editor__items">
                  {group.items.map((item, itemIndex) => (
                    <article key={item.id}>
                      <div className="essential-editor__item-index">
                        <span>{String(itemIndex + 1).padStart(2, '0')}</span>
                        <div className="essential-editor__order">
                          <button
                            type="button"
                            disabled={itemIndex === 0}
                            onClick={() =>
                              updateGroup(groupIndex, {
                                items: move(group.items, itemIndex, -1),
                              })
                            }
                            aria-label="Mover elemento hacia arriba"
                          >
                            <ArrowUp />
                          </button>
                          <button
                            type="button"
                            disabled={itemIndex === group.items.length - 1}
                            onClick={() =>
                              updateGroup(groupIndex, {
                                items: move(group.items, itemIndex, 1),
                              })
                            }
                            aria-label="Mover elemento hacia abajo"
                          >
                            <ArrowDown />
                          </button>
                        </div>
                      </div>
                      <div className="essential-editor__item-fields">
                        <Field label="Lugar o experiencia" htmlFor={`essential-item-${item.id}`}>
                          <textarea
                            id={`essential-item-${item.id}`}
                            value={item.title}
                            placeholder="Ej. Visitar el conjunto histórico a primera hora"
                            onChange={(event) =>
                              updateItem(groupIndex, itemIndex, { title: event.target.value })
                            }
                          />
                        </Field>
                        <Field
                          label="Consejo práctico (opcional)"
                          htmlFor={`essential-description-${item.id}`}
                        >
                          <textarea
                            id={`essential-description-${item.id}`}
                            value={item.description || ''}
                            placeholder="Reserva, acceso, mejor momento o contexto útil."
                            onChange={(event) =>
                              updateItem(groupIndex, itemIndex, {
                                description: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field
                          label="Vincular con un punto del mapa (opcional)"
                          htmlFor={`essential-place-${item.id}`}
                        >
                          <select
                            id={`essential-place-${item.id}`}
                            value={item.placeId || ''}
                            disabled={!places.length}
                            onChange={(event) => {
                              const place = places.find(
                                (candidate) => candidate.id === event.target.value,
                              );
                              updateItem(groupIndex, itemIndex, {
                                placeId: place?.id || null,
                                place: place || null,
                              });
                            }}
                          >
                            <option value="">Sin punto asociado</option>
                            {places.map((place) => (
                              <option key={place.id} value={place.id}>
                                {place.nombre} · {place.categoria}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <button
                        type="button"
                        className="essential-editor__remove-item"
                        onClick={() =>
                          updateGroup(groupIndex, {
                            items: group.items.filter((_, index) => index !== itemIndex),
                          })
                        }
                        aria-label={`Eliminar elemento ${itemIndex + 1}`}
                      >
                        <Trash2 /> <span>Eliminar</span>
                      </button>
                    </article>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => updateGroup(groupIndex, { items: [...group.items, newItem()] })}
                >
                  <Plus /> Añadir elemento
                </Button>
              </div>
            </details>
          ))}
        </div>
      )}

      {!!groups.length && (
        <p className="essential-editor__map-note">
          <Link2 /> Si vinculas un elemento con un lugar, la ficha pública ofrecerá una acción real
          para abrir sus coordenadas.
        </p>
      )}
    </section>
  );
}
