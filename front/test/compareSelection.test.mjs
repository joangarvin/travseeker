import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCompareIds } from '../src/utils/compareSelection.ts';

test('shared comparisons retain all distinct IDs in URL order', () => {
  assert.deepEqual(normalizeCompareIds(['first', 'second', 'first', 'third', 'fourth', 'fifth']), [
    'first',
    'second',
    'third',
    'fourth',
  ]);
});
test('invalid stored comparison state cannot break the picker', () => {
  for (const value of [null, {}, 'first', 42]) assert.deepEqual(normalizeCompareIds(value), []);
  assert.deepEqual(normalizeCompareIds(['valid-id', 'bad/path', '', {}, 'x'.repeat(101)]), [
    'valid-id',
  ]);
});
