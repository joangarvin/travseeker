import { addTripDays } from '../../../utils/tripDuration';
import { t, intlLocale } from '../../../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, CircleAlert, Luggage, MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, Loader, Notice } from '../../../components/ui';
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
  onFailed: (message: string) => void;
  open: boolean;
  onDismiss: () => void;
  onClose: () => void;
  onAdded: (message: string, tripUrl: string, notify: boolean) => void;
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
  open,
  onFailed,
  onDismiss,
  onClose,
  onAdded,
}: DestinationTripDialogProps) {
  const [selectedCollection, setSelectedCollection] = useState<CollectionDetail | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'new'>('new');
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<CollectionSummary | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [result, setResult] = useState<{ message: string; url: string } | null>(null);
  const openRef = useRef(open);
  const mounted = useRef(true);
  const saving = useRef(false);
  const statusAction = useRef<HTMLButtonElement>(null);
  const selectionStep = useRef<HTMLDivElement>(null);
  const tripList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (open && attempted) statusAction.current?.focus();
  }, [open, attempted, pending]);
  const complete = (message: string, url: string) => {
    if (!mounted.current) return;
    setResult({ message, url });
    onAdded(message, url, !openRef.current);
    if (!openRef.current) onClose();
  };
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
    setSelectedTrip(collection);
    if (!plannedItem && !defaultMunicipioId) return;

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

  const addDestination = async () => {
    if (!selectedTrip || saving.current) return;
    saving.current = true;
    setPending(true);
    setAttempted(true);
    setError('');
    try {
      await api(
        `/colecciones/${selectedTrip.id}/items`,
        {
          method: 'POST',
          body: JSON.stringify({ destinoId: destination.id }),
        },
        token,
      );
      complete(
        t('{0} se ha añadido a {1}.', { 0: destination.nombre.trim(), 1: selectedTrip.nombre }),
        `/colecciones/${selectedTrip.id}`,
      );
    } catch (cause) {
      if (mounted.current) {
        const message =
          cause instanceof Error ? cause.message : t('No se pudo añadir el destino al viaje');
        setError(message);
        if (!openRef.current) onFailed(message);
      }
    } finally {
      saving.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const addEssentialToDay = async () => {
    if (!selectedCollection || (!plannedItem && !defaultMunicipioId) || saving.current) return;
    saving.current = true;
    setAttempted(true);
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
      complete(
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
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t('No se pudo actualizar el itinerario');
      if (!mounted.current) return;
      const failure = destinationWasAdded
        ? t(
            plannedItem
              ? 'El destino ya está en el viaje, pero la actividad no se guardó: {0}'
              : 'El destino ya está en el viaje, pero la base no se guardó: {0}',
            { 0: message },
          )
        : message;
      setError(failure);
      if (!openRef.current) onFailed(failure);
    } finally {
      saving.current = false;
      if (mounted.current) setPending(false);
    }
  };

  useEffect(() => {
    if (!open || attempted || detailLoading || collectionsLoading) return;
    const control = selectedTrip
      ? selectionStep.current?.querySelector<HTMLElement>('input:checked, .trip-feedback__primary')
      : tripList.current?.querySelector<HTMLElement>('button');
    control?.focus({ preventScroll: true });
  }, [open, attempted, selectedTrip, selectedCollection, detailLoading, collectionsLoading]);

  const submit = () => {
    void (plannedItem || defaultMunicipioId ? addEssentialToDay() : addDestination());
  };
  const close = () => {
    if (saving.current) {
      openRef.current = false;
      onDismiss();
    } else onClose();
  };
  if (!open) return null;

  if (attempted && selectedTrip) {
    const phase = pending ? 'saving' : result ? 'success' : 'error';
    return (
      <Dialog
        title={
          pending
            ? t('Añadiendo a tu viaje…')
            : result
              ? t('Ya está en tu viaje.')
              : t('No se pudo completar.')
        }
        onClose={close}
        className={`trip-dialog trip-feedback trip-feedback--${phase}`}
      >
        <div className="trip-feedback__journey" aria-hidden="true">
          <span className="trip-feedback__track" />
          <span className="trip-feedback__home">
            <MapPin />
          </span>
          <span className="trip-feedback__traveler">
            <MapPin />
          </span>
          <span className="trip-feedback__arrival">
            {result ? <Check /> : error && !pending ? <CircleAlert /> : <Luggage />}
          </span>
          <span className="trip-feedback__origin-label">{destination.nombre.trim()}</span>
          <span className="trip-feedback__trip-label">{selectedTrip.nombre}</span>
        </div>
        <div
          className="trip-feedback__body"
          role={phase === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          <p>
            {pending
              ? t('Guardándolo en «{0}».', { 0: selectedTrip.nombre })
              : result
                ? result.message
                : error}
          </p>
          {result && (
            <div className="trip-feedback__receipt">
              <MapPin aria-hidden="true" />
              <span>
                <strong>{selectedTrip.nombre}</strong>
                <small>{plannedItem ? plain(plannedItem.title) : destination.nombre.trim()}</small>
              </span>
            </div>
          )}
        </div>
        <div className="trip-feedback__actions">
          {result ? (
            <Link className="trip-feedback__primary" to={result.url}>
              {t('Ver mi viaje')}
              <span>
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          ) : !pending ? (
            <button
              ref={statusAction}
              className="trip-feedback__primary"
              type="button"
              onClick={submit}
            >
              {t('Reintentar')}
              <span>
                <ArrowRight aria-hidden="true" />
              </span>
            </button>
          ) : null}
          <button
            ref={pending || result ? statusAction : undefined}
            className="trip-feedback__secondary"
            type="button"
            onClick={
              pending || result
                ? close
                : () => {
                    setAttempted(false);
                    setError('');
                  }
            }
          >
            {pending || result ? t('Seguir explorando') : t('Volver a elegir')}
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={
        selectedCollection
          ? t('¿En qué día?')
          : plannedItem
            ? t('Añadir al itinerario')
            : t('Añadir a un viaje')
      }
      onClose={close}
      className="trip-dialog trip-picker"
    >
      <p className="trip-picker__context">
        {t('Próxima parada:')} <strong>{destination.nombre.trim()}</strong>
      </p>
      {plannedItem && <p className="trip-picker__activity">{plain(plannedItem.title)}</p>}
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
      ) : selectedTrip && !plannedItem && !defaultMunicipioId ? (
        <div className="trip-dialog__day-step" ref={selectionStep}>
          <button className="trip-dialog__back" type="button" onClick={() => setSelectedTrip(null)}>
            <ChevronLeft aria-hidden="true" />
            {t('Elegir otro viaje')}
          </button>
          <div className="trip-feedback__receipt">
            <Luggage aria-hidden="true" />
            <strong>{selectedTrip.nombre}</strong>
          </div>
          <button className="trip-feedback__primary" type="button" onClick={submit}>
            {t('Confirmar y añadir')}
            <span>
              <ArrowRight aria-hidden="true" />
            </span>
          </button>
        </div>
      ) : selectedCollection && (plannedItem || defaultMunicipioId) ? (
        <div className="trip-dialog__day-step" ref={selectionStep}>
          <div className="trip-picker__selected">
            <Luggage aria-hidden="true" />
            <span>
              {t('Tu viaje')} <strong>{selectedCollection.nombre}</strong>
            </span>
          </div>
          <fieldset className="trip-dialog__days">
            <legend className="sr-only">{t('¿En qué día?')}</legend>
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
                <Check className="trip-picker__check" aria-hidden="true" />
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
                <strong>{t('Crear un día nuevo')}</strong>
                <small>
                  {t('Al final del viaje, con este destino')}
                  {defaultMunicipioId ? t(' y la base seleccionada') : ''}.
                </small>
              </span>
              <Check className="trip-picker__check" aria-hidden="true" />
            </label>
          </fieldset>
          <button className="trip-feedback__primary" type="button" onClick={submit}>
            {selectedDayNumber === 'new'
              ? t('Crear día y añadir')
              : t('Añadir al día {0}', { 0: selectedDayNumber })}
            <span>
              <ArrowRight aria-hidden="true" />
            </span>
          </button>
          <button
            className="trip-feedback__secondary"
            type="button"
            onClick={() => {
              setSelectedCollection(null);
              setSelectedTrip(null);
              setError('');
            }}
          >
            <ChevronLeft aria-hidden="true" />
            {t('Elegir otro viaje')}
          </button>
        </div>
      ) : editableCollections.length ? (
        <div className="trip-dialog__list" ref={tripList} aria-label={t('Viajes editables')}>
          {editableCollections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              disabled={pending}
              onClick={() => void chooseCollection(collection)}
            >
              <span className="trip-dialog__list-icon">
                <Luggage aria-hidden="true" />
              </span>
              <span>
                <strong>{collection.nombre}</strong>
                <small>
                  {collection.count} {collection.count === 1 ? t('destino') : t('destinos')} ·{' '}
                  {collection.itineraryDays || 0}{' '}
                  {(collection.itineraryDays || 0) === 1 ? t('día') : t('días')}
                </small>
              </span>
              <span className="trip-picker__arrow">
                <ArrowRight aria-hidden="true" />
              </span>
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
      {!selectedTrip && !collectionsLoading && !collectionsError && (
        <button className="trip-feedback__secondary" type="button" onClick={close}>
          {t('Ahora no')}
        </button>
      )}
    </Dialog>
  );
}
