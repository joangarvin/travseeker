const destinoService = require('../services/destinoService');
const { asyncHandler } = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const destinos = await destinoService.searchDestinos(req.query);
  res.json(destinos);
});

const getById = asyncHandler(async (req, res) => {
  const destino = await destinoService.getDestinoById(req.params.id);
  if (!destino) return res.status(404).json({ error: 'Destino no encontrado' });
  res.json(destino);
});

const getRelacionados = asyncHandler(async (req, res) => {
  const relacionados = await destinoService.getRelacionados(req.params.id);
  if (relacionados === null) return res.status(404).json({ error: 'Destino no encontrado' });
  res.json(relacionados);
});

const getDestacados = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12);
  const destacados = await destinoService.getDestacados(limit);
  res.json(destacados);
});

const getMapa = asyncHandler(async (req, res) => {
  const destinos = await destinoService.getMapaDestinos(req.query);
  res.json(destinos);
});

const compare = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const destinos = await destinoService.compareDestinos(ids);
  res.json(destinos);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await destinoService.getStats();
  res.json(stats);
});

module.exports = {
  search,
  getById,
  getRelacionados,
  getDestacados,
  getMapa,
  compare,
  getStats,
};
