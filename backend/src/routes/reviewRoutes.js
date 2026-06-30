const { Router } = require('express');
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

const router = Router({ mergeParams: true });

router.get('/', reviewController.list);
router.post('/', requireAuth, reviewController.upsert);
router.delete('/', requireAuth, reviewController.remove);

module.exports = router;
