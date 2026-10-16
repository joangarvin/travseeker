import { catalogName, t } from '../../../i18n';
import { Field } from '../../../components/ui';
import type { CollectionDetail, Destino, ItineraryDay } from '../../../types';
import { tripActivityCatalog } from '../../../utils/plannedActivities';
import { destinationFor } from '../itineraryModel';

type Props = {
  collection: CollectionDetail;
  destination: Destino;
  day: ItineraryDay;
  index: number;
  onChange: (patch: Partial<ItineraryDay>) => void;
};

export function ItineraryDayEditor({ collection, destination, day, index, onChange }: Props) {
  const municipios = destination.municipios || [];
  const activities = tripActivityCatalog(destination);
  return (
    <div className="itinerary-day__fields no-print">
      <Field label={t('Destino')} htmlFor={`itinerary-destination-${index}`}>
        <select
          id={`itinerary-destination-${index}`}
          value={day.destinationId}
          onChange={(event) => {
            if (
              (day.plannedActivities?.length || day.notes) &&
              !confirm(t('Cambiar de destino quitará las actividades de este día. ¿Continuar?'))
            )
              return;
            const nextDestination = destinationFor(collection, event.target.value);
            onChange({
              destinationId: event.target.value,
              baseMunicipioId: nextDestination?.municipios?.[0]?.id,
              plannedActivities: [],
            });
          }}
        >
          {collection.items.map((item) => (
            <option key={item.destino.id} value={item.destino.id}>
              {item.destino.nombre}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('Municipio base')} htmlFor={`itinerary-base-${index}`}>
        <select
          id={`itinerary-base-${index}`}
          value={day.baseMunicipioId || ''}
          onChange={(event) =>
            onChange({
              baseMunicipioId: event.target.value || undefined,
            })
          }
        >
          <option value="">{t('Sin base concreta')}</option>
          {municipios.map((municipio) => (
            <option key={municipio.id} value={municipio.id}>
              {municipio.nombre}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('Notas del día')} htmlFor={`itinerary-notes-${index}`}>
        <textarea
          id={`itinerary-notes-${index}`}
          maxLength={1200}
          value={day.notes || ''}
          placeholder={t('Reservas, horarios, ideas…')}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </Field>
      {!!activities.length && (
        <fieldset className="itinerary-activities">
          <legend>{t('Actividades')}</legend>
          <div>
            {activities.map((activity) => {
              const selected =
                day.plannedActivities?.includes(activity.id) ||
                day.plannedActivities?.includes(activity.name) ||
                false;
              return (
                <label key={activity.id}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      onChange({
                        plannedActivities: selected
                          ? day.plannedActivities?.filter(
                              (id) => id !== activity.id && id !== activity.name,
                            )
                          : [...(day.plannedActivities || []), activity.id],
                      })
                    }
                  />
                  <span>{catalogName(activity)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
