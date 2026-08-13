const { prisma } = require('../config/database');

const REVIEW_USER_SELECT = { id: true, nombre: true, apellidos: true, avatarUrl: true };
const REVIEW_DESTINATION_SELECT = { id: true, nombre: true };
const REVIEW_SELECT = {
  id: true, rating: true, comment: true, visitMonth: true, travelParty: true,
  crowdRating: true, valueRating: true, accessRating: true, status: true,
  adminResponse: true, respondedAt: true, createdAt: true, updatedAt: true,
  user: { select: REVIEW_USER_SELECT },
  destino: { select: REVIEW_DESTINATION_SELECT },
};

const REVIEW_STATUSES = ['pending', 'published', 'rejected', 'flagged'];
const MAX_BATCH_SIZE = 100;

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateStatus(status, { optional = false } = {}) {
  if (optional && status === undefined) return undefined;
  if (!REVIEW_STATUSES.includes(status)) throw badRequest('Estado de reseña no válido');
  return status;
}

function validateReviewIds(reviewIds) {
  if (!Array.isArray(reviewIds) || reviewIds.length === 0 || reviewIds.length > MAX_BATCH_SIZE) {
    throw badRequest(`Selecciona entre 1 y ${MAX_BATCH_SIZE} reseñas`);
  }
  const ids = [...new Set(reviewIds)];
  if (ids.length !== reviewIds.length || ids.some((id) => typeof id !== 'string' || !id.trim())) {
    throw badRequest('La selección de reseñas no es válida');
  }
  return ids;
}

async function getReviewStats(destinoId) {
  const agg = await prisma.review.aggregate({
    where: { destinoId, status: 'published' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { destinoId, status: 'published' },
    _count: { rating: true },
  });

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => { counts[d.rating] = d._count.rating; });

  return {
    average: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
    count: agg._count.rating || 0,
    distribution: counts,
  };
}

async function listReviews(destinoId) {
  const reviews = await prisma.review.findMany({
    where: { destinoId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    select: REVIEW_SELECT,
  });
  return reviews;
}

function optionalRating(value, label) {
  if (value === undefined || value === null || value === '') return null;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error(`${label} debe estar entre 1 y 5`);
    error.status = 400;
    throw error;
  }
  return rating;
}

function cleanOptional(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim().slice(0, max);
  return clean || null;
}

function reviewResubmissionModeration() {
  return { status: 'pending', adminResponse: null, respondedAt: null };
}

async function upsertReview(userId, destinoId, payload) {
  const { rating, comment, visitMonth, travelParty, crowdRating, valueRating, accessRating } = payload;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error('La valoración debe estar entre 1 y 5');
    error.status = 400;
    throw error;
  }

  const destino = await prisma.destino.findFirst({
    where: { id: destinoId, editorialStatus: 'published' },
    select: { id: true },
  });
  if (!destino) {
    const error = new Error('Destino no encontrado');
    error.status = 404;
    throw error;
  }

  const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : '';
  if (cleanComment.length < 20) {
    const error = new Error('El comentario debe tener al menos 20 caracteres');
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    const error = new Error('Verifica tu email antes de firmar el libro de visitas');
    error.status = 403;
    throw error;
  }

  const month = visitMonth === undefined || visitMonth === '' ? null : Number(visitMonth);
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    const error = new Error('El mes de visita no es válido');
    error.status = 400;
    throw error;
  }
  const data = {
    rating,
    comment: cleanComment,
    visitMonth: month,
    travelParty: cleanOptional(travelParty, 40),
    crowdRating: optionalRating(crowdRating, 'La valoración de tranquilidad'),
    valueRating: optionalRating(valueRating, 'La valoración de calidad-precio'),
    accessRating: optionalRating(accessRating, 'La valoración de acceso'),
    ...reviewResubmissionModeration(),
  };
  const review = await prisma.review.upsert({
    where: { userId_destinoId: { userId, destinoId } },
    update: data,
    create: { userId, destinoId, ...data },
    select: REVIEW_SELECT,
  });
  return review;
}

async function listReviewsForAdmin() {
  return prisma.review.findMany({ orderBy: { createdAt: 'desc' }, select: REVIEW_SELECT });
}

function buildModerationData(payload = {}) {
  const hasStatus = Object.prototype.hasOwnProperty.call(payload, 'status');
  const hasResponse = Object.prototype.hasOwnProperty.call(payload, 'adminResponse');
  if (!hasStatus && !hasResponse) throw badRequest('No hay cambios para guardar');

  const data = {};
  if (hasStatus) data.status = validateStatus(payload.status);
  if (hasResponse) {
    const response = cleanOptional(payload.adminResponse, 1000);
    data.adminResponse = response;
    data.respondedAt = response ? new Date() : null;
  }
  return data;
}

async function moderateReview(reviewId, payload = {}) {
  const data = buildModerationData(payload);

  return prisma.review.update({
    where: { id: reviewId },
    data,
    select: REVIEW_SELECT,
  });
}

async function moderateReviews(reviewIds, status) {
  const ids = validateReviewIds(reviewIds);
  const nextStatus = validateStatus(status);
  return prisma.$transaction(async (transaction) => {
    const result = await transaction.review.updateMany({
      where: { id: { in: ids } },
      data: { status: nextStatus },
    });
    if (result.count !== ids.length) throw badRequest('Una o más reseñas ya no existen');
    return { updated: result.count, reviewIds: ids, status: nextStatus };
  });
}

async function deleteReviews(reviewIds) {
  const ids = validateReviewIds(reviewIds);
  return prisma.$transaction(async (transaction) => {
    const result = await transaction.review.deleteMany({ where: { id: { in: ids } } });
    if (result.count !== ids.length) throw badRequest('Una o más reseñas ya no existen');
    return { deleted: result.count, reviewIds: ids };
  });
}

async function deleteReview(userId, destinoId) {
  await prisma.review.deleteMany({ where: { userId, destinoId } });
  return { removed: true };
}

module.exports = {
  REVIEW_STATUSES,
  getReviewStats,
  listReviews,
  upsertReview,
  deleteReview,
  listReviewsForAdmin,
  moderateReview,
  moderateReviews,
  deleteReviews,
  validateReviewIds,
  validateStatus,
  buildModerationData,
  reviewResubmissionModeration,
};
