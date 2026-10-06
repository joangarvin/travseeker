import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetLevels, crowdPercentage, lowestScored } from '../src/utils/compareInsights.ts';

test('unknown crowd values never become a zero-crowd recommendation', () => {
  for (const value of [null, undefined, '', ' ', false, true, 'unknown', -1, 101])
    assert.equal(crowdPercentage(value), null);
  assert.equal(crowdPercentage(0), 0);
  assert.equal(crowdPercentage('57'), 57);
  assert.equal(crowdPercentage(100), 100);
});
test('all tied destinations remain candidates and missing scores are excluded', () => {
  assert.deepEqual(
    lowestScored([
      { item: 'missing', score: null },
      { item: 'a', score: 55 },
      { item: 'b', score: 55 },
      { item: 'c', score: 70 },
    ]),
    ['a', 'b'],
  );
  assert.deepEqual(lowestScored([{ item: 'missing', score: undefined }]), []);
  assert.deepEqual(
    lowestScored([
      { item: 'bad', score: NaN },
      { item: 'zero', score: 0 },
    ]),
    ['zero'],
  );
});
test('budget recommendations compare catalog levels in their intended order', () => {
  assert.deepEqual(
    lowestScored(
      ['Alto', 'Medio-Alto', 'Medio-Bajo', 'unknown'].map((item) => ({
        item,
        score: budgetLevels[item],
      })),
    ),
    ['Medio-Bajo'],
  );
});
