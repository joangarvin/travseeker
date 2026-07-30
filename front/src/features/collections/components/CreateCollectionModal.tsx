import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button, Field, Notice } from '../../../components/ui';

type CreateCollectionModalProps = {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
};

export function CreateCollectionModal({ onClose, onCreate }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onCreate(name, description);
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
        <h2 id="new-trip">Nuevo viaje</h2>

        <form onSubmit={handleSubmit}>
          <Field label="Nombre" htmlFor="trip-name">
            <input
              id="trip-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              placeholder="Costa norte en septiembre"
            />
          </Field>
          <Field label="Descripción" htmlFor="trip-description">
            <textarea
              id="trip-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={280}
            />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" loading={isSubmitting}>
            Crear viaje
          </Button>
        </form>
      </section>
    </div>
  );
}
