const { Router } = require("express");
const destinoController = require("../controllers/destinoController");
const climateController = require("../controllers/climateController");
const { climateRateLimit } = require("../middleware/security");

const router = Router();

router.get("/", destinoController.search);
router.get("/filter-options", destinoController.getFilterOptions);
router.get("/compare", destinoController.compare);
router.get("/:id/relacionados", destinoController.getRelacionados);
router.get("/:id/climate", climateRateLimit, climateController.getByDestination);
router.get("/:id", destinoController.getById);

module.exports = router;
