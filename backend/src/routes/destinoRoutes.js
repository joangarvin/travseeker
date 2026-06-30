const { Router } = require('express');
const destinoController = require('../controllers/destinoController');

const router = Router();

router.get('/', destinoController.search);
router.get('/compare', destinoController.compare);
router.get('/:id/relacionados', destinoController.getRelacionados);
router.get('/:id', destinoController.getById);

module.exports = router;
