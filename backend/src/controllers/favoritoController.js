const favoritoService = require('../services/favoritoService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  res.json(await favoritoService.listFavoritos(req.user.id));
});

const ids = asyncHandler(async (req, res) => {
  res.json({ ids: await favoritoService.getFavoriteIds(req.user.id) });
});

const check = asyncHandler(async (req, res) => {
  const isFavorite = await favoritoService.isFavorito(req.user.id, req.params.destinoId);
  res.json({ isFavorite });
});

const add = asyncHandler(async (req, res) => {
  const result = await favoritoService.addFavorito(req.user.id, req.params.destinoId);
  res.status(result.created ? 201 : 200).json(result);
});

const remove = asyncHandler(async (req, res) => {
  await favoritoService.removeFavorito(req.user.id, req.params.destinoId);
  res.json({ removed: true });
});

module.exports = { list, ids, check, add, remove };
