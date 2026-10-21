import assert from 'node:assert/strict';
import test from 'node:test';
import {
  destinationDays,
  withoutDestination,
} from '../src/features/collections/destinationsModel.ts';
test('destination day links retain original indices for non-consecutive visits', () => {
  const days = [
    { dayNumber: 1, destinationId: 'a', plannedActivities: ['catalog-id', 'Walk'] },
    { dayNumber: 2, destinationId: 'b' },
    { dayNumber: 3, destinationId: 'a', notes: 'Return' },
  ];
  assert.deepEqual(
    destinationDays(days, 'a').map(({ index, day }) => [index, day.dayNumber]),
    [
      [0, 1],
      [2, 3],
    ],
  );
  assert.deepEqual(destinationDays(days, 'unknown'), []);
});
test('removal mirrors server numbering and preserves all other dates, notes, bases and activity formats', () => {
  const collection = {
    id: 'trip',
    count: 2,
    travelerCount: 3,
    itineraryDays: 3,
    startDate: '2026-08-18',
    items: [
      { destino: { id: 'a', imagen: 'a.jpg' }, notas: 'remove' },
      { destino: { id: 'b', imagen: 'b.jpg' }, notas: 'Keep destination note' },
    ],
    itinerary: [
      { dayNumber: 1, destinationId: 'a' },
      {
        dayNumber: 2,
        destinationId: 'b',
        date: '2026-08-19',
        baseMunicipioId: 'base',
        notes: 'Keep day note',
        plannedActivities: ['id', 'Text'],
      },
      { dayNumber: 3, destinationId: 'a' },
    ],
  };
  const before = structuredClone(collection);
  const result = withoutDestination(collection, 'a');
  assert.deepEqual(collection, before);
  assert.deepEqual(result.itinerary, [{ ...before.itinerary[1], dayNumber: 1 }]);
  assert.deepEqual(result.items, [before.items[1]]);
  assert.equal(result.count, 1);
  assert.equal(result.itineraryDays, 1);
  assert.equal(result.travelerCount, 3);
  assert.deepEqual(result.covers, ['b.jpg']);
});
