import { t, intlLocale } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Bus, Check, Copy, Save, Sparkles, Utensils } from 'lucide-react';
import type { CollectionDetail, Municipio } from '../types';
import {
  calculateBudget,
  calculateTripBudget,
  type Budget,
  type TravelSeason,
  type TravelStyle,
} from '../utils/budgetCalculator';
import { getTripDuration } from '../utils/tripDuration';
import { Button, Field } from './ui';

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

export type SavedBudget = Budget & {
  travelers: number;
  nights: number;
  style: TravelStyle;
  season: TravelSeason;
  municipio?: Municipio;
};

type BudgetEstimatorProps = {
  municipios: Municipio[];
  defaultMunicipioId?: string;
  onSaveToCollection?: (budget: SavedBudget) => void;
  showMunicipioControl?: boolean;
};

type NumberControlProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function NumberControl({ id, label, value, onChange }: NumberControlProps) {
  return (
    <Field label={t(label)} htmlFor={id}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="1"
        max="30"
        step="1"
        value={value}
        onChange={(event) => onChange(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
      />
    </Field>
  );
}

const categories = [
  { key: 'accommodation', label: t('Alojamiento'), icon: BedDouble },
  { key: 'food', label: t('Comida'), icon: Utensils },
  { key: 'transport', label: t('Transporte'), icon: Bus },
  { key: 'activities', label: t('Actividades'), icon: Sparkles },
] as const;

export function BudgetEstimator({
  municipios,
  defaultMunicipioId,
  onSaveToCollection,
  showMunicipioControl = true,
}: BudgetEstimatorProps) {
  const initialMunicipioId = municipios.some((item) => item.id === defaultMunicipioId)
    ? defaultMunicipioId!
    : (municipios[0]?.id ?? '');
  const [travelers, setTravelers] = useState(2);
  const [nights, setNights] = useState(4);
  const [style, setStyle] = useState<TravelStyle>('moderate');
  const [season, setSeason] = useState<TravelSeason>('mid');
  const [selectedMunicipioId, setSelectedMunicipioId] = useState(initialMunicipioId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultMunicipioId && municipios.some((item) => item.id === defaultMunicipioId)) {
      setSelectedMunicipioId(defaultMunicipioId);
    } else if (!municipios.some((item) => item.id === selectedMunicipioId)) {
      setSelectedMunicipioId(initialMunicipioId);
    }
  }, [defaultMunicipioId, initialMunicipioId, municipios]);

  const municipio = municipios.find((item) => item.id === selectedMunicipioId);
  const budget = useMemo(
    () => calculateBudget({ travelers, nights, style, season, preciosString: municipio?.precios }),
    [municipio?.precios, nights, season, style, travelers],
  );
  const rooms = Math.ceil(travelers / 2);
  const days = nights + 1;
  const summary = [
    t('Presupuesto de viaje — {0}', { 0: municipio?.nombre || t('Destino') }),
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
    <section className="budget-estimator" aria-labelledby="budget-estimator-title">
      <div className="budget-estimator__intro">
        <p className="kicker">{t('Ponle números al viaje')}</p>
        <h3 id="budget-estimator-title">{t('Calcula tu presupuesto')}</h3>
        <p>
          {municipio ? t('Partiendo de {0}. ', { 0: municipio.nombre }) : ''}
          {t('Ajusta el viaje y compara el total al instante.')}
        </p>
      </div>

      <div className="budget-estimator__total" aria-live="polite">
        <span>{t('Total estimado')}</span>
        <strong>{euro.format(budget.total)}</strong>
        <small>
          {euro.format(budget.perPerson)} {t('por persona')}
        </small>
      </div>

      <div className="budget-estimator__controls">
        <NumberControl
          id="budget-travelers"
          label={t('Viajeros')}
          value={travelers}
          onChange={setTravelers}
        />
        <NumberControl id="budget-nights" label={t('Noches')} value={nights} onChange={setNights} />
        <Field label={t('Estilo de viaje')} htmlFor="budget-style">
          <select
            id="budget-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as TravelStyle)}
          >
            {Object.entries(styleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Temporada')} htmlFor="budget-season">
          <select
            id="budget-season"
            value={season}
            onChange={(event) => setSeason(event.target.value as TravelSeason)}
          >
            {Object.entries(seasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        {showMunicipioControl && (
          <Field label={t('Municipio base')} htmlFor="budget-municipio">
            <select
              id="budget-municipio"
              value={selectedMunicipioId}
              onChange={(event) => setSelectedMunicipioId(event.target.value)}
            >
              {municipios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="budget-estimator__result">
        <details className="budget-estimator__details">
          <summary>{t('Ver desglose y cálculo')}</summary>
          <div className="budget-breakdown" aria-label={t('Distribución del presupuesto')}>
            {categories.map(({ key, label }) => {
              const percentage = budget.total ? (budget[key] / budget.total) * 100 : 0;
              return (
                <span
                  key={key}
                  role="img"
                  aria-label={`${label}: ${Math.round(percentage)}%`}
                  className={`budget-breakdown__${key}`}
                  style={{ width: `${percentage}%` }}
                  title={`${label}: ${Math.round(percentage)}%`}
                />
              );
            })}
          </div>
          <ul className="budget-estimator__items">
            {categories.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <Icon className={`budget-estimator__icon--${key}`} aria-hidden="true" />
                <div>
                  <b>
                    {t(label)} <span>{Math.round((budget[key] / budget.total) * 100)}%</span>
                  </b>
                  <small>{formulas[key]}</small>
                </div>
                <strong>{euro.format(budget[key])}</strong>
              </li>
            ))}
          </ul>
        </details>
        <div className="budget-estimator__actions">
          <Button variant="secondary" onClick={() => void copySummary()}>
            {copied ? <Check /> : <Copy />} {copied ? t('Resumen copiado') : t('Copiar resumen')}
          </Button>
          {onSaveToCollection && (
            <Button
              onClick={() =>
                onSaveToCollection({ ...budget, travelers, nights, style, season, municipio })
              }
            >
              <Save /> {t('Guardar presupuesto')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function CollectionBudgetSummary({ collection }: { collection: CollectionDetail }) {
  const [style, setStyle] = useState<TravelStyle>('moderate');
  const [season, setSeason] = useState<TravelSeason>('mid');
  const destinations = collection.items.map((item) => item.destino);
  const travelers = collection.travelerCount || 2;
  const duration = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    itineraryLength: collection.itinerary.length,
    destinationCount: destinations.length,
  });
  const overnightPrices = Array.from({ length: duration.nights }, (_, index) => {
    const day = collection.itinerary[index];
    const destination =
      destinations.find((item) => item.id === day?.destinationId) ||
      destinations[index % destinations.length];
    const municipality =
      destination?.municipios?.find((item) => item.id === day?.baseMunicipioId) ||
      destination?.municipios?.[0];
    return municipality?.precios;
  });
  const totals = calculateTripBudget({
    travelers,
    days: duration.days,
    style,
    season,
    overnightPrices,
  });

  if (!destinations.length) return null;

  return (
    <section className="collection-budget" aria-labelledby="collection-budget-title">
      <div>
        <p className="kicker">{t('Presupuesto conjunto')}</p>
        <h2 id="collection-budget-title">{t('El viaje, en números')}</h2>
        <p>
          {t('Calculado una sola vez para la duración real del viaje y sus noches planificadas.')}
        </p>
      </div>
      <div className="collection-budget__controls">
        <Field label={t('Estilo')} htmlFor="collection-budget-style">
          <select
            id="collection-budget-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as TravelStyle)}
          >
            {Object.entries(styleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Temporada')} htmlFor="collection-budget-season">
          <select
            id="collection-budget-season"
            value={season}
            onChange={(event) => setSeason(event.target.value as TravelSeason)}
          >
            {Object.entries(seasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="collection-budget__total" aria-live="polite">
        <small>
          {travelers} {t('viajeros ·')} {duration.days} {duration.days === 1 ? t('día') : t('días')}{' '}
          · {duration.nights} {duration.nights === 1 ? 'noche' : 'noches'}
        </small>
        <strong>{euro.format(totals.total)}</strong>
        <span>
          {euro.format(totals.total / travelers)} {t('por persona')}
        </span>
      </div>
      <div className="collection-budget__legend">
        {categories.map(({ key, label }) => (
          <span key={key}>
            <i className={`budget-breakdown__${key}`} /> {t(label)}{' '}
            <b>{euro.format(totals[key])}</b>
          </span>
        ))}
      </div>
      <p className="collection-budget__method">
        {t(
          'Alojamiento por cada noche real; comida, transporte y actividades por persona y día. Las bases del itinerario determinan el precio de cada noche.',
        )}
      </p>
    </section>
  );
}

export default BudgetEstimator;
