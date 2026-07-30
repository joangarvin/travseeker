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
  res.json(await collectionService.updateItem(req.user.id, req.params.id, req.params.destinoId, req.body));
});

const reorderItems = asyncHandler(async (req, res) => {
  res.json(await collectionService.reorderItems(req.user.id, req.params.id, req.body.orderedDestinoIds));
});

const removeItem = asyncHandler(async (req, res) => {
  res.json(await collectionService.removeItem(req.user.id, req.params.id, req.params.destinoId));
});

const forDestino = asyncHandler(async (req, res) => {
  res.json(await collectionService.getCollectionsForDestino(req.user.id, req.params.destinoId));
});

const share = asyncHandler(async (req, res) => {
  res.json(await collectionService.shareCollection(req.user.id, req.params.id));
});

const stopSharing = asyncHandler(async (req, res) => {
  res.json(await collectionService.stopSharingCollection(req.user.id, req.params.id));
});

const getPublic = asyncHandler(async (req, res) => {
  res.json(await collectionService.getPublicCollection(req.params.shareToken));
});

const addMember = asyncHandler(async (req, res) => {
  res.status(201).json(await collectionService.addMember(req.user.id, req.params.id, req.body));
});

const updateMember = asyncHandler(async (req, res) => {
  res.json(await collectionService.updateMember(req.user.id, req.params.id, req.params.memberId, req.body.role));
});

const removeMember = asyncHandler(async (req, res) => {
  res.json(await collectionService.removeMember(req.user.id, req.params.id, req.params.memberId));
});

module.exports = { list, getOne, create, update, remove, addItem, updateItem, reorderItems, removeItem, forDestino, share, stopSharing, getPublic, addMember, updateMember, removeMember };
