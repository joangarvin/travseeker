const { Router } = require("express");
const controller = require("../controllers/tourismTypeController");

const router = Router();
router.get("/", controller.listPublic);
module.exports = router;
