const { Router } = require("express");
const adminController = require("../controllers/adminController");
const reviewController = require("../controllers/reviewController");
const activityController = require("../controllers/activityController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/destinos", adminController.listDestinos);
router.get("/destinos/:destinoId", adminController.getDestino);
router.post("/destinos", adminController.createDestino);
router.put("/destinos/:destinoId", adminController.updateDestino);
router.delete("/destinos/:destinoId", adminController.deleteDestino);

router.get("/activities", activityController.listAdmin);
router.post("/activities", activityController.create);
router.put("/activities/:activityId", activityController.update);
router.delete("/activities/:activityId", activityController.remove);

router.get("/municipios", adminController.listMunicipios);
router.post("/municipios", adminController.createMunicipio);
router.put("/municipios/:municipioId", adminController.updateMunicipio);
router.delete("/municipios/:municipioId", adminController.deleteMunicipio);

router.post("/destinos/:destinoId/municipios", adminController.linkMunicipio);
router.delete(
  "/destinos/:destinoId/municipios/:municipioId",
  adminController.unlinkMunicipio,
);
router.get("/destinos/:destinoId/places", adminController.listPlaces);
router.post("/destinos/:destinoId/places", adminController.createPlace);
router.put("/places/:placeId", adminController.updatePlace);
router.delete("/places/:placeId", adminController.deletePlace);

router.get("/reviews", reviewController.listForAdmin);
router.patch("/reviews/:reviewId", reviewController.moderate);

module.exports = router;
