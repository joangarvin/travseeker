const { prisma } = require('../config/database');
const { env } = require('../config/env');
const {
  DAILY_FIELDS,
  completeYearPeriod,
  coordinateFingerprint,
  aggregateDailyClimate,
  addCrowdAndRecommendations,
} = require('../domain/climate');

const metrics = { hit: 0, miss: 0, stale: 0, error: 0 };

function climateConfig(config = env.climate, now = new Date()) {
  const years = Number.isInteger(config.years) && config.years > 0 ? Math.min(config.years, 30) : 5;
  const ttlDays = Number.isFinite(config.ttlDays) && config.ttlDays > 0 ? config.ttlDays : 180;
  const timeoutMs = Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : 8000;
  return {
    ...config,
    years,
    ttlDays,
    timeoutMs,
    period: completeYearPeriod(now, years),
  };
}

function buildProviderUrl(latitude, longitude, config) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: config.period.start,
    end_date: config.period.end,
    daily: DAILY_FIELDS.join(','),
    timezone: 'auto',
  });
  if (config.model && config.model !== 'best_match') params.set('models', config.model);
  if (config.apiKey) params.set('apikey', config.apiKey);
  return `${config.baseUrl.replace(/\/$/, '')}?${params}`;
}

function validateProviderResponse(payload) {
  if (!payload || typeof payload !== 'object' || payload.error) {
    throw new Error(payload?.reason || 'El proveedor climático devolvió una respuesta no válida');
  }
  if (!payload.daily || !Array.isArray(payload.daily.time)) {
    throw new Error('El proveedor climático no devolvió datos diarios');
  }
  return payload;
}

async function fetchHistoricalClimate(latitude, longitude, config, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetchImpl(buildProviderUrl(latitude, longitude, config), {
      headers: { Accept: 'application/json', 'User-Agent': 'TravSeeker/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`El proveedor climático respondió con ${response.status}`);
    return validateProviderResponse(await response.json());
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('La consulta climática superó el tiempo de espera');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function dateOnly(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function cacheMatchesRequest(cache, fingerprint, config) {
  return Boolean(cache &&
    cache.coordinateFingerprint === fingerprint &&
    cache.provider === config.provider &&
    cache.model === config.model &&
    dateOnly(cache.periodStart) === config.period.start &&
    dateOnly(cache.periodEnd) === config.period.end);
}

function cacheCanFallback(cache, fingerprint, config) {
  return Boolean(cache &&
    cache.coordinateFingerprint === fingerprint &&
    cache.provider === config.provider &&
    cache.model === config.model);
}

function responseFromSummary({ cache, destination, stale }) {
  const summary = cache.monthlySummary;
  const enriched = addCrowdAndRecommendations(summary.months, destination);
  return {
    destinationId: destination.id,
    source: cache.provider,
    provider: cache.provider,
    model: cache.model,
    period: {
      start: dateOnly(cache.periodStart),
      end: dateOnly(cache.periodEnd),
      sampleYears: summary.sampleYears,
      coverage: summary.coverage,
    },
    stale,
    fetchedAt: cache.fetchedAt.toISOString(),
    months: enriched.months,
    recommendedMonths: enriched.recommendedMonths,
  };
}

function logMetric(event, destinationId, extra = {}) {
  metrics[event] += 1;
  console.info(JSON.stringify({
    type: 'climate-cache',
    event,
    destinationId,
    totals: { ...metrics },
    at: new Date().toISOString(),
    ...extra,
  }));
}

async function getDestinationClimate(destinationId, options = {}) {
  const now = options.now || new Date();
  const config = climateConfig(options.config || env.climate, now);
  const destination = await prisma.destino.findFirst({
    where: { id: destinationId, editorialStatus: 'published' },
    select: {
      id: true,
      latitud: true,
      longitud: true,
      mesesJulioAgosto: true,
      mesesNovAbril: true,
      mesesMayJunSeptOct: true,
    },
  });
  if (!destination) {
    const error = new Error('Destino no encontrado');
    error.status = 404;
    throw error;
  }
  const fingerprint = coordinateFingerprint(destination.latitud, destination.longitud);
  if (!fingerprint) {
    const error = new Error('Este destino no tiene coordenadas válidas para consultar el clima');
    error.status = 422;
    throw error;
  }

  const cached = await prisma.climateCache.findUnique({ where: { destinationId } });
  const sameRequest = cacheMatchesRequest(cached, fingerprint, config);
  if (sameRequest && cached.expiresAt > now) {
    logMetric('hit', destinationId);
    return responseFromSummary({ cache: cached, destination, stale: false });
  }

  logMetric('miss', destinationId, { reason: cached && !sameRequest ? 'cache-key-changed' : 'expired-or-empty' });
  try {
    const payload = await fetchHistoricalClimate(destination.latitud, destination.longitud, config, options.fetchImpl);
    const summary = aggregateDailyClimate(payload.daily, config.period);
    if (!summary.sampleYears || summary.coverage <= 0) {
      throw new Error('El proveedor climático no devolvió observaciones utilizables');
    }
    const fetchedAt = now;
    const expiresAt = new Date(now.getTime() + config.ttlDays * 86_400_000);
    const stored = await prisma.climateCache.upsert({
      where: { destinationId },
      create: {
        destinationId,
        coordinateFingerprint: fingerprint,
        provider: config.provider,
        model: config.model,
        periodStart: new Date(`${config.period.start}T00:00:00.000Z`),
        periodEnd: new Date(`${config.period.end}T00:00:00.000Z`),
        monthlySummary: summary,
        fetchedAt,
        expiresAt,
      },
      update: {
        coordinateFingerprint: fingerprint,
        provider: config.provider,
        model: config.model,
        periodStart: new Date(`${config.period.start}T00:00:00.000Z`),
        periodEnd: new Date(`${config.period.end}T00:00:00.000Z`),
        monthlySummary: summary,
        fetchedAt,
        expiresAt,
      },
    });
    return responseFromSummary({ cache: stored, destination, stale: false });
  } catch (error) {
    logMetric('error', destinationId, { message: String(error?.message || error).slice(0, 180) });
    if (cacheCanFallback(cached, fingerprint, config)) {
      logMetric('stale', destinationId);
      return responseFromSummary({ cache: cached, destination, stale: true });
    }
    const unavailable = new Error('Los datos climáticos no están disponibles ahora mismo');
    unavailable.status = 503;
    unavailable.cause = error;
    throw unavailable;
  }
}

module.exports = {
  climateConfig,
  buildProviderUrl,
  cacheMatchesRequest,
  cacheCanFallback,
  responseFromSummary,
  validateProviderResponse,
  fetchHistoricalClimate,
  getDestinationClimate,
};
