// Mounted behind requireAuth + requireAdmin. No public mutation or generic model access.
const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/publicationService");
const router = Router();
router.get(
  "/summary",
  asyncHandler(async (req, res) => res.json(await service.summary(req.query))),
);
router.get(
  "/countries",
  asyncHandler(async (req, res) => res.json(await service.countries())),
);
router.patch(
  "/countries/:code",
  asyncHandler(async (req, res) =>
    res.json(await service.updateCountry(req.params.code, req.body)),
  ),
);
router.get(
  "/preview/:code",
  asyncHandler(async (req, res) =>
    res.json(await service.preview(req.params.code)),
  ),
);
router.get(
  "/source/:resource/:id",
  asyncHandler(async (req, res) =>
    res.json(await service.sourceRecord(req.params.resource, req.params.id)),
  ),
);
router.get(
  "/records",
  asyncHandler(async (req, res) => res.json(await service.list(req.query))),
);
router.patch(
  "/records/:resource/:id",
  asyncHandler(async (req, res) =>
    res.json(
      await service.update(
        req.params.resource,
        req.params.id,
        req.body,
        req.user.id,
      ),
    ),
  ),
);
module.exports = router;
