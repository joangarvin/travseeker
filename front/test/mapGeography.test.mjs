import test from 'node:test';
import assert from 'node:assert/strict';
import { groupMapDestinations, clusterMapDestinations } from '../src/pages/map/mapGeography.ts';
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
test('invalid positions are excluded and missing metadata never produces a pile of labels', () => {
  const groups = groupMapDestinations(
    [
      { id: 'none', latitud: null, longitud: 0 },
      { id: 'invalid', latitud: 91, longitud: 0 },
      { id: 'a', latitud: 0, longitud: 0 },
      { id: 'b', latitud: 1, longitud: 1 },
    ],
    4,
  );
  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0].items.map((g) => g.id),
    ['a', 'b'],
  );
});

test('country relation and mixed case codes resolve to one country', () => {
  const groups = groupMapDestinations(
    [
      { id: 'a', countryCode: ' es ', latitud: 40, longitud: 0 },
      { id: 'b', country: { code: 'ES', name: 'España' }, latitud: 41, longitud: 0 },
    ],
    4,
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, 'ES');
  assert.equal(groups[0].items.length, 2);
});
test('nearby photo pins cluster by country, keep selection separate and split when zoomed', () => {
  const items = [...destinations, { id: 'es-3', countryCode: 'ES', latitud: 40.1, longitud: -3 }];
  const project = (lat, lng) => ({ x: lng * 10, y: lat * 10 });
  assert.equal(clusterMapDestinations(items, project, 52, null).length, 2);
  const selected = clusterMapDestinations(items, project, 52, 'es-1');
  assert.equal(selected.find((g) => g.items[0].id === 'es-1').items.length, 1);
  assert.equal(clusterMapDestinations(items, project, 0, null).length, 4);
});

test('spatial clustering preserves every destination across cell boundaries at catalogue scale', () => {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: String(i),
    countryCode: i % 2 ? 'ES' : 'PT',
    latitud: 35 + (i % 100) * 0.05,
    longitud: -10 + Math.floor(i / 100) * 0.05,
  }));
  const groups = clusterMapDestinations(
    items,
    (lat, lng) => ({ x: lng * 100, y: lat * 100 }),
    52,
    '5000',
  );
  const ids = groups.flatMap((g) => g.items.map((d) => d.id));
  assert.equal(ids.length, items.length);
  assert.equal(new Set(ids).size, items.length);
  assert.ok(groups.every((g) => g.items.every((d) => d.countryCode === g.items[0].countryCode)));
  assert.equal(groups.find((g) => g.items[0].id === '5000').items.length, 1);
});
