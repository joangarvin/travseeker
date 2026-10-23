import test from 'node:test';
import assert from 'node:assert/strict';
import { groupMapDestinations } from '../src/pages/map/mapGeography.ts';
const destinations = [
  { id: 'es-1', countryCode: 'ES', latitud: 40, longitud: -3 },
  { id: 'es-2', countryCode: 'ES', latitud: 42, longitud: -1 },
  { id: 'pt-1', countryCode: 'PT', latitud: 39, longitud: -8 },
];
test('distant view groups by country and closer view exposes each destination', () => {
  const distant = groupMapDestinations(destinations, 4);
  assert.deepEqual(
    distant.map((g) => [g.key, g.items.length]),
    [
      ['ES', 2],
      ['PT', 1],
    ],
  );
  assert.equal(distant[0].lat, 41);
  assert.deepEqual(
    groupMapDestinations(destinations, 5).map((g) => g.key),
    ['es-1', 'es-2', 'pt-1'],
  );
  assert.equal(destinations.length, 3);
});
test('invalid positions are excluded and unknown countries are not merged', () => {
  const groups = groupMapDestinations(
    [
      { id: 'none', latitud: null, longitud: 0 },
      { id: 'invalid', latitud: 91, longitud: 0 },
      { id: 'a', latitud: 0, longitud: 0 },
      { id: 'b', latitud: 1, longitud: 1 },
    ],
    4,
  );
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => g.items[0].id),
    ['a', 'b'],
  );
});
