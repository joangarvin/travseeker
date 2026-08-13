import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, MapPin, Plus, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Dialog, Loader, Notice } from '../../../components/ui';
import { api } from '../../../services/api';
import type { CollectionDetail, CollectionSummary, Destino, EssentialItem } from '../../../types';
import { plain } from '../../../utils';

type DestinationTripDialogProps = {
  destination: Destino;
  collections: CollectionSummary[];
  collectionsLoading: boolean;
  collectionsError: string;
  token: string;
  plannedItem?: EssentialItem | null;
  defaultMunicipioId?: string;
  onRetryCollections: () => void;
  onClose: () => void;
  onAdded: (message: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function dayLabel(day: CollectionDetail['itinerary'][number]) {
  if (!day.date) return `Día ${day.dayNumber}`;
  return `Día ${day.dayNumber} · ${dateFormatter.format(new Date(`${day.date}T00:00:00Z`))}`;
}

export function DestinationTripDialog({
  destination,
  collections,
  collectionsLoading,
  collectionsError,
  token,
  plannedItem,
  defaultMunicipioId,
  onRetryCollections,
  onClose,
  onAdded,
}: DestinationTripDialogProps) {
  const [selectedCollection, setSelectedCollection] = useState<CollectionDetail | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'new'>('new');
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const editableCollections = useMemo(
    () => collections.filter((collection) => collection.role !== 'viewer'),
    [collections],
  );
  const eligibleDays = useMemo(
    () => selectedCollection?.itinerary.filter((day) => day.destinationId === destination.id) || [],
    [destination.id, selectedCollection],
  );

  useEffect(() => {
    setSelectedDayNumber(eligibleDays[0]?.dayNumber || 'new');
  }, [eligibleDays]);

  const chooseCollection = async (collection: CollectionSummary) => {
    setError('');
    if (!plannedItem) {
      setPending(true);
      try {
        await api(
          `/colecciones/${collection.id}/items`,
          { method: 'POST', body: JSON.stringify({ destinoId: destination.id }) },
          token,
        );
        onAdded(`${destination.nombre.trim()} se ha añadido a ${collection.nombre}.`);
        onClose();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo añadir el destino al viaje');
      } finally {
        setPending(false);
      }
      return;
    }

    setDetailLoading(true);
    try {
      setSelectedCollection(
        await api<CollectionDetail>(`/colecciones/${collection.id}`, {}, token),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el itinerario');
    } finally {
      setDetailLoading(false);
    }
  };

  const addEssentialToDay = async () => {
    if (!selectedCollection || !plannedItem) return;
    setPending(true);
    setError('');
    let destinationWasAdded = false;
    try {
      await api(
        `/colecciones/${selectedCollection.id}/items`,
        { method: 'POST', body: JSON.stringify({ destinoId: destination.id }) },
        token,
      );
      destinationWasAdded = true;
      const activityName = plain(plannedItem.title) || 'Experiencia imprescindible';
      const itinerary =
        selectedDayNumber === 'new'
          ? [
              ...selectedCollection.itinerary,
              {
                dayNumber: selectedCollection.itinerary.length + 1,
                destinationId: destination.id,
                ...(defaultMunicipioId ? { baseMunicipioId: defaultMunicipioId } : {}),
                plannedActivities: [activityName],
              },
            ]
          : selectedCollection.itinerary.map((day) =>
              day.dayNumber === selectedDayNumber
                ? {
                    ...day,
                    plannedActivities: [
                      ...new Set([...(day.plannedActivities || []), activityName]),
                    ],
                  }
                : day,
            );

      await api(
        `/colecciones/${selectedCollection.id}`,
        { method: 'PATCH', body: JSON.stringify({ itinerary }) },
        token,
      );
      onAdded(
        `${activityName} se ha añadido ${selectedDayNumber === 'new' ? 'a un día nuevo' : `al día ${selectedDayNumber}`} de ${selectedCollection.nombre}.`,
      );
      onClose();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No se pudo actualizar el itinerario';
      setError(
        destinationWasAdded
          ? `El destino ya está en el viaje, pero la actividad no se guardó: ${message}`
          : message,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      title={plannedItem ? 'Añadir al itinerario' : 'Añadir a un viaje'}
      description={
        plannedItem
          ? `Elige dónde encajar “${plain(plannedItem.title)}” dentro de un viaje real.`
          : `Guarda ${destination.nombre.trim()} en uno de tus viajes.`
      }
      onClose={onClose}
      className="trip-dialog"
    >
      {error && (
        <Notice
          tone="error"
          action={
            selectedCollection ? (
              <button type="button" onClick={() => void addEssentialToDay()}>
                Reintentar
              </button>
            ) : undefined
          }
        >
          {error}
        </Notice>
      )}

      {collectionsLoading ? (
        <Loader label="Cargando tus viajes" />
      ) : collectionsError ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={onRetryCollections}>
              Reintentar
            </button>
          }
        >
          {collectionsError}
        </Notice>
      ) : detailLoading ? (
        <Loader label="Abriendo el itinerario" />
      ) : selectedCollection && plannedItem ? (
        <div className="trip-dialog__day-step">
          <button
            className="trip-dialog__back"
            type="button"
            onClick={() => {
              setSelectedCollection(null);
              setError('');
            }}
          >
            <ChevronLeft aria-hidden="true" /> Elegir otro viaje
          </button>
          <fieldset className="trip-dialog__days">
            <legend>¿En qué día?</legend>
            {eligibleDays.map((day) => (
              <label key={day.dayNumber}>
                <input
                  type="radio"
                  name="trip-day"
                  value={day.dayNumber}
                  checked={selectedDayNumber === day.dayNumber}
                  onChange={() => setSelectedDayNumber(day.dayNumber)}
                />
                <span>
                  <strong>{dayLabel(day)}</strong>
                  <small>Este día ya incluye {destination.nombre.trim()}.</small>
                </span>
                {selectedDayNumber === day.dayNumber && <Check aria-hidden="true" />}
              </label>
            ))}
            <label>
              <input
                type="radio"
                name="trip-day"
                value="new"
                checked={selectedDayNumber === 'new'}
                onChange={() => setSelectedDayNumber('new')}
              />
              <span>
                <strong>Crear un día nuevo al final</strong>
                <small>
                  Usará este destino{defaultMunicipioId ? ' y la base seleccionada' : ''}.
                </small>
              </span>
              {selectedDayNumber === 'new' && <Check aria-hidden="true" />}
            </label>
          </fieldset>
          <Button loading={pending} onClick={() => void addEssentialToDay()}>
            <CalendarPlus aria-hidden="true" /> Añadir al día
          </Button>
        </div>
      ) : editableCollections.length ? (
        <div className="trip-dialog__list" aria-label="Viajes editables">
          {editableCollections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              disabled={pending}
              onClick={() => void chooseCollection(collection)}
            >
              <span className="trip-dialog__list-icon">
                <Route aria-hidden="true" />
              </span>
              <span>
                <strong>{collection.nombre}</strong>
                <small>
                  {collection.count} {collection.count === 1 ? 'destino' : 'destinos'} ·{' '}
                  {collection.itineraryDays || 0}{' '}
                  {(collection.itineraryDays || 0) === 1 ? 'día' : 'días'}
                </small>
              </span>
              <MapPin aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className="trip-dialog__empty">
          <span>
            <Plus aria-hidden="true" />
          </span>
          <h3>Crea el primer viaje</h3>
          <p>Después podrás añadir este destino y organizarlo por días.</p>
          <Link className="button button--primary" to="/colecciones" state={{ openCreate: true }}>
            Crear un viaje
          </Link>
        </div>
      )}
    </Dialog>
  );
}
