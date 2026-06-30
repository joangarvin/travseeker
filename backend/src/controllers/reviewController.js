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
  const { rating, comment } = req.body;
  const review = await reviewService.upsertReview(req.user.id, destinoId, Number(rating), comment);
  res.status(201).json(review);
});

const remove = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.user.id, req.params.destinoId);
  res.json(result);
});

module.exports = { list, upsert, remove };
