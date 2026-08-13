const reviewService = require('../services/reviewService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { destinoId } = req.params;
  const [reviews, stats] = await Promise.all([
    reviewService.listReviews(destinoId),
    reviewService.getReviewStats(destinoId),
  ]);
  res.json({ reviews, stats });
});

const upsert = asyncHandler(async (req, res) => {
  const { destinoId } = req.params;
  const review = await reviewService.upsertReview(req.user.id, destinoId, { ...req.body, rating: Number(req.body.rating) });
  res.status(201).json(review);
});

const listForAdmin = asyncHandler(async (_req, res) => {
  res.json(await reviewService.listReviewsForAdmin());
});

const moderate = asyncHandler(async (req, res) => {
  res.json(await reviewService.moderateReview(req.params.reviewId, req.body));
});

const moderateBatch = asyncHandler(async (req, res) => {
  res.json(await reviewService.moderateReviews(req.body.reviewIds, req.body.status));
});

const removeBatch = asyncHandler(async (req, res) => {
  res.json(await reviewService.deleteReviews(req.body.reviewIds));
});

const remove = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.user.id, req.params.destinoId);
  res.json(result);
});

module.exports = { list, upsert, remove, listForAdmin, moderate, moderateBatch, removeBatch };
