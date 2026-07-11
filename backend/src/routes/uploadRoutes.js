const { Router } = require('express');
const uploadController = require('../controllers/uploadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = Router();

router.get('/status', uploadController.uploadStatus);

router.post(
  '/avatar',
  requireAuth,
  upload.single('image'),
  handleUploadError,
  uploadController.uploadAvatar,
);

router.post(
  '/destino',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  handleUploadError,
  uploadController.uploadDestinoCover,
);

module.exports = router;
