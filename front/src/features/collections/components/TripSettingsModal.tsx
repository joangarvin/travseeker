import { t } from '../../../i18n';
import { useRef, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import type { CollectionDetail } from '../../../types';
import { Button, Dialog, Notice } from '../../../components/ui';
import { getTripDuration } from '../../../utils/tripDuration';
import { TripFormFields } from './TripFormFields';
import { validTripForm, type TripFormValues } from '../tripForm';

export type TripSettingsInput = {
  nombre: string;
  descripcion: string;
  startDate: string | null;
  endDate: string | null;
  travelerCount: number;
};

type TripSettingsModalProps = {
  collection: CollectionDetail;
  onClose: () => void;
  onSave: (input: TripSettingsInput) => Promise<void>;
};

export function TripSettingsModal({ collection, onClose, onSave }: TripSettingsModalProps) {
  const initial = {
    nombre: collection.nombre,
    descripcion: collection.descripcion || '',
    startDate: collection.startDate?.slice(0, 10) || '',
    endDate: collection.endDate?.slice(0, 10) || '',
    travelerCount: collection.travelerCount || 2,
  };
  const [values, setValues] = useState<TripFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmedRemoval, setConfirmedRemoval] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const unchanged =
    values.nombre.trim() === initial.nombre &&
    values.descripcion.trim() === initial.descripcion &&
    values.startDate === initial.startDate &&
    values.endDate === initial.endDate &&
    values.travelerCount === initial.travelerCount;
  const duration = getTripDuration({
    ...values,
    itineraryLength: collection.itinerary.length,
    destinationCount: collection.items.length,
  });
  const itineraryDelta =
    values.startDate &&
    values.endDate &&
    values.endDate >= values.startDate &&
    collection.itinerary.length
      ? duration.days - collection.itinerary.length
      : 0;
  const requiresConfirmation = itineraryDelta < 0;

  const update = (draft: TripFormValues) => {
    if (draft.startDate !== values.startDate || draft.endDate !== values.endDate)
      setConfirmedRemoval(false);
    setValues(draft);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      saving ||
      unchanged ||
      !validTripForm(values) ||
      (requiresConfirmation && !confirmedRemoval)
    )
      return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim(),
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        travelerCount: Number(values.travelerCount),
      });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t('No se pudieron guardar los datos del viaje'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={t('Editar viaje')}
      description={t('Ajusta sus datos, fechas y viajeros.')}
      className="trip-form-dialog"
      initialFocusRef={firstInput}
      onClose={onClose}
      busy={saving}
      closeOnBackdrop={false}
    >
      <form onSubmit={submit}>
        <div className="trip-form-dialog__body">
          <fieldset disabled={saving}>
            <TripFormFields
              values={values}
              onChange={update}
              initialFocusRef={firstInput}
              prefix="edit-trip"
            />
            {requiresConfirmation && (
              <div className="trip-form__date-warning">
                <p>
                  {t('Se eliminarán {0} {1} del final del itinerario y sus actividades.', {
                    0: Math.abs(itineraryDelta),
                    1: Math.abs(itineraryDelta) === 1 ? t('día') : t('días'),
                  })}
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={confirmedRemoval}
                    onChange={(event) => setConfirmedRemoval(event.target.checked)}
                  />
                  {t('Confirmo que quiero acortar el itinerario.')}
                </label>
              </div>
            )}
            {itineraryDelta > 0 && (
              <Notice>
                {t('Se añadirán {0} {1} al final del itinerario.', {
                  0: itineraryDelta,
                  1: itineraryDelta === 1 ? t('día') : t('días'),
                })}
              </Notice>
            )}
          </fieldset>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <footer className="trip-form-dialog__actions">
          <Button type="button" variant="quiet" onClick={onClose} disabled={saving}>
            {t('Cancelar')}
          </Button>
          <Button
            type="submit"
            loading={saving}
            loadingLabel={t('Guardando cambios…')}
            disabled={
              unchanged || !validTripForm(values) || (requiresConfirmation && !confirmedRemoval)
            }
          >
            <Check aria-hidden="true" /> {t('Guardar cambios')}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
