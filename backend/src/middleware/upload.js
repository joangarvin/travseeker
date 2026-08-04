const multer = require('multer');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ESSENTIAL_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageUpload(allowed, message) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        cb(new Error(message));
        return;
      }
      cb(null, true);
    },
  });
}

const upload = imageUpload(ALLOWED_MIME, 'Solo se permiten imágenes JPG, PNG, WebP o GIF');
const essentialUpload = imageUpload(ESSENTIAL_MIME, 'Solo se permiten imágenes JPG, PNG o WebP');

function handleUploadError(err, _req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La imagen no puede superar 10 MB' });
  }
  if (err.message?.includes('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
}

module.exports = { upload, essentialUpload, handleUploadError };
