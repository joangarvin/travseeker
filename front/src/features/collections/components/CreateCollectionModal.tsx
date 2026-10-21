import { t } from '../../../i18n';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Dialog, Notice } from '../../../components/ui';
import { TripFormFields } from './TripFormFields';
import { validTripForm, type TripFormValues } from '../tripForm';

export type NewCollectionInput = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
};

type CreateCollectionModalProps = {
  onClose: () => void;
  onCreate: (input: NewCollectionInput) => Promise<void>;
};

export function CreateCollectionModal({ onClose, onCreate }: CreateCollectionModalProps) {
  const [values, setValues] = useState<TripFormValues>({
    nombre: '',
    descripcion: '',
    startDate: '',
    endDate: '',
    travelerCount: 2,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !validTripForm(values)) return;
    setError('');
    setIsSubmitting(true);
    try {
      await onCreate({
        name: values.nombre.trim(),
        description: values.descripcion.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        travelerCount: Number(values.travelerCount),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo crear el viaje'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      title={t('Nuevo viaje')}
      description={t('Empieza con un nombre. Las fechas y la descripción son opcionales.')}
      className="trip-form-dialog"
      initialFocusRef={firstInput}
      onClose={onClose}
      busy={isSubmitting}
      closeOnBackdrop={false}
    >
      <form onSubmit={handleSubmit}>
        <div className="trip-form-dialog__body">
          <fieldset disabled={isSubmitting}>
            <TripFormFields
              values={values}
              onChange={setValues}
              initialFocusRef={firstInput}
              prefix="new-trip"
            />
          </fieldset>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <footer className="trip-form-dialog__actions">
          <Button type="button" variant="quiet" disabled={isSubmitting} onClick={onClose}>
            {t('Cancelar')}
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingLabel={t('Creando viaje…')}
            disabled={!validTripForm(values)}
          >
            {t('Crear viaje')} <ArrowRight aria-hidden="true" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
