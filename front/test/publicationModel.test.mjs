import assert from 'node:assert/strict';
import test from 'node:test';
import { outcome } from '../src/features/admin/publication/model.ts';
import { creationContext } from '../src/features/admin/publication/creationContext.ts';
test('finishing and exposing are separate decisions and countries can block publication', () => {
  assert.equal(outcome(false, false), 'draft');
  assert.equal(outcome(true, false), 'ready');
  assert.equal(outcome(true, true), 'public');
  assert.equal(outcome(false, true, undefined, true), 'upcoming');
  assert.equal(outcome(true, true, { preparationComplete: true, showOnWebsite: false }), 'blocked');
  assert.equal(outcome(true, true, { preparationComplete: false, showOnWebsite: true }), 'blocked');
});
test('unsupported teasers stay private and a finished hidden record remains ready even under a hidden country', () => {
  assert.equal(outcome(false, true, undefined, false), 'draft');
  assert.equal(outcome(true, false, { preparationComplete: false, showOnWebsite: false }), 'ready');
  assert.equal(outcome(true, true, undefined, false), 'public');
});
test('new records inherit valid session context, with safe defaults when storage is unavailable or malformed', () => {
  const original = globalThis.sessionStorage;
  try {
    globalThis.sessionStorage = {
      getItem: () => JSON.stringify({ country: 'PT', region: 'Norte' }),
    };
    assert.deepEqual(creationContext(), { countryCode: 'PT', region: 'Norte' });
    globalThis.sessionStorage = { getItem: () => '{broken' };
    assert.deepEqual(creationContext(), { countryCode: 'ES', region: '' });
    globalThis.sessionStorage = { getItem: () => JSON.stringify({ country: 'all', region: 5 }) };
    assert.deepEqual(creationContext(), { countryCode: 'ES', region: '' });
  } finally {
    if (original === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = original;
  }
});
