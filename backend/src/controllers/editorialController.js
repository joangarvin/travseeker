const editorialService = require("../services/editorialService");
const { asyncHandler } = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  res.json(await editorialService.listEditorial(req.query));
});

const counts = asyncHandler(async (_req, res) => {
  res.json(await editorialService.getPendingCounts());
});

const transitionBatch = asyncHandler(async (req, res) => {
  res.json(
    await editorialService.transitionBatch(
      req.params.resource,
      req.body.ids,
      req.body.status,
      req.user.id,
    ),
  );
});

const transitionOne = asyncHandler(async (req, res) => {
  res.json(
    await editorialService.transitionOne(
      req.params.resource,
      req.params.id,
      req.body.status,
      req.user.id,
    ),
  );
});

const adminCounts = asyncHandler(async (_req, res) =>
  res.json(await editorialService.getAdminCounts()),
);
const record = asyncHandler(async (req, res) =>
  res.json(
    await editorialService.getEditorialRecord(
      req.params.resource,
      req.params.id,
    ),
  ),
);
module.exports = {
  list,
  counts,
  adminCounts,
  record,
  transitionBatch,
  transitionOne,
};
