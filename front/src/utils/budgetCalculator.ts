import { stripHtmlToText } from './sanitizeContent';

export type TravelStyle = 'economy' | 'moderate' | 'premium';
export type TravelSeason = 'low' | 'mid' | 'high';

export type BudgetInput = {
  travelers?: number;
  nights?: number;
  style?: TravelStyle;
  season?: TravelSeason;
  preciosString?: string;
};

export type Budget = {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  total: number;
  perPerson: number;
  nightlyHotelRate: number;
};

const FALLBACK_PRICE_RANGE = { min: 35, max: 80 } as const;

const tierFactors: Record<TravelStyle, number> = {
  economy: 0.15,
  moderate: 0.5,
  premium: 0.9,
};

const seasonMultipliers: Record<TravelSeason, number> = {
  low: 0.85,
  mid: 1,
  high: 1.3,
};

const dailyFood: Record<TravelStyle, number> = {
  economy: 18,
  moderate: 35,
  premium: 75,
};

const dailyTransport: Record<TravelStyle, number> = {
  economy: 5,
  moderate: 12,
  premium: 30,
};

const dailyActivities: Record<TravelStyle, number> = {
  economy: 5,
  moderate: 15,
  premium: 40,
};

/** Extracts the first visible price range, ignoring numbers inside HTML tags. */
export function parsePriceRange(preciosString?: string): { min: number; max: number } {
  if (typeof preciosString !== 'string') return { ...FALLBACK_PRICE_RANGE };

  const visibleText = stripHtmlToText(preciosString);
  const values = visibleText
    .match(/\d+(?:[.,]\d+)?/g)
    ?.slice(0, 2)
    .map((value) => Number(value.replace(',', '.')));

  if (
    !values ||
    values.length < 2 ||
    values.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    return { ...FALLBACK_PRICE_RANGE };
  }

  const [first, second] = values;
  return { min: Math.min(first, second), max: Math.max(first, second) };
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

export function calculateBudget(input: BudgetInput = {}): Budget {
  const travelers = positiveInteger(input.travelers, 2);
  const nights = positiveInteger(input.nights, 4);
  const style = input.style && input.style in tierFactors ? input.style : 'moderate';
  const season = input.season && input.season in seasonMultipliers ? input.season : 'mid';
  const { min, max } = parsePriceRange(input.preciosString);
  const rooms = Math.ceil(travelers / 2);
  const days = nights + 1;
  const seasonMultiplier = seasonMultipliers[season];
  const nightlyHotelRate = (min + (max - min) * tierFactors[style]) * seasonMultiplier;
  const accommodation = nightlyHotelRate * rooms * nights;
  const food = dailyFood[style] * seasonMultiplier * travelers * days;
  const transport = dailyTransport[style] * travelers * days;
  const activities = dailyActivities[style] * travelers * days;
  const total = accommodation + food + transport + activities;

  return {
    accommodation,
    food,
    transport,
    activities,
    total,
    perPerson: total / travelers,
    nightlyHotelRate,
  };
}
