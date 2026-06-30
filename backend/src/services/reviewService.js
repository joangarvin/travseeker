const { prisma } = require('../config/database');

const REVIEW_USER_SELECT = { id: true, nombre: true, apellidos: true, avatarUrl: true };

async function getReviewStats(destinoId) {
  const agg = await prisma.review.aggregate({
    where: { destinoId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { destinoId },
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
    where: { destinoId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: REVIEW_USER_SELECT } },
  });
  return reviews;
}

async function upsertReview(userId, destinoId, rating, comment) {
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

  const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) || null : null;

  const review = await prisma.review.upsert({
    where: { userId_destinoId: { userId, destinoId } },
    update: { rating, comment: cleanComment },
    create: { userId, destinoId, rating, comment: cleanComment },
    include: { user: { select: REVIEW_USER_SELECT } },
  });
  return review;
}

async function deleteReview(userId, destinoId) {
  await prisma.review.deleteMany({ where: { userId, destinoId } });
  return { removed: true };
}

module.exports = { getReviewStats, listReviews, upsertReview, deleteReview };
