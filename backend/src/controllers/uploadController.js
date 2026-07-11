const uploadService = require('../services/uploadService');
const { prisma } = require('../config/database');
const { asyncHandler } = require('../utils/asyncHandler');

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes enviar una imagen' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatarUrl: true },
  });

  const result = await uploadService.uploadAvatar(
    req.user.id,
    req.file.buffer,
    user?.avatarUrl,
  );

  res.json(result);
});

const uploadDestinoCover = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes enviar una imagen' });
  }

  const destinoId = req.body.destinoId?.trim() || undefined;
  const result = await uploadService.uploadDestinoCover(req.file.buffer, destinoId);
  res.json(result);
});

const uploadStatus = (_req, res) => {
  res.json({ configured: uploadService.isConfigured });
};

module.exports = { uploadAvatar, uploadDestinoCover, uploadStatus };
