const test = require('node:test');
const assert = require('node:assert/strict');
const { municipalityKey, buildMunicipalityMerges, remapItinerary } = require('../src/domain/municipalityMerge');

const row = (id, extra = {}) => ({ id, nombre: 'TREVÉLEZ', precios: '', conexiones: '',
  tipoTurismo: '', latitud: null, longitud: null, editorialStatus: 'published', translations: {}, ...extra });

test('normalizes accents, HTML, spacing and confirmed spelling variants', () => {
  assert.equal(municipalityKey(' <b>TRÉVELEZ</b> '), municipalityKey('TREVÉLEZ'));
  assert.equal(municipalityKey('MONDOÑERO'), municipalityKey('MONDOÑEDO'));
  assert.equal(municipalityKey('Santillana de Mar'), municipalityKey('SANTILLANA DEL MAR'));
  assert.notEqual(municipalityKey('ALELLA'), municipalityKey('CALELLA'));
});

test('keeps the complete published record, fills gaps and preserves translation fields', () => {
  const original = [row('a', { tipoTurismo: 'Rural', translations: { en: { tipoTurismo: 'Rural tourism' } } }),
    row('b', { nombre: 'TRÉVELEZ', precios: '65-100€', conexiones: 'Bus',
      translations: { en: { nombre: 'TRÉVELEZ', precios: '45-65€', conexiones: 'Bus service' }, fr: { nombre: 'TRÉVELEZ' } } })];
  const snapshot = structuredClone(original);
  const [plan] = buildMunicipalityMerges(original);
  assert.equal(plan.canonicalId, 'b');
  assert.deepEqual(plan.duplicateIds, ['a']);
  assert.equal(plan.data.tipoTurismo, 'Rural');
  assert.equal(plan.data.translations.en.tipoTurismo, 'Rural tourism');
  assert.equal(plan.data.translations.en.precios, '65-100€');
  assert.equal(plan.data.nombre, 'TREVÉLEZ');
  assert.deepEqual(original, snapshot);
  assert.deepEqual(buildMunicipalityMerges([{ ...original[1], ...plan.data }]), []);
});

test('refuses to merge homonyms with conflicting coordinates', () => {
  assert.throws(() => buildMunicipalityMerges([row('a', { latitud: 40, longitud: -3 }),
    row('b', { latitud: 45, longitud: -3 })]), /Revisión geográfica/);
});

test('updates itinerary municipality IDs without changing other day data', () => {
  const itinerary = [{ destinationId: 'destination', baseMunicipioId: 'duplicate', notes: 'Stay here' },
    { baseMunicipioId: 'other' }];
  assert.deepEqual(remapItinerary(itinerary, new Map([['duplicate', 'canonical']])),
    [{ ...itinerary[0], baseMunicipioId: 'canonical' }, itinerary[1]]);
  assert.equal(itinerary[0].baseMunicipioId, 'duplicate');
});
