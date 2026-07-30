const { Router } = require('express');
const controller = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');
const router = Router();
router.use(requireAuth);
router.get('/', controller.list);
router.post('/', controller.create);
router.delete('/:id', controller.remove);
module.exports = router;
