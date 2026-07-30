const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCollectionOrder } = require('../src/domain/collectionOrder');

test('genera posiciones estables con separación para una lista completa', () => {
  assert.deepEqual(buildCollectionOrder(['a', 'b', 'c'], ['c', 'a', 'b']), [
    { destinoId: 'c', sortOrder: 0 }, { destinoId: 'a', sortOrder: 10 }, { destinoId: 'b', sortOrder: 20 },
  ]);
});

test('rechaza duplicados, destinos ajenos y órdenes parciales', () => {
  assert.throws(() => buildCollectionOrder(['a', 'b'], ['a', 'a']), /no es válido/);
  assert.throws(() => buildCollectionOrder(['a', 'b'], ['a', 'c']), /todos los destinos/);
  assert.throws(() => buildCollectionOrder(['a', 'b'], ['a']), /todos los destinos/);
});
