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

const uploadEssentialImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes enviar una imagen' });
  }
  const destinoId = String(req.body.destinoId || '').trim();
  if (!destinoId) {
    return res.status(400).json({ error: 'Guarda primero el destino' });
  }
  const destination = await prisma.destino.findUnique({
    where: { id: destinoId },
    select: { id: true },
  });
  if (!destination) {
    return res.status(404).json({ error: 'Destino no encontrado' });
  }
  res.json(await uploadService.uploadEssentialImage(destinoId, req.file.buffer));
});

const uploadStatus = (_req, res) => {
  res.json({ configured: uploadService.isConfigured });
};

module.exports = {
  uploadAvatar,
  uploadDestinoCover,
  uploadEssentialImage,
  uploadStatus,
};
