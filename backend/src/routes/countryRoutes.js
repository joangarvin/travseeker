const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const countries = require("../services/countryService");
const router = Router();
router.use((_req, res, next) => {
  res.set("Cache-Control", "private, no-cache");
  next();
});
router.get(
  "/",
  asyncHandler(async (req, res) => res.json(await countries.list(req.locale))),
);
router.get(
  "/:code",
  asyncHandler(async (req, res) =>
    res.json(await countries.page(req.params.code, req.query, req.locale)),
  ),
);
module.exports = router;
