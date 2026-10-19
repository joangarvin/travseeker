import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CloudRain, MapPin, Star, Sun, Users } from 'lucide-react';
import { locale, t } from '../../../i18n';
import type { ClimateMonth, TemperatureUnit } from '../../../types';
import { crowdLabel, crowdLevel, monthSummary, temperature } from '../../../utils/climate';
import { ClimateSky } from './ClimateSky';

type Props = {
  months: ClimateMonth[];
  bestMonths: ClimateMonth[];
  initialMonth: number;
  destinationName: string;
  unit: TemperatureUnit;
};

function degrees(value: number | null, unit: TemperatureUnit) {
  if (value == null || !Number.isFinite(value)) return '—';
  const converted = temperature(value, unit);
  return converted == null ? '—' : `${Math.round(converted)}°`;
}

function MonthCard({
  month,
  recommended,
  active,
  destinationName,
  unit,
  paused,
  onTogglePause,
}: {
  month: ClimateMonth;
  recommended: boolean;
  active: boolean;
  paused: boolean;
  onTogglePause: () => void;
  destinationName: string;
  unit: TemperatureUnit;
}) {
  const crowd = crowdLevel(month.crowd);
  const crowdText = crowd ? t(crowd) : null;
  return (
    <article
      className="climate-story"
      aria-hidden={!active}
      inert={!active}
      aria-label={month.name}
    >
      <div className="climate-story__scene">
        <ClimateSky month={month} active={active} paused={paused} onTogglePause={onTogglePause} />
        <p className="climate-story__place">
          <MapPin aria-hidden="true" />
          {destinationName}
        </p>
        <div className="climate-story__main">
          <div>
            <p className="climate-story__eyebrow" data-recommended={recommended}>
              {recommended && <Star aria-hidden="true" />}
              {recommended ? t('Uno de los mejores meses para ir') : t('Clima habitual')}
            </p>
            <h3 className="climate-story__month">{month.name}</h3>
            <div className="climate-story__weather">
              <strong>{degrees(month.temperatureMaxC, unit)}</strong>
              <small>
                {t('Máxima habitual')} · °{unit}
              </small>
            </div>
            <p className="climate-story__range">
              {t('Mínima habitual')}: {degrees(month.temperatureMinC, unit)}
            </p>
          </div>
          <p className="climate-story__summary">
            {t('En {0} suele haber {1}.', {
              0: locale === 'es' ? month.name.toLocaleLowerCase('es') : month.name,
              1: monthSummary(month),
            })}
          </p>
        </div>
      </div>
      <dl className="climate-story__stats">
        <div>
          <dt>
            <CloudRain aria-hidden="true" />
            {t('Lluvia')}
          </dt>
          <dd>
            {month.rainyDaysPerYear == null
              ? t('Sin datos')
              : t('{0} días', { 0: Math.round(month.rainyDaysPerYear) })}
          </dd>
        </div>
        <div>
          <dt>
            <Users aria-hidden="true" />
            {t('Afluencia')}
          </dt>
          <dd aria-label={crowdLabel(month.crowd, true)}>
            {crowdText
              ? crowdText.charAt(0).toLocaleUpperCase() + crowdText.slice(1)
              : t('Sin datos')}
          </dd>
        </div>
        <div>
          <dt>
            <Sun aria-hidden="true" />
            {t('Sol')}
          </dt>
          <dd>
            {month.sunshineHoursPerDay == null
              ? t('Sin datos')
              : t('{0} h/día', { 0: Math.round(month.sunshineHoursPerDay) })}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ClimateCarousel({
  months,
  bestMonths,
  initialMonth,
  destinationName,
  unit,
}: Props) {
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      months.findIndex((m) => m.month === initialMonth),
    ),
  );
  const [paused, setPaused] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const nextArrow = useRef<HTMLButtonElement>(null);
  const position = useRef(active);
  const target = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    left: number;
    dx: number;
    horizontal: boolean;
  } | null>(null);
  const bestIds = useMemo(() => new Set(bestMonths.map((m) => m.month)), [bestMonths]);
  const selected = months[active];
  const wrap = (index: number) => (index + months.length) % months.length;

  function publish(index: number) {
    if (position.current === index) return;
    position.current = index;
    setActive(index);
  }

  // Native scrolling handles touch momentum, snap points, zoom and vertical page scrolling.
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = new ResizeObserver(() => {
      target.current = null;
      element.scrollTo({ left: position.current * element.clientWidth, behavior: 'instant' });
    });
    resize.observe(element);
    return () => {
      resize.disconnect();
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  function goTo(index: number) {
    const element = viewport.current;
    if (!element || months.length < 2) return;
    const next = wrap(index);
    target.current = next;
    publish(next);
    element.scrollTo({
      left: next * element.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }

  function onScroll() {
    const element = viewport.current;
    if (!element || drag.current?.horizontal) return;
    const index = Math.max(
      0,
      Math.min(months.length - 1, Math.round(element.scrollLeft / element.clientWidth)),
    );
    if (target.current == null) publish(index);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    // Also covers browsers without scrollend; it does not delay input or lock the carousel.
    settleTimer.current = setTimeout(() => {
      target.current = null;
      publish(
        Math.max(
          0,
          Math.min(months.length - 1, Math.round(element.scrollLeft / element.clientWidth)),
        ),
      );
    }, 120);
  }

  function stopProgrammaticScroll() {
    const element = viewport.current;
    const wasProgrammatic = target.current != null;
    target.current = null;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (element && wasProgrammatic)
      element.scrollTo({ left: element.scrollLeft, behavior: 'instant' });
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    stopProgrammaticScroll();
    if (event.pointerType !== 'mouse' || event.button !== 0 || months.length < 2) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: event.currentTarget.scrollLeft,
      dx: 0,
      horizontal: false,
    };
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.x;
    if (!state.horizontal) {
      if (
        Math.abs(event.clientY - state.y) > Math.abs(dx) &&
        Math.abs(event.clientY - state.y) > 8
      ) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      state.horizontal = true;
      event.currentTarget.dataset.dragging = 'true';
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    state.dx = dx;
    event.preventDefault();
    event.currentTarget.scrollLeft = state.left - dx;
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (state.horizontal) {
      const start = Math.round(state.left / event.currentTarget.clientWidth);
      const move =
        event.type !== 'pointercancel' &&
        Math.abs(state.dx) > event.currentTarget.clientWidth * 0.18;
      goTo(
        move ? Math.max(0, Math.min(months.length - 1, start + (state.dx < 0 ? 1 : -1))) : start,
      );
    }
  }

  const nextRecommended = bestMonths.find((m) => m.month > selected.month) || bestMonths[0];
  return (
    <>
      <div
        className="climate-panel"
        role="region"
        aria-roledescription={t('carrusel')}
        aria-label={t('Meses del año')}
      >
        <div
          className="climate-carousel"
          ref={viewport}
          onScroll={onScroll}
          onWheel={stopProgrammaticScroll}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        >
          {months.map((month, index) => (
            <MonthCard
              key={month.month}
              month={month}
              recommended={bestIds.has(month.month)}
              active={index === active}
              destinationName={destinationName}
              unit={unit}
              paused={paused}
              onTogglePause={() => setPaused((value) => !value)}
            />
          ))}
        </div>
        <div
          className="climate-navigation"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              goTo(position.current + (event.key === 'ArrowRight' ? 1 : -1));
            }
          }}
        >
          <button
            type="button"
            aria-label={t('Mes anterior')}
            disabled={months.length < 2}
            onClick={() => goTo(position.current - 1)}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <p>
            <strong>
              {t('{0} · {1} de {2}', { 0: selected.name, 1: active + 1, 2: months.length })}
            </strong>
            {months.length > 1 && <span>{t('Desliza para cambiar de mes')}</span>}
          </p>
          <button
            type="button"
            aria-label={t('Mes siguiente')}
            ref={nextArrow}
            disabled={months.length < 2}
            onClick={() => goTo(position.current + 1)}
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      {nextRecommended && (bestMonths.length > 1 || !bestIds.has(selected.month)) && (
        <button
          type="button"
          className="climate-recommend-next"
          onClick={() => {
            if (bestMonths.length === 1) nextArrow.current?.focus();
            goTo(months.findIndex((m) => m.month === nextRecommended.month));
          }}
        >
          <span>
            {bestIds.has(selected.month)
              ? t('Ver otro mes recomendado')
              : t('Ir a un mes recomendado')}
          </span>
          <span>
            <Star aria-hidden="true" />
          </span>
        </button>
      )}
      <p className="climate-story__caption">
        {t('Ambiente ilustrativo del mes · No es una previsión diaria.')}
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {t('{0} · {1} de {2}', { 0: selected.name, 1: active + 1, 2: months.length })}.{' '}
        {bestIds.has(selected.month) ? t('Uno de los mejores meses para ir') : t('Clima habitual')}.
      </p>
    </>
  );
}
