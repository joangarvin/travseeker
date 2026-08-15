const { Router } = require('express');
const uploadController = require('../controllers/uploadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload, essentialUpload, handleUploadError, validateImageSignature } = require('../middleware/upload');

const router = Router();

router.get('/status', uploadController.uploadStatus);

router.post(
  '/avatar',
  requireAuth,
  upload.single('image'),
  handleUploadError,
  validateImageSignature,
  uploadController.uploadAvatar,
);

router.post(
  '/destino',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  handleUploadError,
  validateImageSignature,
  uploadController.uploadDestinoCover,
);

router.post(
  '/essential',
  requireAuth,
  requireAdmin,
  essentialUpload.single('image'),
  handleUploadError,
  validateImageSignature,
  uploadController.uploadEssentialImage,
);

module.exports = router;
