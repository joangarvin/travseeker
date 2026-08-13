const service = require("../services/tourismTypeService");
const { asyncHandler } = require("../utils/asyncHandler");

const listPublic = asyncHandler(async (_req, res) =>
  res.json(await service.listPublic()),
);
const listAdmin = asyncHandler(async (_req, res) =>
  res.json(await service.listAdmin()),
);
const create = asyncHandler(async (req, res) =>
  res.status(201).json(await service.create(req.body, req.user.id)),
);
const update = asyncHandler(async (req, res) =>
  res.json(await service.update(req.params.tourismTypeId, req.body)),
);
const remove = asyncHandler(async (req, res) =>
  res.json(await service.remove(req.params.tourismTypeId)),
);

module.exports = { listPublic, listAdmin, create, update, remove };
