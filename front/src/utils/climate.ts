import { t, intlLocale } from '../i18n';
import type { ClimateMonth, ClimateMetric, TemperatureUnit } from '../types';

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

export type MonthGrade = 'ideal' | 'good' | 'fair' | 'poor';

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

// Weighted mix of comfortable highs (20–26 °C), few rainy days and low crowds.
export function monthScore(month: ClimateMonth) {
  const parts: [number, number][] = [];
  if (month.temperatureMaxC != null) {
    parts.push([clampScore(100 - Math.max(0, Math.abs(month.temperatureMaxC - 23) - 3) * 9), 0.4]);
  }
  if (month.rainyDaysPerYear != null) {
    parts.push([clampScore(100 - Math.max(0, month.rainyDaysPerYear - 3) * 7), 0.25]);
  }
  if (typeof month.crowd === 'number' && Number.isFinite(month.crowd)) {
    parts.push([clampScore(100 - month.crowd), 0.35]);
  }
  const weight = parts.reduce((sum, [, part]) => sum + part, 0);
  if (!weight) return null;
  return Math.round(parts.reduce((sum, [value, part]) => sum + value * part, 0) / weight);
}

export function monthGrade(score: number | null): MonthGrade | null {
  if (score == null) return null;
  if (score >= 68) return 'ideal';
  if (score >= 55) return 'good';
  if (score >= 42) return 'fair';
  return 'poor';
}

export function monthGradeLabel(grade: MonthGrade) {
  return {
    ideal: t('Ideal'),
    good: t('Buena'),
    fair: t('Regular'),
    poor: t('Poco ideal'),
  }[grade];
}

export function bestClimateMonths(months: ClimateMonth[]) {
  const scored = months
    .map((month) => ({ month, score: monthScore(month) }))
    .filter((item): item is { month: ClimateMonth; score: number } => item.score != null)
    .sort((a, b) => b.score - a.score || a.month.month - b.month.month);
  if (!scored.length) return [];
  const ideal = scored.filter(({ score }) => monthGrade(score) === 'ideal');
  return (ideal.length ? ideal : scored.slice(0, 1))
    .slice(0, 3)
    .map(({ month }) => month)
    .sort((a, b) => a.month - b.month);
}

export function listMonths(names: string[]) {
  if (names.length <= 1) return names[0] || '';
  return t('{0} y {1}', { 0: names.slice(0, -1).join(', '), 1: names.at(-1)! });
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
