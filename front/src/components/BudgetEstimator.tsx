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

const euro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const styleLabels: Record<TravelStyle, string> = {
  economy: 'Económico',
  moderate: 'Moderado',
  premium: 'Premium',
};

const seasonLabels: Record<TravelSeason, string> = {
  low: 'Baja',
  mid: 'Media',
  high: 'Alta',
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
    <Field label={label} htmlFor={id}>
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
  { key: 'accommodation', label: 'Alojamiento', icon: BedDouble },
  { key: 'food', label: 'Comida', icon: Utensils },
  { key: 'transport', label: 'Transporte', icon: Bus },
  { key: 'activities', label: 'Actividades', icon: Sparkles },
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
    `Presupuesto de viaje — ${municipio?.nombre || 'Destino'}`,
    `${travelers} viajeros · ${nights} noches · estilo ${styleLabels[style].toLowerCase()} · temporada ${seasonLabels[season].toLowerCase()}`,
    `Alojamiento: ${euro.format(budget.accommodation)}`,
    `Comida: ${euro.format(budget.food)}`,
    `Transporte: ${euro.format(budget.transport)}`,
    `Actividades: ${euro.format(budget.activities)}`,
    `Total estimado: ${euro.format(budget.total)} (${euro.format(budget.perPerson)} por persona)`,
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
    accommodation: `${rooms} ${rooms === 1 ? 'habitación' : 'habitaciones'} × ${nights} noches × ${euro.format(budget.nightlyHotelRate)}`,
    food: `${travelers} personas × ${days} días × ${euro.format(budget.food / travelers / days)}/día`,
    transport: `${travelers} personas × ${days} días × ${euro.format(budget.transport / travelers / days)}/día`,
    activities: `${travelers} personas × ${days} días × ${euro.format(budget.activities / travelers / days)}/día`,
  };

  return (
    <section className="budget-estimator" aria-labelledby="budget-estimator-title">
      <div className="budget-estimator__intro">
        <p className="kicker">Ponle números al viaje</p>
        <h3 id="budget-estimator-title">Calcula tu presupuesto</h3>
        <p>
          {municipio ? `Partiendo de ${municipio.nombre}. ` : ''}Ajusta el viaje y compara el total
          al instante.
        </p>
      </div>

      <div className="budget-estimator__total" aria-live="polite">
        <span>Total estimado</span>
        <strong>{euro.format(budget.total)}</strong>
        <small>{euro.format(budget.perPerson)} por persona</small>
      </div>

      <div className="budget-estimator__controls">
        <NumberControl
          id="budget-travelers"
          label="Viajeros"
          value={travelers}
          onChange={setTravelers}
        />
        <NumberControl id="budget-nights" label="Noches" value={nights} onChange={setNights} />
        <Field label="Estilo de viaje" htmlFor="budget-style">
          <select
            id="budget-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as TravelStyle)}
          >
            {Object.entries(styleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Temporada" htmlFor="budget-season">
          <select
            id="budget-season"
            value={season}
            onChange={(event) => setSeason(event.target.value as TravelSeason)}
          >
            {Object.entries(seasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {showMunicipioControl && (
          <Field label="Municipio base" htmlFor="budget-municipio">
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
          <summary>Ver desglose y cálculo</summary>
          <div className="budget-breakdown" aria-label="Distribución del presupuesto">
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
                    {label} <span>{Math.round((budget[key] / budget.total) * 100)}%</span>
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
            {copied ? <Check /> : <Copy />} {copied ? 'Resumen copiado' : 'Copiar resumen'}
          </Button>
          {onSaveToCollection && (
            <Button
              onClick={() =>
                onSaveToCollection({ ...budget, travelers, nights, style, season, municipio })
              }
            >
              <Save /> Guardar presupuesto
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
        <p className="kicker">Presupuesto conjunto</p>
        <h2 id="collection-budget-title">El viaje, en números</h2>
        <p>Calculado una sola vez para la duración real del viaje y sus noches planificadas.</p>
      </div>
      <div className="collection-budget__controls">
        <Field label="Estilo" htmlFor="collection-budget-style">
          <select
            id="collection-budget-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as TravelStyle)}
          >
            {Object.entries(styleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Temporada" htmlFor="collection-budget-season">
          <select
            id="collection-budget-season"
            value={season}
            onChange={(event) => setSeason(event.target.value as TravelSeason)}
          >
            {Object.entries(seasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="collection-budget__total" aria-live="polite">
        <small>
          {travelers} viajeros · {duration.days} {duration.days === 1 ? 'día' : 'días'} ·{' '}
          {duration.nights} {duration.nights === 1 ? 'noche' : 'noches'}
        </small>
        <strong>{euro.format(totals.total)}</strong>
        <span>{euro.format(totals.total / travelers)} por persona</span>
      </div>
      <div className="collection-budget__legend">
        {categories.map(({ key, label }) => (
          <span key={key}>
            <i className={`budget-breakdown__${key}`} /> {label} <b>{euro.format(totals[key])}</b>
          </span>
        ))}
      </div>
      <p className="collection-budget__method">
        Alojamiento por cada noche real; comida, transporte y actividades por persona y día. Las
        bases del itinerario determinan el precio de cada noche.
      </p>
    </section>
  );
}

export default BudgetEstimator;
