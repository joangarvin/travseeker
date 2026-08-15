import type { ClimateMonth, ClimateMetric, ClimateResponse, TemperatureUnit } from '../types';

export const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export function celsiusToFahrenheit(value: number) {
  return (value * 9) / 5 + 32;
}

export function temperature(value: number | null, unit: TemperatureUnit) {
  if (value == null) return null;
  const converted = unit === 'F' ? celsiusToFahrenheit(value) : value;
  return Math.round(converted * 10) / 10;
}

export function temperatureLabel(value: number | null, unit: TemperatureUnit) {
  const converted = temperature(value, unit);
  return converted == null ? 'Sin datos' : `${converted} °${unit}`;
}

export function metricValue(month: ClimateMonth, metric: ClimateMetric) {
  if (metric === 'rain') return month.rainyDaysPerYear;
  if (metric === 'sun') return month.sunshineHoursPerDay;
  return month.crowd;
}

export function metricLabel(value: number | null, metric: ClimateMetric) {
  if (value == null) return 'Sin datos';
  if (metric === 'rain') return `${value} días de lluvia`;
  if (metric === 'sun') return `${value} h de sol/día`;
  return `${value}% de afluencia`;
}

export type CrowdLevel = 'baja' | 'media' | 'alta';

export function crowdLevel(value: number | null | undefined): CrowdLevel | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value <= 35) return 'baja';
  if (value <= 65) return 'media';
  return 'alta';
}

export function crowdLabel(value: number | null | undefined, includePercentage = false) {
  const level = crowdLevel(value);
  if (!level) return 'Sin datos de afluencia';
  return includePercentage ? `Afluencia ${level} (${Math.round(value!)}%)` : `Afluencia ${level}`;
}

export function rainDescription(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'lluvia sin datos';
  if (value <= 4) return 'pocos días de lluvia';
  if (value <= 9) return 'lluvia moderada';
  return 'lluvias frecuentes';
}

export function temperatureDescription(month: ClimateMonth) {
  const minimum = month.temperatureMinC;
  const maximum = month.temperatureMaxC;
  if (minimum == null && maximum == null) return 'temperatura sin datos';
  if (minimum != null && minimum >= 20) return 'días calurosos y noches templadas';
  if (maximum != null && maximum >= 28) return 'temperaturas cálidas';
  if (maximum != null && maximum <= 12) return 'temperaturas frescas';
  const mean = minimum != null && maximum != null ? (minimum + maximum) / 2 : (maximum ?? minimum)!;
  if (mean >= 16 && mean <= 24) return 'temperaturas agradables';
  return 'temperaturas suaves';
}

export function monthSummary(month: ClimateMonth) {
  const crowd = crowdLevel(month.crowd);
  const crowdCopy = crowd ? `afluencia ${crowd}` : 'afluencia sin datos';
  return `${temperatureDescription(month)}, ${rainDescription(month.rainyDaysPerYear)} y ${crowdCopy}`;
}

export type ClimateAlternative = {
  role: 'balance' | 'quiet' | 'warm';
  label: string;
  month: ClimateMonth;
};

export function buildClimateAlternatives(
  months: ClimateMonth[],
  recommendedMonths: ClimateResponse['recommendedMonths'],
): ClimateAlternative[] {
  const usableMonths = months.filter((month) => month && Number.isInteger(month.month));
  if (!usableMonths.length) return [];

  const byNumber = new Map(usableMonths.map((month) => [month.month, month]));
  const recommended = recommendedMonths
    .map((item) => byNumber.get(item.month))
    .filter((month): month is ClimateMonth => Boolean(month));
  const scoredFallback = [...usableMonths].sort(
    (a, b) => (b.recommendationScore ?? -1) - (a.recommendationScore ?? -1),
  );
  const balance = recommended[0] ?? scoredFallback[0];
  const alternatives: ClimateAlternative[] = [
    { role: 'balance', label: 'Mejor equilibrio', month: balance },
  ];
  const used = new Set([balance.month]);

  const quiet = usableMonths
    .filter((month) => !used.has(month.month) && Number.isFinite(month.crowd))
    .sort((a, b) => a.crowd! - b.crowd! || a.month - b.month)[0];
  if (quiet) {
    alternatives.push({ role: 'quiet', label: 'Más tranquilo', month: quiet });
    used.add(quiet.month);
  }

  const warm = usableMonths
    .filter((month) => !used.has(month.month) && Number.isFinite(month.temperatureMaxC))
    .sort((a, b) => b.temperatureMaxC! - a.temperatureMaxC! || a.month - b.month)[0];
  if (warm) alternatives.push({ role: 'warm', label: 'Más cálido', month: warm });

  return alternatives;
}

export function safeStoredTemperatureUnit(
  storage: Pick<Storage, 'getItem'> | null = typeof window === 'undefined'
    ? null
    : window.localStorage,
): TemperatureUnit {
  try {
    return storage?.getItem('travseeker-temperature-unit') === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

export function storeTemperatureUnit(
  unit: TemperatureUnit,
  storage: Pick<Storage, 'setItem'> | null = typeof window === 'undefined'
    ? null
    : window.localStorage,
) {
  try {
    storage?.setItem('travseeker-temperature-unit', unit);
  } catch {
    // Private browsing and blocked storage must not break the climate controls.
  }
}
