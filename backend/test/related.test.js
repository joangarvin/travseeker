const test = require('node:test');
const assert = require('node:assert/strict');
const { rankRelated, distanceKm } = require('../src/domain/related');

const types = (...ids) => ids.map((id) => ({ id }));
const source = {
  id: 'marina',
  nombre: 'A Mariña',
  presupuesto: 'Medio-Bajo',
  masificacion: 'Nulo',
  latitud: 43.55,
  longitud: -7.3,
  tourismTypes: types('nature', 'beach'),
};

test('prefiere destinos que comparten tipo, presupuesto y cercanía', () => {
  const ranked = rankRelated(source, [
    { id: 'far', nombre: 'Lejos', presupuesto: 'Alto', masificacion: 'Alto', latitud: 28.1, longitud: -15.4, tourismTypes: types('nature', 'beach') },
    { id: 'near', nombre: 'Cerca', presupuesto: 'Medio-Bajo', masificacion: 'Leve', latitud: 43.5, longitud: -6.6, tourismTypes: types('nature', 'beach', 'culture') },
    { id: 'other', nombre: 'Otro', presupuesto: 'Medio-Bajo', masificacion: 'Nulo', latitud: 43.4, longitud: -7.1, tourismTypes: types('city') },
    source,
  ]);
  assert.deepEqual(ranked.map((item) => item.id), ['near', 'far', 'other']);
  assert.deepEqual(ranked[0].match.sharedTypeIds, ['nature', 'beach']);
  assert.equal(ranked[0].match.budgetDelta, 0);
  assert.equal(ranked[0].match.crowdDelta, 1);
  assert.ok(ranked[0].match.affinity > ranked[1].match.affinity);
  assert.equal('latitud' in ranked[0], false);
});

test('tolera datos sin coordenadas ni escalas conocidas', () => {
  const [item] = rankRelated(source, [{ id: 'x', nombre: 'X', presupuesto: '?', tourismTypes: [] }]);
  assert.equal(item.match.distanceKm, null);
  assert.equal(item.match.budgetDelta, null);
  assert.equal(distanceKm(source, { latitud: null, longitud: 1 }), null);
});
