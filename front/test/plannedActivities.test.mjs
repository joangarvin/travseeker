import assert from 'node:assert/strict';
import test from 'node:test';
import {
  plannedActivityLabel,
  tripActivityCatalog,
  plannedActivityHref,
  movePlannedActivity,
} from '../src/utils/plannedActivities.ts';

test('catalog IDs resolve to their localized name and guide experiences remain visible', () => {
  const catalog = [{ id: 'hike', name: 'Senderismo', displayName: 'Hiking' }];
  assert.equal(
    plannedActivityLabel('hike', catalog, (item) => item.displayName),
    'Hiking',
  );
  assert.equal(plannedActivityLabel('Lagos de Covadonga', catalog), 'Lagos de Covadonga');
  assert.equal(plannedActivityLabel('Unknown saved ID', []), 'Unknown saved ID');
});
test('moving an activity preserves notes, destination and other activities without duplicates', () => {
  const days = [
    { destinationId: 'asturias', notes: 'Reserva', plannedActivities: ['hike', 'Lagos'] },
    { destinationId: 'asturias', notes: 'Noche', plannedActivities: ['Lagos'] },
    { destinationId: 'cantabria', plannedActivities: [] },
  ];
  const moved = movePlannedActivity(days, 0, 1, 'Lagos');
  assert.deepEqual(moved[0], { ...days[0], plannedActivities: ['hike'] });
  assert.deepEqual(moved[1], days[1]);
  assert.equal(moved[2], days[2]);
  assert.deepEqual(days[0].plannedActivities, ['hike', 'Lagos']);
  assert.equal(movePlannedActivity(days, 0, 2, 'Lagos'), days);
  assert.equal(movePlannedActivity(days, 0, 1, 'missing'), days);
});

test('new trip day dates stay stable across month boundaries and daylight saving changes', async () => {
  const { addTripDays } = await import('../src/utils/tripDuration.ts');
  assert.equal(addTripDays('2026-10-24', 2), '2026-10-26');
  assert.equal(addTripDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addTripDays('2028-02-28', 1), '2028-02-29');
});

test('municipal plans open their own record and legacy activities keep their destination target', () => {
  const destination = {
    id: 'destination',
    municipios: [{ id: 'town', actividades: [{ id: 'record', nombre: 'Paseo' }] }],
  };
  assert.equal(plannedActivityHref(destination, 'Paseo'), '/municipio/town#ficha-record');
  assert.equal(plannedActivityHref(destination, 'record'), '/municipio/town#ficha-record');
  assert.equal(
    plannedActivityHref(destination, 'Senderismo'),
    '/destino/destination#actividad=Senderismo',
  );
});

test('municipal activity IDs resolve consistently for trips and exports alongside category IDs', () => {
  const catalog = tripActivityCatalog({
    activities: [{ id: 'hike', name: 'Senderismo' }],
    municipios: [{ actividades: [{ id: 'experience', nombre: 'Paseo por el centro' }] }],
  });
  assert.equal(plannedActivityLabel('experience', catalog), 'Paseo por el centro');
  assert.equal(plannedActivityLabel('hike', catalog), 'Senderismo');
  assert.equal(plannedActivityLabel('Legacy name', catalog), 'Legacy name');
});
