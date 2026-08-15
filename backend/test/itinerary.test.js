const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeItinerary, reconcileItineraryDates } = require('../src/domain/itinerary');

const context = {
  destinationIds: new Set(['destino-a', 'destino-b']),
  municipalityIdsByDestination: new Map([['destino-a', new Set(['municipio-a'])]]),
};

test('normaliza días, fechas, notas y actividades del itinerario', () => {
  assert.deepEqual(normalizeItinerary([
    {
      dayNumber: 9,
      date: '2026-09-03',
      destinationId: 'destino-a',
      baseMunicipioId: 'municipio-a',
      notes: '  Llegar pronto  ',
      plannedActivities: ['playa', 'playa', 'museo'],
    },
  ], context), [{
    dayNumber: 1,
    date: '2026-09-03',
    destinationId: 'destino-a',
    baseMunicipioId: 'municipio-a',
    notes: 'Llegar pronto',
    plannedActivities: ['playa', 'museo'],
  }]);
});

test('rechaza destinos, municipios y fechas que no pertenecen al viaje', () => {
  assert.throws(() => normalizeItinerary([{ destinationId: 'otro' }], context), /no pertenece/);
  assert.throws(() => normalizeItinerary([{ destinationId: 'destino-a', baseMunicipioId: 'otro' }], context), /municipio base/);
  assert.throws(() => normalizeItinerary([{ destinationId: 'destino-a', date: '2026-02-30' }], context), /fecha/);
});

test('ajusta la duración y las fechas sin copiar notas diarias', () => {
  const itinerary = [{
    dayNumber: 1,
    destinationId: 'destino-a',
    baseMunicipioId: 'municipio-a',
    notes: 'Reserva confirmada',
    plannedActivities: ['museo'],
  }];
  const result = reconcileItineraryDates(
    itinerary,
    new Date('2026-09-10T00:00:00.000Z'),
    new Date('2026-09-12T00:00:00.000Z'),
  );

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((day) => day.date), ['2026-09-10', '2026-09-11', '2026-09-12']);
  assert.equal(result[1].destinationId, 'destino-a');
  assert.equal(result[1].notes, undefined);
  assert.deepEqual(result[1].plannedActivities, []);
});

test('elimina los días que quedan fuera de un rango más corto', () => {
  const itinerary = [1, 2, 3, 4].map((dayNumber) => ({ dayNumber, destinationId: 'destino-a' }));
  const result = reconcileItineraryDates(
    itinerary,
    new Date('2026-10-01T00:00:00.000Z'),
    new Date('2026-10-02T00:00:00.000Z'),
  );

  assert.equal(result.length, 2);
  assert.equal(result[1].date, '2026-10-02');
});
