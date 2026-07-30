import { Edit3, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { Button, Empty, Field } from '../../../components/ui';
import type { Destino, Place } from '../../../types';
import { AdminToolbar } from './AdminToolbar';

type PlacesPanelProps = {
  places: Place[];
  destinations: Destino[];
  selectedDestinationId: string;
  placeQuery: string;
  destinationQuery: string;
  onPlaceQueryChange: (value: string) => void;
  onDestinationQueryChange: (value: string) => void;
  onDestinationChange: (id: string) => void;
  onCreate: () => void;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
};

export function PlacesPanel({
  places,
  destinations,
  selectedDestinationId,
  placeQuery,
  destinationQuery,
  onPlaceQueryChange,
  onDestinationQueryChange,
  onDestinationChange,
  onCreate,
  onEdit,
  onDelete,
}: PlacesPanelProps) {
  return (
    <>
      <div className="admin-place-context">
        <div>
          <label htmlFor="destination-filter">Buscar destino</label>
          <div className="admin-search">
            <Search />
            <input
              id="destination-filter"
              value={destinationQuery}
              onChange={(event) => onDestinationQueryChange(event.target.value)}
              placeholder="Filtrar destinos"
            />
          </div>
        </div>
        <Field label="Destino activo" htmlFor="places-destination">
          <select
            id="places-destination"
            value={selectedDestinationId}
            onChange={(event) => onDestinationChange(event.target.value)}
          >
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.nombre}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <AdminToolbar
        query={placeQuery}
        onQueryChange={onPlaceQueryChange}
        placeholder="Buscar lugar o categoría"
        resultCount={places.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nuevo lugar
        </Button>
      </AdminToolbar>

      <div className="admin-list">
        {places.length ? (
          places.map((place) => (
            <article key={place.id}>
              <div>
                <span>
                  {place.categoria} · {place.isActive === false ? 'Oculto' : 'Visible'} · orden{' '}
                  {place.sortOrder || 0}
                </span>
                <h2>{place.nombre}</h2>
                <p>{place.descripcion || 'Sin descripción'}</p>
                {place.website && (
                  <a href={place.website} target="_blank" rel="noreferrer">
                    Abrir web <ExternalLink />
                  </a>
                )}
              </div>
              <div>
                <button onClick={() => onEdit(place)} aria-label={`Editar ${place.nombre}`}>
                  <Edit3 />
                </button>
                <button onClick={() => onDelete(place.id)} aria-label={`Eliminar ${place.nombre}`}>
                  <Trash2 />
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty title="Este destino no tiene lugares">
            Añade miradores, monumentos, playas u otros puntos útiles.
          </Empty>
        )}
      </div>
    </>
  );
}
