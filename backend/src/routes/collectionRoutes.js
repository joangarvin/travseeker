const { Router } = require('express');
const collectionController = require('../controllers/collectionController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/public/:shareToken', collectionController.getPublic);

router.use(requireAuth);

router.get('/', collectionController.list);
router.post('/', collectionController.create);
router.get('/destino/:destinoId', collectionController.forDestino);
router.get('/:id', collectionController.getOne);
router.patch('/:id', collectionController.update);
router.delete('/:id', collectionController.remove);
router.post('/:id/items', collectionController.addItem);
router.patch('/:id/items/reorder', collectionController.reorderItems);
router.patch('/:id/items/:destinoId', collectionController.updateItem);
router.delete('/:id/items/:destinoId', collectionController.removeItem);
router.post('/:id/share', collectionController.share);
router.delete('/:id/share', collectionController.stopSharing);
router.post('/:id/members', collectionController.addMember);
router.patch('/:id/members/:memberId', collectionController.updateMember);
router.delete('/:id/members/:memberId', collectionController.removeMember);

module.exports = router;
