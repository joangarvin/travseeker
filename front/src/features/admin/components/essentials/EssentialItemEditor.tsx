import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Edit3,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Field, ImageUploader, Notice } from '../../../../components/ui';
import { EssentialIconGlyph } from '../../../essentials/essentialIcons';
import type { EssentialItem, Place } from '../../../../types';
import { EssentialIconPicker } from './EssentialIconPicker';

type EssentialItemEditorProps = {
  item: EssentialItem;
  groupIcon: string;
  places: Place[];
  destinationId?: string;
  token: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (patch: Partial<EssentialItem>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onRequestPlace: (place?: Place) => void;
};

export function EssentialItemEditor({
  item,
  groupIcon,
  places,
  destinationId,
  token,
  canMoveUp,
  canMoveDown,
  onChange,
  onMove,
  onRemove,
  onRequestPlace,
}: EssentialItemEditorProps) {
  const [placeQuery, setPlaceQuery] = useState('');
  const selectedPlace = item.place || places.find((place) => place.id === item.placeId);
  const filteredPlaces = useMemo(() => {
    const query = placeQuery.trim().toLocaleLowerCase('es');
    if (!query) return places;
    return places.filter(
      (place) =>
        place.id === item.placeId ||
        place.nombre.toLocaleLowerCase('es').includes(query) ||
        place.categoria.toLocaleLowerCase('es').includes(query),
    );
  }, [item.placeId, placeQuery, places]);
  const summary = [
    item.description && 'descripción',
    item.imageUrl && 'fotografía',
    (item.duration || item.bestTime || item.reservationRequired != null) && 'datos prácticos',
    item.placeId && 'ubicación',
  ].filter(Boolean);

  return (
    <details className="essential-item-editor" open={!item.title}>
      <summary>
        <span className="essential-item-editor__symbol" aria-hidden>
          <EssentialIconGlyph name={item.icon || groupIcon} />
        </span>
        <span>
          <strong>{item.title || 'Nuevo imprescindible'}</strong>
          <small>{summary.length ? summary.join(' · ') : 'Solo título'}</small>
        </span>
        <ChevronDown aria-hidden />
      </summary>

      <div className="essential-item-editor__body">
        <section aria-labelledby={`essential-content-${item.id}`}>
          <header>
            <h5 id={`essential-content-${item.id}`}>Contenido</h5>
            <p>Cuenta qué merece la pena y aporta contexto útil para decidir la visita.</p>
          </header>
          <Field label="Lugar o experiencia" htmlFor={`essential-item-${item.id}`}>
            <input
              id={`essential-item-${item.id}`}
              value={item.title}
              maxLength={320}
              required
              placeholder="Ej. Visitar el conjunto histórico a primera hora"
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </Field>
          <Field
            label="Descripción práctica (opcional)"
            htmlFor={`essential-description-${item.id}`}
          >
            <textarea
              id={`essential-description-${item.id}`}
              value={item.description || ''}
              maxLength={700}
              placeholder="Acceso, contexto local o qué conviene saber antes de ir."
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </Field>
          <EssentialIconPicker
            id={`essential-item-icon-${item.id}`}
            label="Símbolo del imprescindible"
            value={item.icon}
            inheritedIcon={groupIcon}
            allowInherit
            onChange={(icon) => onChange({ icon })}
          />
        </section>

        <section aria-labelledby={`essential-practical-${item.id}`}>
          <header>
            <h5 id={`essential-practical-${item.id}`}>Información práctica</h5>
            <p>Los campos vacíos no aparecerán en la ficha pública.</p>
          </header>
          <div className="essential-item-editor__field-grid">
            <Field label="Duración aproximada" htmlFor={`essential-duration-${item.id}`}>
              <input
                id={`essential-duration-${item.id}`}
                value={item.duration || ''}
                maxLength={80}
                placeholder="Ej. 45 min o media jornada"
                onChange={(event) => onChange({ duration: event.target.value })}
              />
            </Field>
            <Field label="Mejor momento" htmlFor={`essential-time-${item.id}`}>
              <input
                id={`essential-time-${item.id}`}
                value={item.bestTime || ''}
                maxLength={120}
                placeholder="Ej. A primera hora"
                onChange={(event) => onChange({ bestTime: event.target.value })}
              />
            </Field>
            <Field label="Reserva" htmlFor={`essential-reservation-${item.id}`}>
              <select
                id={`essential-reservation-${item.id}`}
                value={item.reservationRequired == null ? '' : String(item.reservationRequired)}
                onChange={(event) =>
                  onChange({
                    reservationRequired:
                      event.target.value === '' ? null : event.target.value === 'true',
                  })
                }
              >
                <option value="">Sin indicar</option>
                <option value="true">Reserva necesaria</option>
                <option value="false">No requiere reserva</option>
              </select>
            </Field>
            <Field label="Web oficial" htmlFor={`essential-url-${item.id}`}>
              <input
                id={`essential-url-${item.id}`}
                type="url"
                value={item.officialUrl || ''}
                maxLength={500}
                placeholder="https://"
                onChange={(event) => onChange({ officialUrl: event.target.value })}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby={`essential-image-${item.id}`}>
          <header>
            <h5 id={`essential-image-${item.id}`}>Fotografía</h5>
            <p>Opcional. Se muestra únicamente cuando alguien abre este imprescindible.</p>
          </header>
          {destinationId ? (
            <>
              <ImageUploader
                id={`essential-image-upload-${item.id}`}
                label="Fotografía del lugar o experiencia"
                value={item.imageUrl}
                token={token}
                endpoint="/upload/essential"
                extraData={{ destinoId: destinationId }}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                acceptedLabel="JPG, PNG o WebP"
                previewAlt={item.imageAlt || 'Vista previa del imprescindible'}
                onChange={(imageUrl) => onChange({ imageUrl })}
                onRemove={() => onChange({ imageUrl: null, imageAlt: null })}
              />
              {item.imageUrl && (
                <Field
                  label="Descripción accesible de la fotografía"
                  htmlFor={`essential-image-alt-${item.id}`}
                  hint="Describe lo que aporta la imagen, no empieces por «imagen de»."
                >
                  <input
                    id={`essential-image-alt-${item.id}`}
                    value={item.imageAlt || ''}
                    maxLength={180}
                    required
                    placeholder="Ej. Fachada modernista vista desde el paseo"
                    onChange={(event) => onChange({ imageAlt: event.target.value })}
                  />
                </Field>
              )}
            </>
          ) : (
            <Notice>
              <ImageIcon /> Guarda primero el destino para poder subir fotografías.
            </Notice>
          )}
        </section>

        <section aria-labelledby={`essential-location-${item.id}`}>
          <header>
            <h5 id={`essential-location-${item.id}`}>Ubicación</h5>
            <p>Vincula un punto exacto para mostrar el mapa y el acceso a OpenStreetMap.</p>
          </header>
          {destinationId ? (
            <>
              {!!places.length && (
                <Field
                  label="Buscar un punto existente"
                  htmlFor={`essential-place-search-${item.id}`}
                >
                  <input
                    id={`essential-place-search-${item.id}`}
                    type="search"
                    value={placeQuery}
                    placeholder="Nombre o categoría"
                    onChange={(event) => setPlaceQuery(event.target.value)}
                  />
                </Field>
              )}
              <Field label="Punto asociado" htmlFor={`essential-place-${item.id}`}>
                <select
                  id={`essential-place-${item.id}`}
                  value={item.placeId || ''}
                  onChange={(event) => {
                    const place = places.find((candidate) => candidate.id === event.target.value);
                    onChange({ placeId: place?.id || null, place: place || null });
                  }}
                >
                  <option value="">Sin punto asociado</option>
                  {filteredPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.nombre} · {place.categoria}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="essential-item-editor__location-actions">
                <Button type="button" variant="secondary" onClick={() => onRequestPlace()}>
                  <Plus /> Crear ubicación
                </Button>
                {selectedPlace && (
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => onRequestPlace(selectedPlace)}
                  >
                    <Edit3 /> Editar {selectedPlace.nombre}
                  </Button>
                )}
              </div>
              {selectedPlace && (
                <p className="essential-item-editor__coordinates">
                  <MapPin /> {selectedPlace.latitud.toFixed(5)}, {selectedPlace.longitud.toFixed(5)}
                </p>
              )}
            </>
          ) : (
            <Notice>
              <MapPin /> Guarda primero el destino para crear o asociar una ubicación.
            </Notice>
          )}
        </section>

        <footer className="essential-item-editor__actions">
          <div aria-label="Cambiar orden del imprescindible">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
              aria-label="Mover imprescindible hacia arriba"
            >
              <ArrowUp />
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
              aria-label="Mover imprescindible hacia abajo"
            >
              <ArrowDown />
            </button>
          </div>
          <Button type="button" variant="quiet" onClick={onRemove}>
            <Trash2 /> Eliminar imprescindible
          </Button>
        </footer>
      </div>
    </details>
  );
}
