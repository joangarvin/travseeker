const recommendationService = require('../services/recommendationService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 12);
  const recommendations = await recommendationService.getRecommendations(req.user.id, limit);
  res.json(recommendations);
});

module.exports = { list };
