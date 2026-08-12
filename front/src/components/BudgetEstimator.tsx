import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Bus,
  CalendarDays,
  Check,
  Copy,
  Save,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type { Destino, Municipio } from '../types';
import {
  calculateBudget,
  type Budget,
  type TravelSeason,
  type TravelStyle,
} from '../utils/budgetCalculator';
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
  contingencyPercent: number;
  recommendedTotal: number;
  monthlySavings: number;
  municipio?: Municipio;
};

type BudgetEstimatorProps = {
  municipios: Municipio[];
  defaultMunicipioId?: string;
  onSaveToCollection?: (budget: SavedBudget) => void;
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
}: BudgetEstimatorProps) {
  const initialMunicipioId = municipios.some((item) => item.id === defaultMunicipioId)
    ? defaultMunicipioId!
    : (municipios[0]?.id ?? '');
  const [travelers, setTravelers] = useState(2);
  const [nights, setNights] = useState(4);
  const [style, setStyle] = useState<TravelStyle>('moderate');
  const [season, setSeason] = useState<TravelSeason>('mid');
  const [selectedMunicipioId, setSelectedMunicipioId] = useState(initialMunicipioId);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [savingMonths, setSavingMonths] = useState(6);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!municipios.some((item) => item.id === selectedMunicipioId)) {
      setSelectedMunicipioId(initialMunicipioId);
    }
  }, [initialMunicipioId, municipios, selectedMunicipioId]);

  const municipio = municipios.find((item) => item.id === selectedMunicipioId);
  const budget = useMemo(
    () => calculateBudget({ travelers, nights, style, season, preciosString: municipio?.precios }),
    [municipio?.precios, nights, season, style, travelers],
  );
  const rooms = Math.ceil(travelers / 2);
  const days = nights + 1;
  const recommendedTotal = budget.total * (1 + contingencyPercent / 100);
  const monthlySavings = recommendedTotal / savingMonths;
  const largestCategory = categories.reduce((largest, category) =>
    budget[category.key] > budget[largest.key] ? category : largest,
  );
  const largestShare = Math.round((budget[largestCategory.key] / budget.total) * 100);
  const planningInsight =
    season === 'high'
      ? `La temporada alta eleva alojamiento y comida. El margen del ${contingencyPercent}% te da más aire ante cambios de tarifa.`
      : `${largestCategory.label} concentra el ${largestShare}% del cálculo. Es la partida donde una reserva o ajuste tendrá más impacto.`;

  const summary = [
    `Presupuesto de viaje — ${municipio?.nombre || 'Destino'}`,
    `${travelers} viajeros · ${nights} noches · estilo ${styleLabels[style].toLowerCase()} · temporada ${seasonLabels[season].toLowerCase()}`,
    `Alojamiento: ${euro.format(budget.accommodation)}`,
    `Comida: ${euro.format(budget.food)}`,
    `Transporte: ${euro.format(budget.transport)}`,
    `Actividades: ${euro.format(budget.activities)}`,
    `Total estimado: ${euro.format(budget.total)} (${euro.format(budget.perPerson)} por persona)`,
    `Objetivo recomendado con ${contingencyPercent}% de margen: ${euro.format(recommendedTotal)}`,
    `Plan de ahorro: ${euro.format(monthlySavings)} al mes durante ${savingMonths} meses`,
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
        <p>Una estimación orientativa que cambia al instante con tu forma de viajar.</p>
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
      </div>

      <div className="budget-estimator__result" aria-live="polite">
        <div className="budget-estimator__total">
          <span>Total estimado</span>
          <strong>{euro.format(budget.total)}</strong>
          <small>{euro.format(budget.perPerson)} por persona</small>
        </div>
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
      </div>

      <section className="budget-plan" aria-labelledby="budget-plan-title">
        <header>
          <span>
            <ShieldCheck aria-hidden="true" /> Plan con margen
          </span>
          <h4 id="budget-plan-title">Viaja con el presupuesto cubierto</h4>
        </header>
        <div className="budget-plan__settings">
          <fieldset>
            <legend>Margen para imprevistos</legend>
            <div className="budget-plan__segments">
              {[0, 10, 15, 20].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="budget-contingency"
                    value={value}
                    checked={contingencyPercent === value}
                    onChange={() => setContingencyPercent(value)}
                  />
                  <span>{value}%</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Tiempo para ahorrar" htmlFor="budget-saving-months">
            <select
              id="budget-saving-months"
              value={savingMonths}
              onChange={(event) => setSavingMonths(Number(event.target.value))}
            >
              {[3, 6, 9, 12, 18].map((value) => (
                <option key={value} value={value}>
                  {value} meses
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="budget-plan__target" aria-live="polite">
          <div>
            <small>Objetivo recomendado</small>
            <strong>{euro.format(recommendedTotal)}</strong>
            <span>incluye {euro.format(recommendedTotal - budget.total)} de margen</span>
          </div>
          <div>
            <CalendarDays aria-hidden="true" />
            <small>Ahorro mensual</small>
            <strong>{euro.format(monthlySavings)}</strong>
            <span>{euro.format(monthlySavings / travelers)} por persona</span>
          </div>
        </div>
        <p className="budget-plan__insight">
          <Sparkles aria-hidden="true" /> {planningInsight}
        </p>
      </section>

      <div className="budget-estimator__actions">
        <Button variant="secondary" onClick={() => void copySummary()}>
          {copied ? <Check /> : <Copy />} {copied ? 'Resumen copiado' : 'Copiar resumen'}
        </Button>
        {onSaveToCollection && (
          <Button
            onClick={() =>
              onSaveToCollection({
                ...budget,
                travelers,
                nights,
                style,
                season,
                contingencyPercent,
                recommendedTotal,
                monthlySavings,
                municipio,
              })
            }
          >
            <Save /> Guardar presupuesto
          </Button>
        )}
      </div>
    </section>
  );
}

export function CollectionBudgetSummary({ destinations }: { destinations: Destino[] }) {
  const [travelers, setTravelers] = useState(2);
  const [nights, setNights] = useState(4);
  const [includeMargin, setIncludeMargin] = useState(true);
  const totals = useMemo(
    () =>
      destinations.reduce(
        (sum, destination) => {
          const budget = calculateBudget({
            travelers,
            nights,
            preciosString: destination.municipios?.[0]?.precios,
          });
          return {
            total: sum.total + budget.total,
            accommodation: sum.accommodation + budget.accommodation,
            food: sum.food + budget.food,
            transport: sum.transport + budget.transport,
            activities: sum.activities + budget.activities,
          };
        },
        { total: 0, accommodation: 0, food: 0, transport: 0, activities: 0 },
      ),
    [destinations, nights, travelers],
  );

  if (!destinations.length) return null;

  const collectionTarget = totals.total * (includeMargin ? 1.1 : 1);

  return (
    <section className="collection-budget" aria-labelledby="collection-budget-title">
      <div>
        <p className="kicker">Presupuesto conjunto</p>
        <h2 id="collection-budget-title">El viaje, en números</h2>
        <p>Estimación moderada en temporada media para cada parada.</p>
      </div>
      <div className="collection-budget__controls">
        <NumberControl
          id="collection-budget-travelers"
          label="Viajeros"
          value={travelers}
          onChange={setTravelers}
        />
        <NumberControl
          id="collection-budget-nights"
          label="Noches por destino"
          value={nights}
          onChange={setNights}
        />
      </div>
      <div className="collection-budget__total" aria-live="polite">
        <small>
          {destinations.length} {destinations.length === 1 ? 'destino' : 'destinos'} ·{' '}
          {nights * destinations.length} noches
        </small>
        <strong>{euro.format(collectionTarget)}</strong>
        <span>{euro.format(collectionTarget / travelers)} por persona</span>
        <label className="collection-budget__margin">
          <input
            type="checkbox"
            checked={includeMargin}
            onChange={(event) => setIncludeMargin(event.target.checked)}
          />
          <span>
            <ShieldCheck /> Incluir 10% para imprevistos
          </span>
        </label>
      </div>
      <div className="collection-budget__legend">
        {categories.map(({ key, label }) => (
          <span key={key}>
            <i className={`budget-breakdown__${key}`} /> {label} <b>{euro.format(totals[key])}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

export default BudgetEstimator;
