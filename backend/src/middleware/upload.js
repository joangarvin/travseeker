const multer = require('multer');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Solo se permiten imágenes JPG, PNG, WebP o GIF'));
      return;
    }
    cb(null, true);
  },
});

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

module.exports = { upload, handleUploadError };
