const { Router } = require('express');
const recommendationController = require('../controllers/recommendationController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
router.get('/', recommendationController.list);

module.exports = router;
