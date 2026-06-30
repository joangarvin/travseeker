const { Router } = require('express');
const favoritoController = require('../controllers/favoritoController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', favoritoController.list);
router.get('/ids', favoritoController.ids);
router.get('/check/:destinoId', favoritoController.check);
router.post('/:destinoId', favoritoController.add);
router.delete('/:destinoId', favoritoController.remove);

module.exports = router;
