import { t } from '../../../i18n';
import { Edit3, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { Button, Empty, Field } from '../../../components/ui';
import type { Destino, Place } from '../../../types';
import { AdminToolbar } from './AdminToolbar';
import { EditorialStatusBadge, EditorialStatusFilter } from './EditorialStatusBadge';

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
  const [status, setStatus] = useState<Place['editorialStatus'] | 'all'>('all');
  const visible = places.filter((place) => status === 'all' || place.editorialStatus === status);
  return (
    <>
      <div className="admin-place-context">
        <div>
          <label htmlFor="destination-filter">{t('Buscar destino')}</label>
          <div className="admin-search">
            <Search />
            <input
              id="destination-filter"
              value={destinationQuery}
              onChange={(event) => onDestinationQueryChange(event.target.value)}
              placeholder={t('Filtrar destinos')}
            />
          </div>
        </div>
        <Field label={t('Destino activo')} htmlFor="places-destination">
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
        placeholder={t('Buscar lugar o categoría')}
        resultCount={visible.length}
      >
        <Button onClick={onCreate}>
          <Plus /> {t('Nuevo lugar')}
        </Button>
      </AdminToolbar>
      <EditorialStatusFilter value={status} onChange={setStatus} />

      <div className="admin-list">
        {visible.length ? (
          visible.map((place) => (
            <article key={place.id}>
              <div>
                <EditorialStatusBadge status={place.editorialStatus} />
                <span>
                  {t(place.categoria)} · {place.isActive === false ? t('Oculto') : t('Visible')}{' '}
                  {t('· orden')} {place.sortOrder || 0}
                </span>
                <h2>{place.nombre}</h2>
                <p>{place.descripcion || t('Sin descripción')}</p>
                {place.website && (
                  <a href={place.website} target="_blank" rel="noreferrer">
                    {t('Abrir web')} <ExternalLink />
                  </a>
                )}
              </div>
              <div>
                <button
                  onClick={() => onEdit(place)}
                  aria-label={t('Editar {0}', { 0: place.nombre })}
                >
                  <Edit3 />
                </button>
                <button
                  onClick={() => onDelete(place.id)}
                  aria-label={t('Eliminar {0}', { 0: place.nombre })}
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty title={t('Este destino no tiene lugares')}>
            {t('Añade miradores, monumentos, playas u otros puntos útiles.')}
          </Empty>
        )}
      </div>
    </>
  );
}
import { useState } from 'react';
