import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2 } from 'lucide-react';
import { Button, Empty, Field } from '../../../components/ui';
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
  destinationId,
  token,
  update,
  onRequestPlace,
}: DestinationEssentialsSectionProps) {
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

  return (
    <section className="editor-section" aria-labelledby="editor-essentials">
      <SectionHeading
        number="03"
        id="editor-essentials"
        title="Lo imprescindible"
        description="Agrupa recomendaciones por temas y completa solo la información que ayude a preparar la visita."
      />

      <div className="essential-editor__toolbar">
        <div>
          <strong>{groups.length} temas</strong>
          <span>
            {groups.reduce((total, group) => total + group.items.length, 0)} imprescindibles
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
          <Plus /> Añadir tema
        </Button>
      </div>

      {showImporter && (
        <div className="essential-importer">
          <header>
            <div>
              <h4>Convertir una lista</h4>
              <p>Usa títulos terminados en dos puntos y una recomendación por línea.</p>
            </div>
            <span aria-live="polite">
              {parsedGroups.length} temas · {parsedItems} elementos
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
              <Plus /> Crear el primer tema
            </Button>
          }
        >
          Añade lugares y experiencias que de verdad ayuden a decidir y organizar el viaje.
        </Empty>
      ) : (
        <div className="essential-editor__groups">
          {groups.map((group, groupIndex) => {
            return (
              <details className="essential-editor__group" key={group.id}>
                <summary>
                  <span className="essential-editor__group-symbol" aria-hidden>
                    <EssentialIconGlyph name={group.icon} />
                  </span>
                  <span>
                    <strong>{group.title || 'Tema sin título'}</strong>
                    <small>{group.items.length} imprescindibles</small>
                  </span>
                </summary>
                <div className="essential-editor__group-body">
                  <div className="essential-editor__group-heading">
                    <Field label="Nombre del tema" htmlFor={`essential-group-${group.id}`}>
                      <input
                        id={`essential-group-${group.id}`}
                        value={group.title}
                        maxLength={140}
                        placeholder="Ej. Arquitectura y patrimonio"
                        onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                        onBlur={() => {
                          if (!group.icon || group.icon === 'Compass') {
                            updateGroup(groupIndex, { icon: inferEssentialIcon(group.title) });
                          }
                        }}
                      />
                    </Field>
                    <div
                      className="essential-editor__order"
                      aria-label={`Orden de ${group.title || 'tema'}`}
                    >
                      <button
                        type="button"
                        disabled={groupIndex === 0}
                        onClick={() => setGroups(move(groups, groupIndex, -1))}
                        aria-label="Mover tema hacia arriba"
                      >
                        <ArrowUp />
                      </button>
                      <button
                        type="button"
                        disabled={groupIndex === groups.length - 1}
                        onClick={() => setGroups(move(groups, groupIndex, 1))}
                        aria-label="Mover tema hacia abajo"
                      >
                        <ArrowDown />
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => setGroups(groups.filter((_, index) => index !== groupIndex))}
                        aria-label={`Eliminar ${group.title || 'tema'}`}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  <EssentialIconPicker
                    id={`essential-group-icon-${group.id}`}
                    label="Símbolo del tema"
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
                        onRemove={() =>
                          updateGroup(groupIndex, {
                            items: group.items.filter((_, index) => index !== itemIndex),
                          })
                        }
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
                    <Plus /> Añadir imprescindible
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
