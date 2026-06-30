const collectionService = require('../services/collectionService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  res.json(await collectionService.listCollections(req.user.id));
});

const getOne = asyncHandler(async (req, res) => {
  res.json(await collectionService.getCollection(req.user.id, req.params.id));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await collectionService.createCollection(req.user.id, req.body));
});

const update = asyncHandler(async (req, res) => {
  res.json(await collectionService.updateCollection(req.user.id, req.params.id, req.body));
});

const remove = asyncHandler(async (req, res) => {
  res.json(await collectionService.deleteCollection(req.user.id, req.params.id));
});

const addItem = asyncHandler(async (req, res) => {
  const { destinoId, notas } = req.body;
  if (!destinoId) return res.status(400).json({ error: 'Falta el destino' });
  res.status(201).json(await collectionService.addItem(req.user.id, req.params.id, destinoId, notas));
});

const updateItem = asyncHandler(async (req, res) => {
  res.json(await collectionService.updateItemNotes(req.user.id, req.params.id, req.params.destinoId, req.body.notas));
});

const removeItem = asyncHandler(async (req, res) => {
  res.json(await collectionService.removeItem(req.user.id, req.params.id, req.params.destinoId));
});

const forDestino = asyncHandler(async (req, res) => {
  res.json(await collectionService.getCollectionsForDestino(req.user.id, req.params.destinoId));
});

module.exports = { list, getOne, create, update, remove, addItem, updateItem, removeItem, forDestino };
