import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Settings2, X } from 'lucide-react';
import type { CollectionDetail } from '../../../types';
import { Button, Field, Notice } from '../../../components/ui';
import { getTripDuration } from '../../../utils/tripDuration';

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
  const [nombre, setNombre] = useState(collection.nombre);
  const [descripcion, setDescripcion] = useState(collection.descripcion || '');
  const [startDate, setStartDate] = useState(collection.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(collection.endDate?.slice(0, 10) || '');
  const [travelerCount, setTravelerCount] = useState(collection.travelerCount || 2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstInput = useRef<HTMLInputElement>(null);
  const duration = getTripDuration({
    startDate,
    endDate,
    itineraryLength: collection.itinerary.length,
    destinationCount: collection.items.length,
  });
  const itineraryDelta = collection.itinerary.length ? duration.days - collection.itinerary.length : 0;

  useEffect(() => {
    firstInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (itineraryDelta < 0 && !window.confirm(`Se eliminarán ${Math.abs(itineraryDelta)} ${Math.abs(itineraryDelta) === 1 ? 'día' : 'días'} del final del itinerario. ¿Continuar?`)) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        travelerCount,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los datos del viaje');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal trip-settings-modal" role="dialog" aria-modal="true" aria-labelledby="trip-settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar"><X /></button>
        <div className="modal__heading">
          <span className="modal__icon"><Settings2 aria-hidden="true" /></span>
          <div><p className="kicker">Datos del viaje</p><h2 id="trip-settings-title">Editar planificación</h2></div>
        </div>
        <form onSubmit={submit}>
          <Field label="Nombre" htmlFor="settings-trip-name">
            <input ref={firstInput} id="settings-trip-name" value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={80} required />
          </Field>
          <Field label="Descripción" htmlFor="settings-trip-description">
            <textarea id="settings-trip-description" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} maxLength={280} />
          </Field>
          <div className="form-grid form-grid--dates">
            <Field label="Inicio" htmlFor="settings-trip-start"><input id="settings-trip-start" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); if (endDate && event.target.value > endDate) setEndDate(event.target.value); }} /></Field>
            <Field label="Fin" htmlFor="settings-trip-end"><input id="settings-trip-end" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field>
          </div>
          <div className="trip-duration-preview" aria-live="polite">
            <CalendarDays aria-hidden="true" />
            <div><strong>{duration.days} {duration.days === 1 ? 'día' : 'días'} · {duration.nights} {duration.nights === 1 ? 'noche' : 'noches'}</strong><span>El itinerario y el presupuesto usarán esta duración.</span></div>
          </div>
          {itineraryDelta !== 0 && startDate && endDate && <Notice tone="info">Al guardar, el itinerario {itineraryDelta > 0 ? `añadirá ${itineraryDelta} ${itineraryDelta === 1 ? 'día' : 'días'}` : `se reducirá en ${Math.abs(itineraryDelta)} ${Math.abs(itineraryDelta) === 1 ? 'día' : 'días'}`} para coincidir con las fechas.</Notice>}
          <Field label="Viajeros" htmlFor="settings-trip-travelers" hint="Se usa para contextualizar el viaje y calcular su presupuesto.">
            <input id="settings-trip-travelers" type="number" min="1" max="50" inputMode="numeric" value={travelerCount} onChange={(event) => setTravelerCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} />
          </Field>
          {!startDate && <p className="modal__skip-note"><CalendarDays /> Sin fecha de inicio, la duración se toma del itinerario y no se puede exportar al calendario.</p>}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="modal__actions">
            <Button type="button" variant="quiet" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving} disabled={!nombre.trim()}>Guardar datos</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
