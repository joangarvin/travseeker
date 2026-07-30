const alerts = require('../services/alertService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => res.json(await alerts.list(req.user.id)));
const create = asyncHandler(async (req, res) => res.status(201).json(await alerts.create(req.user.id, req.body)));
const remove = asyncHandler(async (req, res) => res.json(await alerts.remove(req.user.id, req.params.id)));

module.exports = { list, create, remove };
