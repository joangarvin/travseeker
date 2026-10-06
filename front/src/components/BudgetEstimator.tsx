import { t, intlLocale } from '../i18n';
import { useId, useMemo, useState } from 'react';
import {
  BedDouble,
  Bus,
  Check,
  Copy,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Users,
  Utensils,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import type { CollectionDetail, Municipio } from '../types';
import {
  DEFAULT_TRIP,
  calculateBudget,
  calculateTripBudget,
  type TravelSeason,
  type TravelStyle,
  type TripSettings,
} from '../utils/budgetCalculator';
import { getTripDuration } from '../utils/tripDuration';
import { displayBaseName } from '../features/destinations/baseInsights';
import { Button, Notice } from './ui';

const euro = new Intl.NumberFormat(intlLocale, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const styleLabels: Record<TravelStyle, string> = {
  economy: t('Económico'),
  moderate: t('Moderado'),
  premium: t('Premium'),
};

const seasonLabels: Record<TravelSeason, string> = {
  low: t('Baja'),
  mid: t('Media'),
  high: t('Alta'),
};

const MAX_COUNT = 30;

const categories = [
  { key: 'accommodation', label: t('Alojamiento'), icon: BedDouble },
  { key: 'food', label: t('Comida'), icon: Utensils },
  { key: 'transport', label: t('Transporte'), icon: Bus },
  { key: 'activities', label: t('Actividades'), icon: Sparkles },
] as const;

export const isDefaultTrip = (trip: TripSettings) =>
  (Object.keys(DEFAULT_TRIP) as (keyof TripSettings)[]).every(
    (key) => trip[key] === DEFAULT_TRIP[key],
  );

export function tripLabel({ nights, travelers }: Pick<TripSettings, 'nights' | 'travelers'>) {
  return [
    nights === 1 ? t('1 noche') : t('{0} noches', { 0: nights }),
    travelers === 1 ? t('1 persona') : t('{0} personas', { 0: travelers }),
  ].join(' · ');
}

type StepperProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

function Stepper({
  id,
  label,
  icon: Icon,
  value,
  decreaseLabel,
  increaseLabel,
  onChange,
  min = 1,
  max = MAX_COUNT,
}: StepperProps) {
  return (
    <div className="budget-control" role="group" aria-labelledby={id}>
      <span className="budget-control__label" id={id}>
        <Icon aria-hidden="true" />
        {label}
      </span>
      <div className="budget-stepper">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{value}</output>
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

type OptionsProps<T extends string> = {
  name: string;
  label: string;
  icon: LucideIcon;
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

function Options<T extends string>({
  name,
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: OptionsProps<T>) {
  return (
    <fieldset className="budget-control budget-control--wide">
      <legend className="budget-control__label">
        <Icon aria-hidden="true" />
        {label}
      </legend>
      <div className="budget-options">
        {(Object.entries(options) as [T, string][]).map(([option, optionLabel]) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={option === value}
              onChange={() => onChange(option)}
            />
            <span>{optionLabel}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type BudgetEstimatorProps = {
  id: string;
  trip: TripSettings;
  onChange: (trip: TripSettings) => void;
  municipio?: Municipio;
};

export function BudgetEstimator({ id, trip, onChange, municipio }: BudgetEstimatorProps) {
  const { travelers, nights, style, season } = trip;
  const [copied, setCopied] = useState(false);
  const budget = useMemo(
    () => calculateBudget({ travelers, nights, style, season, preciosString: municipio?.precios }),
    [municipio?.precios, nights, season, style, travelers],
  );
  const update = (patch: Partial<TripSettings>) => onChange({ ...trip, ...patch });
  const rooms = Math.ceil(travelers / 2);
  const days = nights + 1;
  const summary = [
    t('Presupuesto de viaje — {0}', { 0: municipio ? displayBaseName(municipio) : t('Destino') }),
    t('{0} viajeros · {1} noches · estilo {2} · temporada {3}', {
      0: travelers,
      1: nights,
      2: styleLabels[style].toLowerCase(),
      3: seasonLabels[season].toLowerCase(),
    }),
    t('Alojamiento: {0}', { 0: euro.format(budget.accommodation) }),
    t('Comida: {0}', { 0: euro.format(budget.food) }),
    t('Transporte: {0}', { 0: euro.format(budget.transport) }),
    t('Actividades: {0}', { 0: euro.format(budget.activities) }),
    t('Total estimado: {0} ({1} por persona)', {
      0: euro.format(budget.total),
      1: euro.format(budget.perPerson),
    }),
  ].join('\n');

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const formulas: Record<(typeof categories)[number]['key'], string> = {
    accommodation: t('{0} {1} × {2} noches × {3}', {
      0: rooms,
      1: rooms === 1 ? t('habitación') : t('habitaciones'),
      2: nights,
      3: euro.format(budget.nightlyHotelRate),
    }),
    food: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(budget.food / travelers / days),
    }),
    transport: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(budget.transport / travelers / days),
    }),
    activities: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(budget.activities / travelers / days),
    }),
  };

  return (
    <section id={id} className="budget-estimator" aria-labelledby={`${id}-title`}>
      <header className="budget-estimator__head">
        <h4 id={`${id}-title`}>{t('Ajusta tu viaje')}</h4>
        <p>{t('El total y las diferencias entre bases se recalculan al momento.')}</p>
      </header>

      <div className="budget-estimator__controls">
        <Stepper
          id={`${id}-travelers`}
          label={t('Viajeros')}
          icon={Users}
          value={travelers}
          decreaseLabel={t('Un viajero menos')}
          increaseLabel={t('Un viajero más')}
          onChange={(value) => update({ travelers: value })}
        />
        <Stepper
          id={`${id}-nights`}
          label={t('Noches')}
          icon={Moon}
          value={nights}
          decreaseLabel={t('Una noche menos')}
          increaseLabel={t('Una noche más')}
          onChange={(value) => update({ nights: value })}
        />
        <Options
          name={`${id}-style`}
          label={t('Estilo de viaje')}
          icon={WalletCards}
          options={styleLabels}
          value={style}
          onChange={(value) => update({ style: value })}
        />
        <Options
          name={`${id}-season`}
          label={t('Temporada')}
          icon={Sun}
          options={seasonLabels}
          value={season}
          onChange={(value) => update({ season: value })}
        />
      </div>

      <div className="budget-estimator__result">
        <div className="budget-breakdown" aria-label={t('Distribución del presupuesto')}>
          {categories.map(({ key, label }) => {
            const percentage = budget.total ? (budget[key] / budget.total) * 100 : 0;
            return (
              <span
                key={key}
                role="img"
                aria-label={`${label}: ${Math.round(percentage)}%`}
                data-category={key}
                style={{ flexGrow: percentage }}
                title={`${label}: ${Math.round(percentage)}%`}
              />
            );
          })}
        </div>
        <ul className="budget-estimator__items">
          {categories.map(({ key, label, icon: Icon }) => (
            <li key={key} data-category={key}>
              <span className="budget-estimator__icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <b>{label}</b>
                <small>{formulas[key]}</small>
              </span>
              <strong>{euro.format(budget[key])}</strong>
            </li>
          ))}
        </ul>
        <div className="budget-estimator__actions">
          <button type="button" onClick={() => void copySummary()}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? t('Resumen copiado') : t('Copiar resumen')}
          </button>
          {!isDefaultTrip(trip) && (
            <button type="button" onClick={() => onChange(DEFAULT_TRIP)}>
              <RotateCcw aria-hidden="true" />
              {t('Restablecer')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export type TripBudgetScenario = {
  travelers?: number;
  nights?: number;
  style: TravelStyle;
  season: TravelSeason;
};

type CollectionBudgetProps = {
  collection: CollectionDetail;
  scenario?: TripBudgetScenario;
  onChangeScenario?: (scenario: TripBudgetScenario) => void;
  onApply?: (travelers: number, nights: number) => Promise<void>;
  compact?: boolean;
};

export function CollectionBudgetSummary({
  collection,
  scenario,
  onChangeScenario,
  onApply,
  compact = false,
}: CollectionBudgetProps) {
  const budgetId = useId();
  const [localScenario, setLocalScenario] = useState<TripBudgetScenario>({
    style: 'moderate',
    season: 'mid',
  });
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const settings = scenario || localScenario;
  const update = (patch: Partial<TripBudgetScenario>) => {
    (onChangeScenario || setLocalScenario)({ ...settings, ...patch });
    setFeedback('');
    setCopied(false);
  };
  const destinations = collection.items.map((item) => item.destino);
  const duration = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    itineraryLength: collection.itinerary.length,
    destinationCount: destinations.length,
  });
  const travelers = settings.travelers ?? (collection.travelerCount || 2);
  const nights = settings.nights ?? duration.nights;
  const days = nights + 1;
  const { style, season } = settings;
  const overnightPrices = Array.from({ length: nights }, (_, index) => {
    const day = collection.itinerary[index] || collection.itinerary.at(-1);
    const destination =
      destinations.find((item) => item.id === day?.destinationId) ||
      destinations[index % destinations.length];
    return (
      destination?.municipios?.find((item) => item.id === day?.baseMunicipioId) ||
      destination?.municipios?.[0]
    )?.precios;
  });
  const totals = calculateTripBudget({ travelers, days, style, season, overnightPrices });
  const simulated = travelers !== (collection.travelerCount || 2) || nights !== duration.nights;
  const rooms = Math.ceil(travelers / 2);
  const formulas = {
    accommodation:
      t('{0} {1} × {2} noches × {3}', {
        0: rooms,
        1: rooms === 1 ? t('habitación') : t('habitaciones'),
        2: nights,
        3: euro.format(totals.nightlyHotelRate),
      }) +
      ' · ' +
      t('tarifa media'),
    food: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(totals.food / travelers / days),
    }),
    transport: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(totals.transport / travelers / days),
    }),
    activities: t('{0} personas × {1} días × {2}/día', {
      0: travelers,
      1: days,
      2: euro.format(totals.activities / travelers / days),
    }),
  };
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(
        [
          collection.nombre,
          tripLabel({ travelers, nights }),
          ...categories.map(
            ({ key, label }) => `${label}: ${euro.format(totals[key])} (${formulas[key]})`,
          ),
          t('Total estimado: {0} ({1} por persona)', {
            0: euro.format(totals.total),
            1: euro.format(totals.perPerson),
          }),
        ].join('\n'),
      );
      setCopied(true);
      setFeedback('');
    } catch {
      setFeedback(t('No se pudo copiar. Comprueba los permisos del navegador.'));
    }
  };
  const apply = async () => {
    if (!onApply) return;
    setSaving(true);
    setFeedback('');
    try {
      await onApply(travelers, nights);
      update({ travelers: undefined, nights: undefined });
      setFeedback(t('Viajeros y duración guardados'));
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : t('No se pudo guardar el presupuesto'));
    } finally {
      setSaving(false);
    }
  };
  if (!destinations.length) return null;
  return (
    <section
      className={`trip-budget ${compact ? 'trip-budget--compact' : ''}`}
      aria-labelledby={`${budgetId}-title`}
    >
      <header className="trip-budget__total">
        <div>
          <p className="kicker" id={`${budgetId}-title`}>
            {t('Estimación')} · {tripLabel({ travelers, nights })}
            {simulated ? ' · ' + t('Simulación') : ''}
          </p>
          <strong aria-live="polite">{euro.format(totals.total)}</strong>
          <small>
            {euro.format(totals.perPerson)} {t('por persona')}
          </small>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${budgetId}-calculator`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('Cerrar') : t('Ajustar')}
        </button>
      </header>
      <div
        id={`${budgetId}-calculator`}
        hidden={!expanded}
        className="trip-budget__calculator budget-estimator"
      >
        <header className="budget-estimator__head">
          <h4>{t('Ajusta tu viaje')}</h4>
          <p>
            {t(
              'El total se recalcula al momento. Los cambios son una simulación hasta guardarlos.',
            )}
          </p>
        </header>
        <div className="budget-estimator__controls">
          <Stepper
            id={`${budgetId}-travelers`}
            label={t('Viajeros')}
            icon={Users}
            value={travelers}
            decreaseLabel={t('Un viajero menos')}
            increaseLabel={t('Un viajero más')}
            onChange={(value) => update({ travelers: value })}
          />
          <Stepper
            id={`${budgetId}-nights`}
            label={t('Noches')}
            icon={Moon}
            value={nights}
            min={0}
            max={365}
            decreaseLabel={t('Una noche menos')}
            increaseLabel={t('Una noche más')}
            onChange={(value) => update({ nights: value })}
          />
          <Options
            name={`${budgetId}-style`}
            label={t('Estilo de viaje')}
            icon={WalletCards}
            options={styleLabels}
            value={style}
            onChange={(value) => update({ style: value })}
          />
          <Options
            name={`${budgetId}-season`}
            label={t('Temporada')}
            icon={Sun}
            options={seasonLabels}
            value={season}
            onChange={(value) => update({ season: value })}
          />
        </div>
        <div className="budget-estimator__result">
          <div className="budget-breakdown" aria-label={t('Distribución del presupuesto')}>
            {categories.map(({ key, label }) => (
              <span
                key={key}
                role="img"
                aria-label={`${label}: ${euro.format(totals[key])}`}
                data-category={key}
                style={{ flexGrow: totals[key], display: totals[key] ? undefined : 'none' }}
              />
            ))}
          </div>
          <ul className="budget-estimator__items">
            {categories.map(({ key, label, icon: Icon }) => (
              <li key={key} data-category={key}>
                <span className="budget-estimator__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <b>{label}</b>
                  <small>{formulas[key]}</small>
                </span>
                <strong>{euro.format(totals[key])}</strong>
              </li>
            ))}
          </ul>
          <div className="budget-estimator__actions">
            <button type="button" onClick={() => void copySummary()}>
              <Copy />
              {copied ? t('Resumen copiado') : t('Copiar resumen')}
            </button>
            <button
              type="button"
              onClick={() => {
                (onChangeScenario || setLocalScenario)({ style: 'moderate', season: 'mid' });
                setFeedback('');
              }}
            >
              <RotateCcw />
              {t('Restablecer')}
            </button>
          </div>
        </div>
        <p className="trip-budget__method">
          {t(
            'Alojamiento por cada noche real; comida, transporte y actividades por persona y día. Las bases del itinerario determinan el precio de cada noche.',
          )}
        </p>
        {simulated && onApply && (
          <Button loading={saving} onClick={() => void apply()}>
            {t('Guardar viajeros y noches en el viaje')}
          </Button>
        )}
        {feedback && <Notice>{feedback}</Notice>}
      </div>
    </section>
  );
}

export default BudgetEstimator;
