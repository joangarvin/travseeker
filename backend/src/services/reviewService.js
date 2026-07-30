const { prisma } = require('../config/database');

const REVIEW_USER_SELECT = { id: true, nombre: true, apellidos: true, avatarUrl: true };
const REVIEW_SELECT = {
  id: true, rating: true, comment: true, visitMonth: true, travelParty: true,
  crowdRating: true, valueRating: true, accessRating: true, status: true,
  adminResponse: true, respondedAt: true, createdAt: true, updatedAt: true,
  user: { select: REVIEW_USER_SELECT },
};

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

async function upsertReview(userId, destinoId, payload) {
  const { rating, comment, visitMonth, travelParty, crowdRating, valueRating, accessRating } = payload;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error('La valoración debe estar entre 1 y 5');
    error.status = 400;
    throw error;
  }

  const destino = await prisma.destino.findUnique({ where: { id: destinoId }, select: { id: true } });
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
    status: 'published',
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

async function moderateReview(reviewId, { status, adminResponse }) {
  if (!['published', 'hidden'].includes(status)) {
    const error = new Error('Estado de reseña no válido');
    error.status = 400;
    throw error;
  }
  const response = cleanOptional(adminResponse, 1000);
  return prisma.review.update({
    where: { id: reviewId },
    data: { status, adminResponse: response, respondedAt: response ? new Date() : null },
    select: REVIEW_SELECT,
  });
}

async function deleteReview(userId, destinoId) {
  await prisma.review.deleteMany({ where: { userId, destinoId } });
  return { removed: true };
}

module.exports = { getReviewStats, listReviews, upsertReview, deleteReview, listReviewsForAdmin, moderateReview };
