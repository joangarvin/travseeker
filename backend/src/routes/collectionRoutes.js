const { Router } = require('express');
const collectionController = require('../controllers/collectionController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', collectionController.list);
router.post('/', collectionController.create);
router.get('/destino/:destinoId', collectionController.forDestino);
router.get('/:id', collectionController.getOne);
router.patch('/:id', collectionController.update);
router.delete('/:id', collectionController.remove);
router.post('/:id/items', collectionController.addItem);
router.patch('/:id/items/:destinoId', collectionController.updateItem);
router.delete('/:id/items/:destinoId', collectionController.removeItem);

module.exports = router;
