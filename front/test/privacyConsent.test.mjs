import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  CONSENT_LIFETIME_MS,
  parseConsent,
  getConsent,
  hasConsent,
  saveConsent,
  subscribeConsent,
  refreshConsent,
} from '../src/features/privacy/consent.ts';

const now = Date.now();
const valid = {
  analytics: false,
  maps: true,
  version: CONSENT_VERSION,
  savedAt: now,
  expiresAt: now + CONSENT_LIFETIME_MS,
};
test('consent defaults to denied and rejects malformed, expired or stale-version choices', () => {
  assert.equal(hasConsent('analytics'), false);
  assert.equal(hasConsent('maps'), false);
  for (const value of [
    null,
    'invalid',
    '{}',
    JSON.stringify({ ...valid, analytics: 'true' }),
    JSON.stringify({ ...valid, version: 'old' }),
    JSON.stringify({ ...valid, savedAt: now + 1 }),
    JSON.stringify({ ...valid, expiresAt: now }),
  ])
    assert.equal(parseConsent(value, now), null);
  assert.deepEqual(parseConsent(JSON.stringify(valid), now), valid);
});
test('choices are independent; withdrawal removes optional cache and preserves requested preferences', () => {
  const storage = {
    getItem(key) {
      return this[key] || null;
    },
    setItem(key, value) {
      this[key] = value;
    },
    removeItem(key) {
      delete this[key];
    },
  };
  globalThis.localStorage = storage;
  storage['travseeker:route:example'] = 'cached';
  storage.trav_theme = 'dark';
  let updates = 0;
  const unsubscribe = subscribeConsent(() => updates++);
  assert.equal(saveConsent({ analytics: true, maps: false }), true);
  assert.equal(hasConsent('analytics'), true);
  assert.equal(hasConsent('maps'), false);
  assert.equal(storage['travseeker:route:example'], undefined);
  assert.equal(storage.trav_theme, 'dark');
  assert.ok(parseConsent(storage[CONSENT_KEY]));
  saveConsent({ analytics: false, maps: false });
  assert.equal(hasConsent('analytics'), false);
  assert.equal(updates, 2);
  unsubscribe();
});
test('blocked browser storage does not prevent rejection or cause an implicit opt-in', () => {
  globalThis.localStorage = {
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(saveConsent({ analytics: false, maps: false }), false);
  assert.equal(hasConsent('analytics'), false);
  assert.equal(hasConsent('maps'), false);
});
test('expired consent disables features and asks for a new decision', (t) => {
  saveConsent({ analytics: true, maps: true });
  t.mock.method(Date, 'now', () => now + CONSENT_LIFETIME_MS + 100000);
  assert.equal(hasConsent('maps'), false);
  refreshConsent();
  assert.equal(getConsent(), null);
});
