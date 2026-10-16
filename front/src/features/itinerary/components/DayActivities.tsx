import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { catalogName, t } from '../../../i18n';
import { Button, Field } from '../../../components/ui';
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
    addingActivity,
    setAddingActivity,
    activityDraft,
    setActivityDraft,
    editingDay,
    setEditingDay,
  } = editor;
  const activities = tripActivityCatalog(destination);
  return (
    <div className={`trip-agenda__activities ${canEdit ? 'no-print' : ''}`}>
      <h4>{t('Actividades del día')}</h4>
      {day.plannedActivities?.length ? (
        day.plannedActivities.map((value) => (
          <div className="trip-agenda__activity" key={value}>
            <MapPin aria-hidden="true" />
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
                <select
                  aria-label={t('Mover {0} a otro día', {
                    0: activityName(destination, value),
                  })}
                  value=""
                  onChange={(event) => {
                    const to = Number(event.target.value);
                    setDays((current) => movePlannedActivity(current, index, to, value));
                    setSelectedDay(to);
                    setFeedback('');
                  }}
                >
                  <option value="" disabled>
                    {t('Mover a…')}
                  </option>
                  {days.map((target, targetIndex) =>
                    targetIndex !== index && target.destinationId === day.destinationId ? (
                      <option key={targetIndex} value={targetIndex}>
                        {t('Día')} {targetIndex + 1}
                      </option>
                    ) : null,
                  )}
                </select>
                <button
                  type="button"
                  aria-label={t('Quitar {0}', {
                    0: activityName(destination, value),
                  })}
                  onClick={() =>
                    updateDay(index, {
                      plannedActivities: day.plannedActivities?.filter((item) => item !== value),
                    })
                  }
                >
                  <Trash2 />
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="trip-agenda__empty">
          {t('Todavía no hay actividades. Añade una idea o deja espacio para improvisar.')}
        </p>
      )}
      {canEdit && (
        <div className="trip-agenda__day-actions no-print">
          <Button
            onClick={() => {
              setAddingActivity(addingActivity === index ? null : index);
              setActivityDraft('');
            }}
          >
            <Plus /> {t('Añadir actividad')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setEditingDay(editingDay === index ? null : index)}
          >
            {editingDay === index ? t('Cerrar edición') : t('Editar día')}
          </Button>
        </div>
      )}
      {canEdit && addingActivity === index && (
        <form
          className="trip-agenda__add no-print"
          onSubmit={(event) => {
            event.preventDefault();
            const value = activityDraft.trim();
            if (!value) return;
            updateDay(index, {
              plannedActivities: [...new Set([...(day.plannedActivities || []), value])],
            });
            setActivityDraft('');
            setAddingActivity(null);
          }}
        >
          <Field label={t('Actividad')} htmlFor={`activity-${index}`}>
            <input
              id={`activity-${index}`}
              autoFocus
              maxLength={100}
              required
              value={activityDraft}
              onChange={(event) => setActivityDraft(event.target.value)}
              placeholder={t('Una experiencia que quieres vivir…')}
            />
          </Field>
          {!!activities.length && (
            <Field label={t('Elegir del catálogo')} htmlFor={`catalog-${index}`}>
              <select
                id={`catalog-${index}`}
                value={activities.some((item) => item.id === activityDraft) ? activityDraft : ''}
                onChange={(event) => setActivityDraft(event.target.value)}
              >
                <option value="">{t('Seleccionar actividad')}</option>
                {activities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {catalogName(item)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Button type="submit">{t('Añadir al día')}</Button>
        </form>
      )}
    </div>
  );
}
