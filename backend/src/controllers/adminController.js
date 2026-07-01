const adminService = require('../services/adminService');
const { asyncHandler } = require('../utils/asyncHandler');

const listDestinos = asyncHandler(async (_req, res) => {
  res.json(await adminService.listDestinos());
});

const createDestino = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createDestino(req.body));
});

const updateDestino = asyncHandler(async (req, res) => {
  res.json(await adminService.updateDestino(req.params.destinoId, req.body));
});

const deleteDestino = asyncHandler(async (req, res) => {
  res.json(await adminService.deleteDestino(req.params.destinoId));
});

const createMunicipio = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createMunicipio(req.params.destinoId, req.body));
});

const updateMunicipio = asyncHandler(async (req, res) => {
  res.json(await adminService.updateMunicipio(req.params.municipioId, req.body));
});

const deleteMunicipio = asyncHandler(async (req, res) => {
  res.json(await adminService.deleteMunicipio(req.params.municipioId));
});

module.exports = {
  listDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  createMunicipio,
  updateMunicipio,
  deleteMunicipio,
};
