import type { RefObject } from 'react';
import { CalendarDays, Minus, Plus, Users } from 'lucide-react';
import { Field } from '../../../components/ui';
import { t } from '../../../i18n';
import { getTripDuration } from '../../../utils/tripDuration';

import type { TripFormValues } from '../tripForm';

export function TripFormFields({
  values,
  onChange,
  initialFocusRef,
  prefix,
}: {
  values: TripFormValues;
  onChange: (values: TripFormValues) => void;
  initialFocusRef: RefObject<HTMLInputElement | null>;
  prefix: string;
}) {
  const duration = getTripDuration(values);
  const invalidDates = !!values.endDate && (!values.startDate || values.endDate < values.startDate);
  const update = (patch: Partial<TripFormValues>) => onChange({ ...values, ...patch });
  return (
    <>
      <Field label={t('Nombre del viaje')} htmlFor={`${prefix}-name`}>
        <input
          ref={initialFocusRef}
          id={`${prefix}-name`}
          value={values.nombre}
          onChange={(event) => update({ nombre: event.target.value })}
          required
          maxLength={80}
          placeholder={t('Costa norte en septiembre')}
          autoComplete="off"
        />
      </Field>
      <Field label={t('Descripción (opcional)')} htmlFor={`${prefix}-description`}>
        <textarea
          id={`${prefix}-description`}
          rows={2}
          value={values.descripcion}
          onChange={(event) => update({ descripcion: event.target.value })}
          maxLength={280}
          placeholder={t('Una escapada entre mar, pueblos y buena mesa.')}
        />
      </Field>
      <section className="trip-form__dates" aria-label={t('Fechas del viaje')}>
        <div className="trip-form__section-heading">
          <span>
            <CalendarDays aria-hidden="true" /> {t('Fechas del viaje')}
          </span>
          {(values.startDate || values.endDate) && (
            <button type="button" onClick={() => update({ startDate: '', endDate: '' })}>
              {t('Dejar sin fechas')}
            </button>
          )}
        </div>
        <div className="trip-form__date-grid">
          <Field label={t('Inicio')} htmlFor={`${prefix}-start`}>
            <input
              id={`${prefix}-start`}
              type="date"
              value={values.startDate}
              onChange={(event) =>
                update({
                  startDate: event.target.value,
                  ...(!event.target.value ? { endDate: '' } : {}),
                })
              }
            />
          </Field>
          <Field label={t('Fin')} htmlFor={`${prefix}-end`}>
            <input
              id={`${prefix}-end`}
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              disabled={!values.startDate}
              aria-invalid={invalidDates || undefined}
              aria-describedby={`${prefix}-duration`}
              onChange={(event) => update({ endDate: event.target.value })}
            />
          </Field>
        </div>
        <p
          id={`${prefix}-duration`}
          className="trip-form__duration"
          aria-live="polite"
          data-error={invalidDates || undefined}
        >
          {invalidDates ? (
            t('La fecha de fin debe ser igual o posterior a la de inicio.')
          ) : values.startDate && values.endDate ? (
            <>
              <strong>
                {duration.days} {duration.days === 1 ? t('día') : t('días')} · {duration.nights}{' '}
                {duration.nights === 1 ? t('noche') : t('noches')}
              </strong>
              <span>{t('El presupuesto se ajusta a estas fechas.')}</span>
            </>
          ) : values.startDate ? (
            t('Añade la fecha de vuelta para calcular la duración.')
          ) : (
            t('Puedes organizar el viaje sin fijar fechas.')
          )}
        </p>
      </section>
      <div className="trip-form__travelers">
        <div>
          <label htmlFor={`${prefix}-travelers`}>
            <Users aria-hidden="true" /> {t('Viajeros')}
          </label>
          <p id={`${prefix}-travelers-hint`}>{t('Entre 1 y 50 personas.')}</p>
        </div>
        <div className="trip-form__stepper">
          <button
            type="button"
            aria-label={t('Quitar un viajero')}
            disabled={values.travelerCount !== '' && values.travelerCount <= 1}
            onClick={() =>
              update({
                travelerCount: Math.min(50, Math.max(1, (Number(values.travelerCount) || 2) - 1)),
              })
            }
          >
            <Minus aria-hidden="true" />
          </button>
          <input
            id={`${prefix}-travelers`}
            type="number"
            min={1}
            max={50}
            step={1}
            inputMode="numeric"
            required
            aria-describedby={`${prefix}-travelers-hint`}
            value={values.travelerCount}
            onChange={(event) =>
              update({ travelerCount: event.target.value === '' ? '' : Number(event.target.value) })
            }
          />
          <button
            type="button"
            aria-label={t('Añadir un viajero')}
            disabled={values.travelerCount !== '' && values.travelerCount >= 50}
            onClick={() =>
              update({
                travelerCount: Math.max(1, Math.min(50, (Number(values.travelerCount) || 2) + 1)),
              })
            }
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
