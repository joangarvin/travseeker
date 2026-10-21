import assert from 'node:assert/strict';
import test from 'node:test';
import { groupOverviewStays } from '../src/features/collections/overviewModel.ts';

test('overview groups consecutive visits while keeping return visits and actual day indices', () => {
  const days = [
    {
      dayNumber: 1,
      destinationId: 'a',
      notes: 'Keep this note',
      plannedActivities: ['catalog-id', 'Walk'],
    },
    { dayNumber: 2, destinationId: 'a', baseMunicipioId: 'base' },
    { dayNumber: 3, destinationId: 'b' },
    { dayNumber: 4, destinationId: 'a', plannedActivities: ['another-id'] },
  ];
  const before = structuredClone(days);
  const stays = groupOverviewStays(days);
  assert.deepEqual(
    stays.map(({ destinationId, startIndex, endIndex }) => ({
      destinationId,
      startIndex,
      endIndex,
    })),
    [
      { destinationId: 'a', startIndex: 0, endIndex: 1 },
      { destinationId: 'b', startIndex: 2, endIndex: 2 },
      { destinationId: 'a', startIndex: 3, endIndex: 3 },
    ],
  );
  assert.deepEqual(
    stays.flatMap((stay) => stay.days),
    days,
  );
  assert.deepEqual(days, before);
  assert.deepEqual(groupOverviewStays([]), []);
});
