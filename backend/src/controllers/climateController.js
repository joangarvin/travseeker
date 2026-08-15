const climateService = require('../services/climateService');
const { asyncHandler } = require('../utils/asyncHandler');

const getByDestination = asyncHandler(async (req, res) => {
  const climate = await climateService.getDestinationClimate(req.params.id);
  res.set('Cache-Control', 'private, max-age=300');
  res.json(climate);
});

module.exports = { getByDestination };
