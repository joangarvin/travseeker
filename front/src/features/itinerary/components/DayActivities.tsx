import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { catalogName, t } from '../../../i18n';
import { Button, Dialog, Field } from '../../../components/ui';
import type { Destino, ItineraryDay } from '../../../types';
import {
  plannedActivityHref,
  tripActivityCatalog,
  movePlannedActivity,
} from '../../../utils/plannedActivities';
import { activityName } from '../itineraryPresentation';
import type { ItineraryEditor } from '../hooks/useItineraryEditor';
type Props = {
  day: ItineraryDay;
  destination: Destino;
  index: number;
  canEdit: boolean;
  editor: Pick<
    ItineraryEditor,
    | 'days'
    | 'setDays'
    | 'updateDay'
    | 'setSelectedDay'
    | 'setFeedback'
    | 'setFeedbackTone'
    | 'addingActivity'
    | 'setAddingActivity'
    | 'activityDraft'
    | 'setActivityDraft'
    | 'editingDay'
    | 'setEditingDay'
  >;
};
export function DayActivities({ day, destination, index, canEdit, editor }: Props) {
  const {
    days,
    setDays,
    updateDay,
    setSelectedDay,
    setFeedback,
    setFeedbackTone,
    addingActivity,
    setAddingActivity,
    activityDraft,
    setActivityDraft,
    editingDay,
    setEditingDay,
  } = editor;
  const activities = tripActivityCatalog(destination);
  const input = useRef<HTMLInputElement>(null);
  const chosen = activities.find((item) => item.id === activityDraft);
  const compatible = days.some((d, i) => i !== index && d.destinationId === day.destinationId);
  const open = () => {
    setAddingActivity(index);
    setActivityDraft('');
  };
  return (
    <div className={`trip-agenda__activities ${canEdit ? 'no-print' : ''}`}>
      <div className="agenda-activities-heading">
        <h4>{t('Qué hacer este día')}</h4>
        {canEdit && Boolean(day.plannedActivities?.length) && (
          <button className="agenda-text-button" onClick={open}>
            <Plus aria-hidden="true" />
            {t('Añadir actividad')}
          </button>
        )}
      </div>
      {day.plannedActivities?.length ? (
        day.plannedActivities.map((value, i) => (
          <div className="trip-agenda__activity" key={value}>
            <span className="agenda-activity-order" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <Link
                className="trip-agenda__activity-link"
                to={plannedActivityHref(destination, value)}
              >
                {activityName(destination, value)} <span aria-hidden="true">↗</span>
              </Link>
              <small>
                {t('Día')} {day.dayNumber} · {destination.nombre}
              </small>
            </div>
            {canEdit && (
              <div className="trip-agenda__activity-actions no-print">
                {compatible && (
                  <select
                    aria-label={t('Mover {0} a otro día', { 0: activityName(destination, value) })}
                    value=""
                    onChange={(event) => {
                      const to = Number(event.target.value);
                      setDays((current) => movePlannedActivity(current, index, to, value));
                      setSelectedDay(to);
                      setFeedbackTone('success');
                      setFeedback(t('Actividad movida al día {0}', { 0: to + 1 }));
                    }}
                  >
                    <option value="" disabled>
                      {t('Mover a…')}
                    </option>
                    {days.map((d, i) =>
                      i !== index && d.destinationId === day.destinationId ? (
                        <option key={i} value={i}>
                          {t('Día')} {i + 1}
                        </option>
                      ) : null,
                    )}
                  </select>
                )}
                <button
                  type="button"
                  aria-label={t('Quitar {0}', { 0: activityName(destination, value) })}
                  onClick={() => {
                    updateDay(index, {
                      plannedActivities: day.plannedActivities?.filter((item) => item !== value),
                    });
                    setFeedbackTone('info');
                    setFeedback(
                      t('Actividad quitada del día. Guarda los cambios para conservarlo.'),
                    );
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="agenda-empty">
          <BookOpen aria-hidden="true" />
          <div>
            <strong>{t('Un día por descubrir')}</strong>
            <p>
              {canEdit
                ? t('Añade algún plan o deja espacio para improvisar.')
                : t('No hay actividades previstas para este día.')}
            </p>
            {canEdit && (
              <Button onClick={open}>
                <Plus aria-hidden="true" />
                {t('Añadir actividad')}
              </Button>
            )}
          </div>
        </div>
      )}
      {canEdit && (
        <div className="trip-agenda__day-actions no-print">
          <Button
            variant="secondary"
            onClick={() => setEditingDay(editingDay === index ? null : index)}
          >
            {editingDay === index ? t('Cerrar edición') : t('Editar día')}
          </Button>
        </div>
      )}
      {canEdit && addingActivity === index && (
        <Dialog
          className="agenda-activity-dialog"
          title={t('Añadir actividad · Día {0}', { 0: day.dayNumber })}
          description={destination.nombre}
          onClose={() => setAddingActivity(null)}
          initialFocusRef={input}
        >
          <form
            className="trip-agenda__add"
            onSubmit={(event) => {
              event.preventDefault();
              const value = activityDraft.trim();
              if (!value || day.plannedActivities?.includes(value)) return;
              updateDay(index, {
                plannedActivities: [...new Set([...(day.plannedActivities || []), value])],
              });
              setActivityDraft('');
              setAddingActivity(null);
              setFeedbackTone('success');
              setFeedback(t('Actividad añadida al día {0}', { 0: day.dayNumber }));
            }}
          >
            {!!activities.length && (
              <Field label={t('Elegir del catálogo')} htmlFor={`catalog-${index}`}>
                <select
                  id={`catalog-${index}`}
                  value={chosen?.id || ''}
                  onChange={(event) => setActivityDraft(event.target.value)}
                >
                  <option value="">{t('Seleccionar actividad')}</option>
                  {activities.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={day.plannedActivities?.includes(item.id)}
                    >
                      {catalogName(item)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t('Actividad')} htmlFor={`activity-${index}`}>
              <input
                ref={input}
                id={`activity-${index}`}
                maxLength={100}
                required
                value={chosen ? catalogName(chosen) : activityDraft}
                onChange={(event) => setActivityDraft(event.target.value)}
                placeholder={t('Una experiencia que quieres vivir…')}
              />
            </Field>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setAddingActivity(null)}>
                {t('Cancelar')}
              </Button>
              <Button
                type="submit"
                disabled={
                  !activityDraft.trim() || day.plannedActivities?.includes(activityDraft.trim())
                }
              >
                {t('Añadir al día')}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
