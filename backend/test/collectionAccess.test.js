const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccess } = require('../src/domain/collectionAccess');

test('el propietario puede realizar cualquier acción', () => {
  assert.equal(canAccess('owner', 'owner'), true);
  assert.equal(canAccess('owner', 'editor'), true);
  assert.equal(canAccess('owner', 'viewer'), true);
});

test('el editor modifica contenido pero no administra el viaje', () => {
  assert.equal(canAccess('editor', 'editor'), true);
  assert.equal(canAccess('editor', 'viewer'), true);
  assert.equal(canAccess('editor', 'owner'), false);
});

test('el lector no modifica contenido', () => {
  assert.equal(canAccess('viewer', 'viewer'), true);
  assert.equal(canAccess('viewer', 'editor'), false);
});
