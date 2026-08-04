const { Router } = require("express");
const activityController = require("../controllers/activityController");

const router = Router();

router.get("/", activityController.listPublic);

module.exports = router;
