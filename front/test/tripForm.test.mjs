import test from 'node:test';
import assert from 'node:assert/strict';
import { validTripForm } from '../src/features/collections/tripForm.ts';

const draft = { nombre: 'Mi viaje', descripcion: '', startDate: '', endDate: '', travelerCount: 2 };
test('trips can be created without dates, but never with a blank name or invalid traveler count', () => {
  assert.equal(validTripForm(draft), true);
  assert.equal(validTripForm({ ...draft, nombre: '  ' }), false);
  for (const travelerCount of ['', 0, -1, 51, 1.5, NaN])
    assert.equal(validTripForm({ ...draft, travelerCount }), false);
  for (const travelerCount of [1, 50])
    assert.equal(validTripForm({ ...draft, travelerCount }), true);
});
test('dates reject an end without a start or reversed ranges, while allowing same-day and cross-month trips', () => {
  assert.equal(validTripForm({ ...draft, endDate: '2026-10-31' }), false);
  assert.equal(validTripForm({ ...draft, startDate: '2026-11-02', endDate: '2026-10-31' }), false);
  assert.equal(validTripForm({ ...draft, startDate: '2026-10-31', endDate: '2026-10-31' }), true);
  assert.equal(validTripForm({ ...draft, startDate: '2026-10-31', endDate: '2026-11-02' }), true);
});
