const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeItinerary } = require('../src/domain/itinerary');

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
