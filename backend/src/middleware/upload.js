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

function hasValidImageSignature(buffer, mimetype) {
  if (!buffer || !buffer.length) return false;
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (mimetype === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function validateImageSignature(req, res, next) {
  if (req.file && !hasValidImageSignature(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ error: 'El contenido de la imagen no coincide con su formato.' });
  }
  return next();
}

module.exports = { upload, essentialUpload, handleUploadError, validateImageSignature };
