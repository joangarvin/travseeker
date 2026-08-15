const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../src/config/database');
const {
  aggregateDailyClimate,
  addCrowdAndRecommendations,
  completeYearPeriod,
  coordinateFingerprint,
} = require('../src/domain/climate');
const {
  buildProviderUrl,
  cacheCanFallback,
  cacheMatchesRequest,
  climateConfig,
  getDestinationClimate,
  responseFromSummary,
  validateProviderResponse,
} = require('../src/services/climateService');

function dailyFixture() {
  return {
    time: ['2020-02-28', '2020-02-29', '2021-02-28', '2021-03-01'],
    temperature_2m_max: [20, 22, null, 24],
    temperature_2m_min: [10, 12, 14, null],
    rain_sum: [0.9, 1, 2, null],
    sunshine_duration: [3600, 7200, null, 10800],
  };
}

test('calcula los últimos años naturales completos dinámicamente', () => {
  assert.deepEqual(completeYearPeriod(new Date('2026-08-13T12:00:00Z'), 5), {
    start: '2021-01-01',
    end: '2025-12-31',
    sampleYears: 5,
  });
});

test('agrega años bisiestos, omite nulos y aplica lluvia >= 1 mm', () => {
  const result = aggregateDailyClimate(dailyFixture(), { start: '2020-01-01', end: '2021-12-31' });
  const february = result.months[1];
  const march = result.months[2];

  assert.equal(february.temperatureMaxC, 21);
  assert.equal(february.temperatureMinC, 12);
  assert.equal(february.rainyDaysPerYear, 1);
  assert.equal(february.precipitationMmPerYear, 2);
  assert.equal(february.sunshineHoursPerDay, 1.5);
  assert.equal(february.sampleYears, 2);
  assert.equal(march.temperatureMaxC, 24);
  assert.equal(march.temperatureMinC, null);
  assert.equal(march.sunshineHoursPerDay, 3);
  assert.ok(result.coverage > 0 && result.coverage < 1);
});

test('combina bandas editoriales y devuelve solo tres recomendaciones transparentes', () => {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    name: `Mes ${index + 1}`,
    temperatureMaxC: index === 0 ? 23 : 35,
    temperatureMinC: index === 0 ? 17 : 25,
    rainyDaysPerYear: index === 0 ? 2 : 8,
    precipitationMmPerYear: 20,
    sunshineHoursPerDay: index === 0 ? 8 : 5,
    sampleYears: 5,
    coverage: 1,
  }));
  const result = addCrowdAndRecommendations(months, {
    mesesJulioAgosto: 90,
    mesesMayJunSeptOct: 60,
    mesesNovAbril: 20,
  });

  assert.equal(result.months[0].crowd, 20);
  assert.equal(result.months[6].crowd, 90);
  assert.equal(result.recommendedMonths.length, 3);
  assert.equal(result.recommendedMonths[0].month, 1);
  assert.deepEqual(Object.keys(result.recommendedMonths[0].components).sort(), ['comfort', 'crowd', 'rain', 'sunshine']);
});

test('fingerprint de coordenadas es estable y las coordenadas inválidas no crean clave', () => {
  assert.equal(coordinateFingerprint(41.3874, 2.1686), coordinateFingerprint(41.3874, 2.1686));
  assert.notEqual(coordinateFingerprint(41.3874, 2.1686), coordinateFingerprint(41.3875, 2.1686));
  assert.equal(coordinateFingerprint(91, 2), null);
});

test('configura TTL, años, timeout y endpoint compatible con API key/modelo', () => {
  const config = climateConfig({
    baseUrl: 'https://example.test/archive/', apiKey: 'secret', provider: 'provider',
    model: 'era5', years: 3, ttlDays: 30, timeoutMs: 1234,
  }, new Date('2026-03-02T00:00:00Z'));
  const url = new URL(buildProviderUrl(40, -3, config));

  assert.equal(config.period.start, '2023-01-01');
  assert.equal(config.period.end, '2025-12-31');
  assert.equal(url.searchParams.get('models'), 'era5');
  assert.equal(url.searchParams.get('apikey'), 'secret');
  assert.equal(url.searchParams.get('timezone'), 'auto');
  assert.equal(config.timeoutMs, 1234);
});

test('la clave de caché incluye coordenadas, proveedor, modelo y periodo', () => {
  const cache = {
    coordinateFingerprint: 'coords-v1',
    provider: 'open-meteo',
    model: 'best_match',
    periodStart: new Date('2021-01-01T00:00:00Z'),
    periodEnd: new Date('2025-12-31T00:00:00Z'),
  };
  const config = {
    provider: 'open-meteo',
    model: 'best_match',
    period: { start: '2021-01-01', end: '2025-12-31' },
  };
  assert.equal(cacheMatchesRequest(cache, 'coords-v1', config), true);
  assert.equal(cacheMatchesRequest(cache, 'coords-v2', config), false);
  assert.equal(cacheMatchesRequest(cache, 'coords-v1', { ...config, model: 'era5' }), false);
});

test('el fallback admite un periodo anterior pero no otro origen climático', () => {
  const cache = {
    coordinateFingerprint: 'coords-v1',
    provider: 'open-meteo',
    model: 'era5',
    periodStart: new Date('2020-01-01T00:00:00Z'),
    periodEnd: new Date('2024-12-31T00:00:00Z'),
  };
  const config = {
    provider: 'open-meteo',
    model: 'era5',
    period: { start: '2021-01-01', end: '2025-12-31' },
  };

  assert.equal(cacheMatchesRequest(cache, 'coords-v1', config), false);
  assert.equal(cacheCanFallback(cache, 'coords-v1', config), true);
  assert.equal(cacheCanFallback(cache, 'coords-v2', config), false);
  assert.equal(cacheCanFallback(cache, 'coords-v1', { ...config, provider: 'otro' }), false);
  assert.equal(cacheCanFallback(cache, 'coords-v1', { ...config, model: 'otro' }), false);
});

test('la respuesta identifica destino y fuente sin llamar observaciones al reanálisis', () => {
  const response = responseFromSummary({
    cache: {
      provider: 'open-meteo',
      model: 'era5',
      periodStart: new Date('2021-01-01T00:00:00Z'),
      periodEnd: new Date('2025-12-31T00:00:00Z'),
      monthlySummary: {
        months: [{
          month: 1,
          name: 'Enero',
          temperatureMaxC: 20,
          temperatureMinC: 10,
          rainyDaysPerYear: 3,
          precipitationMmPerYear: 40,
          sunshineHoursPerDay: 6,
          sampleYears: 5,
          coverage: 1,
        }],
        sampleYears: 5,
        coverage: 1,
      },
      fetchedAt: new Date('2026-01-02T12:00:00Z'),
    },
    destination: {
      id: 'destino-1',
      mesesJulioAgosto: 80,
      mesesMayJunSeptOct: 50,
      mesesNovAbril: 20,
    },
    stale: false,
  });

  assert.equal(response.destinationId, 'destino-1');
  assert.equal(response.source, 'open-meteo');
  assert.equal(response.provider, 'open-meteo');
});

test('valida respuestas incompletas del proveedor', () => {
  assert.throws(() => validateProviderResponse({ error: true, reason: 'bad request' }), /bad request/);
  assert.throws(() => validateProviderResponse({ daily: {} }), /datos diarios/);
});

test('devuelve caché stale del periodo anterior si falla el proveedor', async () => {
  const originalDestination = prisma.destino.findFirst;
  const originalCache = prisma.climateCache.findUnique;
  prisma.destino.findFirst = async () => ({
    id: 'destino-stale',
    latitud: 40,
    longitud: -3,
    mesesJulioAgosto: 80,
    mesesMayJunSeptOct: 50,
    mesesNovAbril: 20,
  });
  prisma.climateCache.findUnique = async () => ({
    destinationId: 'destino-stale',
    coordinateFingerprint: coordinateFingerprint(40, -3),
    provider: 'open-meteo',
    model: 'era5',
    periodStart: new Date('2020-01-01T00:00:00Z'),
    periodEnd: new Date('2024-12-31T00:00:00Z'),
    monthlySummary: {
      months: [{
        month: 1,
        name: 'Enero',
        temperatureMaxC: 20,
        temperatureMinC: 10,
        rainyDaysPerYear: 3,
        precipitationMmPerYear: 40,
        sunshineHoursPerDay: 6,
        sampleYears: 5,
        coverage: 1,
      }],
      sampleYears: 5,
      coverage: 1,
    },
    fetchedAt: new Date('2025-01-02T12:00:00Z'),
    expiresAt: new Date('2025-07-01T00:00:00Z'),
  });
  try {
    const response = await getDestinationClimate('destino-stale', {
      now: new Date('2026-01-02T00:00:00Z'),
      config: {
        baseUrl: 'https://example.test',
        apiKey: '',
        provider: 'open-meteo',
        model: 'era5',
        years: 5,
        ttlDays: 180,
        timeoutMs: 8000,
      },
      fetchImpl: async () => { throw new Error('provider down'); },
    });
    assert.equal(response.stale, true);
    assert.equal(response.destinationId, 'destino-stale');
    assert.equal(response.period.end, '2024-12-31');
  } finally {
    prisma.destino.findFirst = originalDestination;
    prisma.climateCache.findUnique = originalCache;
  }
});

test('el servicio consulta exclusivamente destinos publicados', async () => {
  const original = prisma.destino.findFirst;
  let where;
  prisma.destino.findFirst = async (query) => {
    where = query.where;
    return null;
  };
  try {
    await assert.rejects(
      getDestinationClimate('oculto', {
        config: { baseUrl: 'https://example.test', apiKey: '', provider: 'open-meteo', model: 'best_match', years: 5, ttlDays: 180, timeoutMs: 8000 },
      }),
      (error) => error.status === 404,
    );
    assert.deepEqual(where, { id: 'oculto', editorialStatus: 'published' });
  } finally {
    prisma.destino.findFirst = original;
  }
});
