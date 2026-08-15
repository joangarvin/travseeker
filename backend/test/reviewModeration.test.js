const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REVIEW_STATUSES,
  buildModerationData,
  reviewResubmissionModeration,
  validateReviewIds,
  validateStatus,
} = require('../src/services/reviewService');

test('acepta todos los estados de moderación premium', () => {
  assert.deepEqual(REVIEW_STATUSES, ['pending', 'published', 'rejected', 'flagged']);
  REVIEW_STATUSES.forEach((status) => assert.equal(validateStatus(status), status));
});

test('rechaza estados desconocidos', () => {
  assert.throws(() => validateStatus('hidden'), /Estado de reseña no válido/);
});

test('valida y conserva una selección batch única', () => {
  assert.deepEqual(validateReviewIds(['review-1', 'review-2']), ['review-1', 'review-2']);
  assert.throws(() => validateReviewIds([]), /Selecciona entre 1 y 100 reseñas/);
  assert.throws(() => validateReviewIds(['review-1', 'review-1']), /no es válida/);
  assert.throws(() => validateReviewIds(['']), /no es válida/);
});

test('un cambio de estado no borra una respuesta existente', () => {
  assert.deepEqual(buildModerationData({ status: 'published' }), { status: 'published' });
  assert.equal(Object.hasOwn(buildModerationData({ status: 'rejected' }), 'adminResponse'), false);
});

test('una respuesta vacía se elimina y limpia su fecha', () => {
  assert.deepEqual(buildModerationData({ adminResponse: '   ' }), {
    adminResponse: null,
    respondedAt: null,
  });
  assert.throws(() => buildModerationData({}), /No hay cambios/);
});

test('guardar una respuesta puede publicar la reseña en la misma operación', () => {
  const data = buildModerationData({
    status: 'published',
    adminResponse: 'Gracias por compartir tu experiencia.',
  });
  assert.equal(data.status, 'published');
  assert.equal(data.adminResponse, 'Gracias por compartir tu experiencia.');
  assert.ok(data.respondedAt instanceof Date);
});

test('reenviar una reseña la devuelve a pendientes y retira la respuesta anterior', () => {
  assert.deepEqual(reviewResubmissionModeration(), {
    status: 'pending',
    adminResponse: null,
    respondedAt: null,
  });
});
