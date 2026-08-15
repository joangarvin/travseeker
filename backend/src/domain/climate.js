const { createHash } = require('node:crypto');
const { crowdForMonth } = require('./season');

const MONTH_NAMES = Object.freeze([
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]);

const DAILY_FIELDS = Object.freeze([
  'temperature_2m_max',
  'temperature_2m_min',
  'rain_sum',
  'sunshine_duration',
]);

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function validNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function completeYearPeriod(now = new Date(), years = 5) {
  const safeYears = Number.isInteger(years) && years > 0 ? Math.min(years, 30) : 5;
  const endYear = now.getUTCFullYear() - 1;
  const startYear = endYear - safeYears + 1;
  return {
    start: `${startYear}-01-01`,
    end: `${endYear}-12-31`,
    sampleYears: safeYears,
  };
}

function coordinateFingerprint(latitude, longitude) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }
  return createHash('sha256')
    .update(`${latitude.toFixed(6)}:${longitude.toFixed(6)}`)
    .digest('hex');
}

function expectedDaysByMonth(periodStart, periodEnd) {
  const counts = Array(12).fill(0);
  const cursor = new Date(`${periodStart}T00:00:00.000Z`);
  const end = new Date(`${periodEnd}T00:00:00.000Z`);
  while (cursor <= end) {
    counts[cursor.getUTCMonth()] += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return counts;
}

function aggregateDailyClimate(daily, period) {
  if (!daily || !Array.isArray(daily.time)) {
    throw new Error('La respuesta climática no incluye fechas diarias');
  }
  for (const field of DAILY_FIELDS) {
    if (!Array.isArray(daily[field]) || daily[field].length !== daily.time.length) {
      throw new Error(`La respuesta climática no incluye una serie válida de ${field}`);
    }
  }

  const expected = expectedDaysByMonth(period.start, period.end);
  const buckets = Array.from({ length: 12 }, () => ({
    maxTotal: 0,
    maxCount: 0,
    minTotal: 0,
    minCount: 0,
    rainTotal: 0,
    rainCount: 0,
    rainyDays: 0,
    sunHoursTotal: 0,
    sunCount: 0,
    years: new Set(),
    rainYears: new Set(),
  }));
  const observedYears = new Set();

  daily.time.forEach((dateValue, index) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue));
    if (!match) return;
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) return;
    const bucket = buckets[monthIndex];
    const max = validNumber(daily.temperature_2m_max[index]);
    const min = validNumber(daily.temperature_2m_min[index]);
    const rain = validNumber(daily.rain_sum[index]);
    const sunshineSeconds = validNumber(daily.sunshine_duration[index]);
    let hasObservation = false;

    if (max != null) {
      bucket.maxTotal += max;
      bucket.maxCount += 1;
      hasObservation = true;
    }
    if (min != null) {
      bucket.minTotal += min;
      bucket.minCount += 1;
      hasObservation = true;
    }
    if (rain != null) {
      bucket.rainTotal += Math.max(0, rain);
      bucket.rainCount += 1;
      if (rain >= 1) bucket.rainyDays += 1;
      bucket.rainYears.add(year);
      hasObservation = true;
    }
    if (sunshineSeconds != null) {
      bucket.sunHoursTotal += Math.max(0, sunshineSeconds) / 3600;
      bucket.sunCount += 1;
      hasObservation = true;
    }
    if (hasObservation) {
      bucket.years.add(year);
      observedYears.add(year);
    }
  });

  const months = buckets.map((bucket, monthIndex) => {
    const rainYearCount = bucket.rainYears.size;
    const observedValues = bucket.maxCount + bucket.minCount + bucket.rainCount + bucket.sunCount;
    const expectedValues = expected[monthIndex] * DAILY_FIELDS.length;
    return {
      month: monthIndex + 1,
      name: MONTH_NAMES[monthIndex],
      temperatureMaxC: round(bucket.maxTotal / bucket.maxCount),
      temperatureMinC: round(bucket.minTotal / bucket.minCount),
      rainyDaysPerYear: rainYearCount ? round(bucket.rainyDays / rainYearCount) : null,
      precipitationMmPerYear: rainYearCount ? round(bucket.rainTotal / rainYearCount) : null,
      sunshineHoursPerDay: bucket.sunCount ? round(bucket.sunHoursTotal / bucket.sunCount) : null,
      sampleYears: bucket.years.size,
      coverage: expectedValues ? round(observedValues / expectedValues, 3) : 0,
    };
  });
  const expectedTotal = expected.reduce((sum, days) => sum + days, 0) * DAILY_FIELDS.length;
  const observedTotal = buckets.reduce(
    (sum, bucket) => sum + bucket.maxCount + bucket.minCount + bucket.rainCount + bucket.sunCount,
    0,
  );

  return {
    months,
    sampleYears: observedYears.size,
    coverage: expectedTotal ? round(observedTotal / expectedTotal, 3) : 0,
  };
}

function climateComfortScore(month) {
  const max = validNumber(month.temperatureMaxC);
  const min = validNumber(month.temperatureMinC);
  if (max == null && min == null) return null;
  const mean = max != null && min != null ? (max + min) / 2 : (max ?? min);
  return Math.max(0, 100 - Math.abs(mean - 21) * 7);
}

function calculateRecommendationScore(month) {
  const candidates = [
    ['comfort', climateComfortScore(month), 0.45],
    ['rain', validNumber(month.rainyDaysPerYear) == null ? null : Math.max(0, 100 - month.rainyDaysPerYear * 8), 0.2],
    ['sunshine', validNumber(month.sunshineHoursPerDay) == null ? null : Math.min(100, month.sunshineHoursPerDay * 12.5), 0.15],
    ['crowd', validNumber(month.crowd) == null ? null : Math.max(0, 100 - month.crowd), 0.2],
  ];
  const available = candidates.filter(([, value]) => value != null);
  const weight = available.reduce((sum, [, , itemWeight]) => sum + itemWeight, 0);
  if (!weight) return { score: null, components: {} };
  const components = Object.fromEntries(available.map(([key, value]) => [key, round(value)]));
  const score = available.reduce((sum, [, value, itemWeight]) => sum + value * itemWeight, 0) / weight;
  return { score: round(score), components };
}

function addCrowdAndRecommendations(months, destination) {
  const enriched = months.map((month) => {
    const crowd = crowdForMonth(destination, month.month);
    const scored = calculateRecommendationScore({ ...month, crowd });
    return { ...month, crowd, recommendationScore: scored.score, scoreComponents: scored.components };
  });
  const recommendedMonths = enriched
    .filter((month) => month.recommendationScore != null && month.coverage > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore || a.month - b.month)
    .slice(0, 3)
    .map((month, index) => ({
      rank: index + 1,
      month: month.month,
      name: month.name,
      score: month.recommendationScore,
      components: month.scoreComponents,
    }));
  return { months: enriched, recommendedMonths };
}

module.exports = {
  DAILY_FIELDS,
  MONTH_NAMES,
  completeYearPeriod,
  coordinateFingerprint,
  aggregateDailyClimate,
  calculateRecommendationScore,
  addCrowdAndRecommendations,
};
