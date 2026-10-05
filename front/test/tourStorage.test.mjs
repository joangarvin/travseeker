import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOUR_KEY,
  readTourResult,
  saveTourResult,
  markTourOffered,
  tourWasOffered,
} from '../src/features/tour/tourStorage.ts';
function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}
function setup() {
  globalThis.sessionStorage = storage();
  globalThis.localStorage = storage();
  globalThis.window = { sessionStorage, localStorage };
}
test('tutorial rejection uses tab memory; acceptance persists completion and withdrawal removes it', () => {
  setup();
  assert.equal(readTourResult(false), null);
  markTourOffered();
  assert.equal(tourWasOffered(), true);
  saveTourResult('dismissed', false);
  assert.equal(localStorage.getItem(TOUR_KEY), null);
  assert.equal(readTourResult(false), 'dismissed');
  saveTourResult('completed', true);
  assert.equal(localStorage.getItem(TOUR_KEY), 'completed');
  sessionStorage.removeItem(TOUR_KEY);
  assert.equal(readTourResult(true), 'completed');
  saveTourResult('completed', false);
  assert.equal(localStorage.getItem(TOUR_KEY), null);
  assert.equal(readTourResult(false), 'completed');
});
test('malformed or blocked storage never breaks the tutorial', () => {
  setup();
  localStorage.setItem(TOUR_KEY, 'unexpected');
  assert.equal(readTourResult(true), null);
  const blocked = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
    removeItem() {
      throw Error('blocked');
    },
  };
  globalThis.window = { localStorage: blocked, sessionStorage: blocked };
  globalThis.localStorage = blocked;
  globalThis.sessionStorage = blocked;
  assert.equal(readTourResult(true), null);
  assert.doesNotThrow(() => saveTourResult('dismissed', true));
  assert.doesNotThrow(markTourOffered);
  assert.equal(tourWasOffered(), false);
});
