import { t, intlLocale } from '../i18n';
import type { ClimateMonth, ClimateMetric, ClimateResponse, TemperatureUnit } from '../types';

export const MONTH_SHORT = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(intlLocale, { month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, month, 1)),
  ),
);

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
  return converted == null ? t('Sin datos') : `${converted} °${unit}`;
}

export function metricValue(month: ClimateMonth, metric: ClimateMetric) {
  if (metric === 'rain') return month.rainyDaysPerYear;
  if (metric === 'sun') return month.sunshineHoursPerDay;
  return month.crowd;
}

export function metricLabel(value: number | null, metric: ClimateMetric) {
  if (value == null) return t('Sin datos');
  if (metric === 'rain') return t('{0} días de lluvia', { 0: value });
  if (metric === 'sun') return t('{0} h de sol/día', { 0: value });
  return t('{0}% de afluencia', { 0: value });
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
  if (!level) return t('Sin datos de afluencia');
  return includePercentage
    ? t('Afluencia {0} ({1}%)', { 0: t(level), 1: Math.round(value!) })
    : t('Afluencia {0}', { 0: t(level) });
}

export function rainDescription(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return t('lluvia sin datos');
  if (value <= 4) return t('pocos días de lluvia');
  if (value <= 9) return t('lluvia moderada');
  return t('lluvias frecuentes');
}

export function temperatureDescription(month: ClimateMonth) {
  const minimum = month.temperatureMinC;
  const maximum = month.temperatureMaxC;
  if (minimum == null && maximum == null) return t('temperatura sin datos');
  if (minimum != null && minimum >= 20) return t('días calurosos y noches templadas');
  if (maximum != null && maximum >= 28) return t('temperaturas cálidas');
  if (maximum != null && maximum <= 12) return t('temperaturas frescas');
  const mean = minimum != null && maximum != null ? (minimum + maximum) / 2 : (maximum ?? minimum)!;
  if (mean >= 16 && mean <= 24) return t('temperaturas agradables');
  return t('temperaturas suaves');
}

export function monthSummary(month: ClimateMonth) {
  const crowd = crowdLevel(month.crowd);
  const crowdCopy = crowd ? t('afluencia {0}', { 0: t(crowd) }) : t('afluencia sin datos');
  return t('{0}, {1} y {2}', {
    0: temperatureDescription(month),
    1: rainDescription(month.rainyDaysPerYear),
    2: crowdCopy,
  });
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
    { role: 'balance', label: t('Mejor equilibrio'), month: balance },
  ];
  const used = new Set([balance.month]);

  const quiet = usableMonths
    .filter((month) => !used.has(month.month) && Number.isFinite(month.crowd))
    .sort((a, b) => a.crowd! - b.crowd! || a.month - b.month)[0];
  if (quiet) {
    alternatives.push({ role: 'quiet', label: t('Más tranquilo'), month: quiet });
    used.add(quiet.month);
  }

  const warm = usableMonths
    .filter((month) => !used.has(month.month) && Number.isFinite(month.temperatureMaxC))
    .sort((a, b) => b.temperatureMaxC! - a.temperatureMaxC! || a.month - b.month)[0];
  if (warm) alternatives.push({ role: 'warm', label: t('Más cálido'), month: warm });

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
