const { Router } = require('express');
const uploadController = require('../controllers/uploadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload, essentialUpload, handleUploadError } = require('../middleware/upload');

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

router.post(
  '/essential',
  requireAuth,
  requireAdmin,
  essentialUpload.single('image'),
  handleUploadError,
  uploadController.uploadEssentialImage,
);

module.exports = router;
