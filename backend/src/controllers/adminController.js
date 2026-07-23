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

const listMunicipios = asyncHandler(async (_req, res) => {
  res.json(await adminService.listMunicipios());
});

const createMunicipio = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createMunicipio(req.body));
});

const updateMunicipio = asyncHandler(async (req, res) => {
  res.json(await adminService.updateMunicipio(req.params.municipioId, req.body));
});

const deleteMunicipio = asyncHandler(async (req, res) => {
  res.json(await adminService.deleteMunicipio(req.params.municipioId));
});

const linkMunicipio = asyncHandler(async (req, res) => {
  const municipioId = req.body.municipioId;
  res.status(201).json(await adminService.linkMunicipio(req.params.destinoId, municipioId));
});

const unlinkMunicipio = asyncHandler(async (req, res) => {
  res.json(
    await adminService.unlinkMunicipio(req.params.destinoId, req.params.municipioId),
  );
});

module.exports = {
  listDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  listMunicipios,
  createMunicipio,
  updateMunicipio,
  deleteMunicipio,
  linkMunicipio,
  unlinkMunicipio,
};
