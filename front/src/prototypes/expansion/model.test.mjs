import assert from 'node:assert/strict';
import test from 'node:test';
import { countryResult, entryResult, validate, initial } from './model.ts';
test('preparation and finished are independent of visibility', () => {
  const country = { id: 'ES', ready: true, show: true };
  const base = { country: 'ES', kind: 'Destinos' };
  assert.equal(entryResult({ ...base, ready: false, show: false }, [country]), 'draft');
  assert.equal(entryResult({ ...base, ready: false, show: true }, [country]), 'upcoming');
  assert.equal(entryResult({ ...base, ready: true, show: false }, [country]), 'ready');
  assert.equal(entryResult({ ...base, ready: true, show: true }, [country]), 'public');
});
test('country gate prevents exposing children even when country is upcoming', () => {
  for (const country of [
    { id: 'PT', ready: true, show: false },
    { id: 'PT', ready: false, show: true },
  ])
    assert.equal(
      entryResult({ country: 'PT', kind: 'Destinos', ready: true, show: true }, [country]),
      'blocked',
    );
  assert.equal(countryResult({ ready: true, show: false }), 'ready');
});
test('finishing requires useful text and a compatible region; hotels have no teaser', () => {
  const entry = initial.entries[0];
  assert.equal(validate(entry), '');
  assert.ok(validate({ ...entry, country: 'PT' }));
  assert.ok(validate({ ...entry, description: '' }));
  assert.ok(validate({ ...entry, kind: 'Hoteles', ready: false, show: true }));
  assert.equal(validate({ ...entry, kind: 'Hoteles', ready: false, show: false }), '');
});
