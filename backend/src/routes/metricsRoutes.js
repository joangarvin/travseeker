const { Router } = require('express');
const metricsController = require('../controllers/metricsController');

const router = Router();

router.post('/', metricsController.report);

module.exports = router;
