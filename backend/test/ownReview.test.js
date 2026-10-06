const test = require('node:test');
const assert = require('node:assert/strict');
const databasePath = require.resolve('../src/config/database');
const prisma = { review: { findUnique: async () => null } };
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: { prisma } };
const { getOwnReview } = require('../src/services/reviewService');

test('la consulta privada limita la reseña al usuario y destino, incluso si está pendiente', async (context) => {
  const pending = { id: 'review-1', status: 'pending', comment: 'Una experiencia pendiente de moderación.' };
  const find = context.mock.method(prisma.review, 'findUnique', async () => pending);
  assert.equal(await getOwnReview('owner-1', 'destination-1'), pending);
  const query = find.mock.calls[0].arguments[0];
  assert.deepEqual(query.where, { userId_destinoId: { userId: 'owner-1', destinoId: 'destination-1' } });
  assert.equal(query.select.status, true);
  assert.equal(query.select.travelParty, true);
});

test('un usuario sin reseña recibe null', async (context) => {
  context.mock.method(prisma.review, 'findUnique', async () => null);
  assert.equal(await getOwnReview('another-user', 'destination-1'), null);
});

test('el controlador usa el usuario autenticado y desactiva la caché privada', async (context) => {
  const { mine } = require('../src/controllers/reviewController');
  const find = context.mock.method(prisma.review, 'findUnique', async () => null);
  const headers = {};
  let body;
  await mine({ user: { id: 'signed-in' }, params: { destinoId: 'destination-1' }, query: { userId: 'other-user' } }, {
    set(name, value) { headers[name] = value; },
    json(value) { body = value; },
  }, (error) => { throw error; });
  assert.equal(find.mock.calls[0].arguments[0].where.userId_destinoId.userId, 'signed-in');
  assert.equal(headers['Cache-Control'], 'private, no-store');
  assert.equal(body, null);
});
