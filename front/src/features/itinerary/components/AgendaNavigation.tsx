import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { intlLocale, t } from '../../../i18n';
import type { CollectionDetail, ItineraryDay } from '../../../types';
import { destinationFor } from '../itineraryModel';
import { formatDayDate } from '../itineraryPresentation';
type Props = {
  days: ItineraryDay[];
  selected: number;
  onSelect: (index: number) => void;
  collection: CollectionDetail;
};
export function AgendaDateStrip({ days, selected, onSelect, collection }: Props) {
  const nav = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = nav.current;
    const button = parent?.querySelectorAll('button')[selected];
    if (parent && button) {
      const left =
        button.offsetLeft - parent.offsetLeft - (parent.clientWidth - button.offsetWidth) / 2;
      parent.scrollTo({ left, behavior: 'instant' });
    }
  }, [selected, days.length]);
  return (
    <div className="agenda-date-strip no-print" ref={nav} aria-label={t('Seleccionar día')}>
      {days.map((day, i) => {
        const date = day.date ? new Date(`${day.date}T00:00:00Z`) : null;
        return (
          <button
            key={i}
            type="button"
            aria-pressed={selected === i}
            tabIndex={selected === i ? 0 : -1}
            aria-label={`${t('Día')} ${i + 1}, ${formatDayDate(day.date)}, ${destinationFor(collection, day.destinationId)?.nombre || t('Destino')}, ${day.plannedActivities?.length || 0} ${t(day.plannedActivities?.length === 1 ? 'actividad' : 'actividades')}`}
            onClick={() => onSelect(i)}
            onKeyDown={(event) => {
              let next = i;
              if (event.key === 'ArrowRight') next = Math.min(days.length - 1, i + 1);
              else if (event.key === 'ArrowLeft') next = Math.max(0, i - 1);
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = days.length - 1;
              else return;
              event.preventDefault();
              onSelect(next);
              nav.current?.querySelectorAll('button')[next]?.focus();
            }}
          >
            <small>
              {date
                ? new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' }).format(
                    date,
                  )
                : t('Día')}
            </small>
            <strong>{date ? date.getUTCDate() : day.dayNumber}</strong>
            <span>
              {date
                ? new Intl.DateTimeFormat(intlLocale, { month: 'short', timeZone: 'UTC' }).format(
                    date,
                  )
                : t('Fecha abierta')}
            </span>
            <i
              aria-hidden="true"
              data-filled={Boolean(day.plannedActivities?.length) || undefined}
            />
          </button>
        );
      })}
    </div>
  );
}
export function AgendaDayArrows({
  days,
  selected,
  onSelect,
}: Pick<Props, 'days' | 'selected' | 'onSelect'>) {
  return (
    <div className="agenda-day-arrows no-print">
      <button disabled={selected === 0} onClick={() => onSelect(selected - 1)}>
        <ArrowLeft aria-hidden="true" />
        {t('Día anterior')}
      </button>
      <span>
        {selected + 1} / {days.length}
      </span>
      <button disabled={selected >= days.length - 1} onClick={() => onSelect(selected + 1)}>
        {t('Día siguiente')}
        <ArrowRight aria-hidden="true" />
      </button>
    </div>
  );
}
export function AgendaRouteSummary({ days, selected, onSelect, collection }: Props) {
  return (
    <article className="trip-agenda__route agenda-route-summary">
      <p className="kicker">{t('Tu recorrido')}</p>
      <h3>{collection.nombre}</h3>
      <ol>
        {days.map((day, index) => {
          if (index > 0 && days[index - 1].destinationId === day.destinationId) return null;
          let end = index;
          while (end + 1 < days.length && days[end + 1].destinationId === day.destinationId) end++;
          return (
            <li key={index} data-current={(selected >= index && selected <= end) || undefined}>
              <button
                onClick={() => onSelect(index)}
                aria-current={selected >= index && selected <= end ? 'step' : undefined}
              >
                <span className="agenda-route-dot" aria-hidden="true" />
                <span>
                  <strong>
                    {destinationFor(collection, day.destinationId)?.nombre || t('Destino')}
                  </strong>
                  <small>
                    {index === end
                      ? t('Día {0}', { 0: index + 1 })
                      : t('Días {0}–{1}', { 0: index + 1, 1: end + 1 })}
                  </small>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
