const { Router } = require('express');
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/destinos', adminController.listDestinos);
router.post('/destinos', adminController.createDestino);
router.put('/destinos/:destinoId', adminController.updateDestino);
router.delete('/destinos/:destinoId', adminController.deleteDestino);

router.get('/municipios', adminController.listMunicipios);
router.post('/municipios', adminController.createMunicipio);
router.put('/municipios/:municipioId', adminController.updateMunicipio);
router.delete('/municipios/:municipioId', adminController.deleteMunicipio);

router.post('/destinos/:destinoId/municipios', adminController.linkMunicipio);
router.delete('/destinos/:destinoId/municipios/:municipioId', adminController.unlinkMunicipio);

router.get('/reviews', reviewController.listForAdmin);
router.patch('/reviews/:reviewId', reviewController.moderate);

module.exports = router;
