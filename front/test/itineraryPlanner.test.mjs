import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planItinerary,
  optimizeItinerary,
  itineraryDistance,
} from '../src/utils/itineraryPlanner.ts';
const destinations = [0, 3, 1, 2].map((longitud, index) => ({
  id: String(index),
  latitud: 40,
  longitud,
  municipios: [{ id: `base-${index}`, latitud: 40, longitud }],
}));
const days = destinations.map((item, index) => ({
  dayNumber: index + 1,
  destinationId: item.id,
  baseMunicipioId: item.municipios[0].id,
  notes: `Nota ${index}`,
  plannedActivities: [`actividad-${index}`, `Texto ${index}`],
}));

test('generation uses consecutive stays, covers every destination and keeps departure', () => {
  const plan = planItinerary(destinations, 10);
  assert.equal(plan.length, 10);
  assert.equal(plan[0].destinationId, destinations[0].id);
  assert.equal(new Set(plan.map((day) => day.destinationId)).size, 4);
  for (const destination of destinations) {
    const indexes = plan.flatMap((day, index) =>
      day.destinationId === destination.id ? [index] : [],
    );
    assert.equal(indexes.at(-1) - indexes[0] + 1, indexes.length);
  }
  assert.deepEqual(
    plan.map((day) => day.dayNumber),
    Array.from({ length: 10 }, (_, index) => index + 1),
  );
});
test('short trips include every stop; empty lists stay empty; duplicate destinations get one stay', () => {
  assert.equal(planItinerary(destinations, 2).length, 4);
  assert.deepEqual(planItinerary([], 5), []);
  assert.equal(planItinerary([destinations[0], destinations[0]], 1).length, 1);
});
test('optimization reduces backtracking while preserving notes, activities and bases', () => {
  const original = structuredClone(days);
  const route = optimizeItinerary(days, destinations);
  assert.ok(itineraryDistance(route, destinations) < itineraryDistance(days, destinations));
  assert.equal(route[0], days[0]);
  assert.deepEqual(
    [...route].sort((a, b) => a.dayNumber - b.dayNumber),
    days,
  );
  assert.deepEqual(days, original);
});
test('optimization keeps consecutive nights together and never lengthens a good route', () => {
  const stays = [days[0], { ...days[0], notes: 'Segunda noche' }, ...days.slice(1)];
  const route = optimizeItinerary(stays, destinations);
  assert.equal(route[1].notes, 'Segunda noche');
  const optimized = optimizeItinerary(route, destinations);
  assert.ok(itineraryDistance(optimized, destinations) <= itineraryDistance(route, destinations));
});
test('missing or invalid coordinates preserve the manual order; valid bases override destination coordinates', () => {
  const missing = destinations.map((item, index) =>
    index === 2 ? { ...item, latitud: null, municipios: [] } : item,
  );
  assert.equal(itineraryDistance(days, missing), undefined);
  assert.deepEqual(optimizeItinerary(days, missing), days);
  const baseOnly = destinations.map((item) => ({ ...item, latitud: 999 }));
  assert.ok(Number.isFinite(itineraryDistance(days, baseOnly)));
});
