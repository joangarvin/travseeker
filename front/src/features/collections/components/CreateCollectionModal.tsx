import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, X } from 'lucide-react';
import { Button, Field, Notice } from '../../../components/ui';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(2);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      if (name.trim()) setStep(2);
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await onCreate({ name, description, startDate, endDate, travelerCount });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el viaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
        <div className="modal__heading">
          <span className="modal__icon"><CalendarDays aria-hidden="true" /></span>
          <div>
            <p className="kicker">Paso {step} de 2</p>
            <h2 id="new-trip">{step === 1 ? 'Dale una identidad' : 'Sitúalo en el calendario'}</h2>
          </div>
        </div>

        <div className="modal-progress" aria-hidden="true">
          <span className="is-complete" />
          <span className={step === 2 ? 'is-complete' : ''} />
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <Field label="Nombre" htmlFor="trip-name" hint="Algo que reconocerás rápidamente en tu lista de viajes.">
                <input
                  ref={nameInputRef}
                  id="trip-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={80}
                  placeholder="Costa norte en septiembre"
                />
              </Field>
              <Field label="Descripción" htmlFor="trip-description" hint="Opcional. Puedes cambiarla más adelante.">
                <textarea
                  id="trip-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={280}
                  placeholder="Una escapada entre mar, pueblos y buena mesa."
                />
              </Field>
            </>
          ) : (
            <>
              <div className="form-grid form-grid--dates">
                <Field label="Fecha de inicio" htmlFor="trip-start-date">
                  <input
                    id="trip-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (endDate && event.target.value > endDate) setEndDate(event.target.value);
                    }}
                  />
                </Field>
                <Field label="Fecha de fin" htmlFor="trip-end-date">
                  <input
                    id="trip-end-date"
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Viajeros" htmlFor="trip-travelers" hint="Entre 1 y 50. Se usará para estimar el presupuesto.">
                <input
                  id="trip-travelers"
                  type="number"
                  min="1"
                  max="50"
                  inputMode="numeric"
                  value={travelerCount}
                  onChange={(event) => setTravelerCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                />
              </Field>
              <p className="modal__skip-note">¿Todavía no sabes las fechas? Déjalas abiertas y podrás decidirlas dentro del viaje.</p>
            </>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="modal__actions">
            {step === 2 && (
              <Button type="button" variant="quiet" onClick={() => setStep(1)} disabled={isSubmitting}>
                <ArrowLeft /> Volver
              </Button>
            )}
            {step === 1 ? (
              <Button type="button" disabled={!name.trim()} onClick={() => setStep(2)}>
                Continuar <ArrowRight />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Crear viaje
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
