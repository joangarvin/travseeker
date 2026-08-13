const activityService = require("../services/activityService");
const { asyncHandler } = require("../utils/asyncHandler");

const listPublic = asyncHandler(async (_req, res) => {
  res.json(await activityService.listPublicActivities());
});

const listAdmin = asyncHandler(async (_req, res) => {
  res.json(await activityService.listAdminActivities());
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await activityService.createActivity(req.body, req.user.id));
});

const update = asyncHandler(async (req, res) => {
  res.json(
    await activityService.updateActivity(req.params.activityId, req.body),
  );
});

const remove = asyncHandler(async (req, res) => {
  res.json(await activityService.deleteActivity(req.params.activityId));
});

module.exports = { listPublic, listAdmin, create, update, remove };
