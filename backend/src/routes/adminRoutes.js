const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/destinos', adminController.listDestinos);
router.post('/destinos', adminController.createDestino);
router.put('/destinos/:destinoId', adminController.updateDestino);
router.delete('/destinos/:destinoId', adminController.deleteDestino);

router.post('/destinos/:destinoId/municipios', adminController.createMunicipio);
router.put('/municipios/:municipioId', adminController.updateMunicipio);
router.delete('/municipios/:municipioId', adminController.deleteMunicipio);

module.exports = router;
