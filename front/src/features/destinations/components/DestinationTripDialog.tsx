import { addTripDays } from '../../../utils/tripDuration';
import { t, intlLocale } from '../../../i18n';
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
  plannedActivityValue?: string;
  defaultMunicipioId?: string;
  onRetryCollections: () => void;
  onClose: () => void;
  onAdded: (message: string, tripUrl?: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function dayLabel(day: CollectionDetail['itinerary'][number]) {
  if (!day.date) return t('Día {0}', { 0: day.dayNumber });
  return t('Día {0} · {1}', {
    0: day.dayNumber,
    1: dateFormatter.format(new Date(`${day.date}T00:00:00Z`)),
  });
}

export function DestinationTripDialog({
  destination,
  collections,
  collectionsLoading,
  collectionsError,
  token,
  plannedItem,
  plannedActivityValue,
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
    if (!plannedItem && !defaultMunicipioId) {
      setPending(true);
      try {
        await api(
          `/colecciones/${collection.id}/items`,
          { method: 'POST', body: JSON.stringify({ destinoId: destination.id }) },
          token,
        );
        onAdded(
          t('{0} se ha añadido a {1}.', { 0: destination.nombre.trim(), 1: collection.nombre }),
        );
        onClose();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : t('No se pudo añadir el destino al viaje'),
        );
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
      setError(cause instanceof Error ? cause.message : t('No se pudo abrir el itinerario'));
    } finally {
      setDetailLoading(false);
    }
  };

  const addEssentialToDay = async () => {
    if (!selectedCollection || (!plannedItem && !defaultMunicipioId)) return;
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
      const activityName = plannedItem
        ? plain(plannedItem.title) || t('Experiencia imprescindible')
        : undefined;
      const activityValue = activityName ? plannedActivityValue || activityName : undefined;
      const addedName =
        activityName ||
        destination.municipios?.find((municipio) => municipio.id === defaultMunicipioId)?.nombre ||
        t('Base seleccionada');
      const itinerary =
        selectedDayNumber === 'new'
          ? [
              ...selectedCollection.itinerary,
              {
                dayNumber: selectedCollection.itinerary.length + 1,
                destinationId: destination.id,
                ...(selectedCollection.startDate
                  ? {
                      date: addTripDays(
                        selectedCollection.startDate.slice(0, 10),
                        selectedCollection.itinerary.length,
                      ),
                    }
                  : {}),
                ...(defaultMunicipioId ? { baseMunicipioId: defaultMunicipioId } : {}),
                plannedActivities: activityValue ? [activityValue] : [],
              },
            ]
          : selectedCollection.itinerary.map((day) =>
              day.dayNumber === selectedDayNumber
                ? {
                    ...day,
                    ...(activityValue
                      ? {
                          plannedActivities: [
                            ...new Set([
                              ...(day.plannedActivities || []),
                              day.plannedActivities?.includes(activityName!)
                                ? activityName!
                                : activityValue,
                            ]),
                          ],
                        }
                      : { baseMunicipioId: defaultMunicipioId }),
                  }
                : day,
            );

      await api(
        `/colecciones/${selectedCollection.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            itinerary,
            ...(selectedDayNumber === 'new' &&
            selectedCollection.startDate &&
            selectedCollection.endDate &&
            addTripDays(selectedCollection.startDate.slice(0, 10), itinerary.length - 1) >
              selectedCollection.endDate.slice(0, 10)
              ? {
                  endDate: addTripDays(
                    selectedCollection.startDate.slice(0, 10),
                    itinerary.length - 1,
                  ),
                }
              : {}),
          }),
        },
        token,
      );
      onAdded(
        t('{0} se ha añadido {1} de {2}.', {
          0: addedName,
          1:
            selectedDayNumber === 'new'
              ? t('a un día nuevo')
              : t('al día {0}', { 0: selectedDayNumber }),
          2: selectedCollection.nombre,
        }),
        `/colecciones/${selectedCollection.id}?day=${selectedDayNumber === 'new' ? itinerary.length : selectedDayNumber}`,
      );
      onClose();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t('No se pudo actualizar el itinerario');
      setError(
        destinationWasAdded
          ? t('El destino ya está en el viaje, pero la actividad no se guardó: {0}', { 0: message })
          : message,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      title={plannedItem ? t('Añadir al itinerario') : t('Añadir a un viaje')}
      description={
        plannedItem
          ? t('Elige dónde encajar “{0}” dentro de un viaje real.', { 0: plain(plannedItem.title) })
          : t('Guarda {0} en uno de tus viajes.', { 0: destination.nombre.trim() })
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
                {t('Reintentar')}
              </button>
            ) : undefined
          }
        >
          {error}
        </Notice>
      )}

      {collectionsLoading ? (
        <Loader label={t('Cargando tus viajes')} />
      ) : collectionsError ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={onRetryCollections}>
              {t('Reintentar')}
            </button>
          }
        >
          {collectionsError}
        </Notice>
      ) : detailLoading ? (
        <Loader label={t('Abriendo el itinerario')} />
      ) : selectedCollection && (plannedItem || defaultMunicipioId) ? (
        <div className="trip-dialog__day-step">
          <button
            className="trip-dialog__back"
            type="button"
            onClick={() => {
              setSelectedCollection(null);
              setError('');
            }}
          >
            <ChevronLeft aria-hidden="true" /> {t('Elegir otro viaje')}
          </button>
          <fieldset className="trip-dialog__days">
            <legend>{t('¿En qué día?')}</legend>
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
                  <small>
                    {t('Este día ya incluye')} {destination.nombre.trim()}.
                  </small>
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
                <strong>{t('Crear un día nuevo al final')}</strong>
                <small>
                  {t('Usará este destino')}
                  {defaultMunicipioId ? t(' y la base seleccionada') : ''}.
                </small>
              </span>
              {selectedDayNumber === 'new' && <Check aria-hidden="true" />}
            </label>
          </fieldset>
          <Button loading={pending} onClick={() => void addEssentialToDay()}>
            <CalendarPlus aria-hidden="true" /> {t('Añadir al día')}
          </Button>
        </div>
      ) : editableCollections.length ? (
        <div className="trip-dialog__list" aria-label={t('Viajes editables')}>
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
                  {collection.count} {collection.count === 1 ? t('destino') : t('destinos')} ·{' '}
                  {collection.itineraryDays || 0}{' '}
                  {(collection.itineraryDays || 0) === 1 ? t('día') : t('días')}
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
          <h3>{t('Crea el primer viaje')}</h3>
          <p>{t('Después podrás añadir este destino y organizarlo por días.')}</p>
          <Link className="button button--primary" to="/colecciones" state={{ openCreate: true }}>
            {t('Crear un viaje')}
          </Link>
        </div>
      )}
    </Dialog>
  );
}
