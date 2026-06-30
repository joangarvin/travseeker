const { prisma } = require('../config/database');
const { LIST_SELECT } = require('../constants/selects');

async function listFavoritos(userId) {
  const favoritos = await prisma.favorito.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { destino: { select: LIST_SELECT } },
  });

  return favoritos.map((f) => ({
    id: f.id,
    destinoId: f.destinoId,
    notas: f.notas,
    createdAt: f.createdAt,
    destino: f.destino,
  }));
}

async function getFavoriteIds(userId) {
  const rows = await prisma.favorito.findMany({
    where: { userId },
    select: { destinoId: true },
  });
  return rows.map((r) => r.destinoId);
}

async function addFavorito(userId, destinoId) {
  const destino = await prisma.destino.findUnique({ where: { id: destinoId }, select: { id: true } });
  if (!destino) {
    const error = new Error('Destino no encontrado');
    error.status = 404;
    throw error;
  }

  const existing = await prisma.favorito.findUnique({
    where: { userId_destinoId: { userId, destinoId } },
  });
  if (existing) return { favorito: existing, created: false };

  const favorito = await prisma.favorito.create({
    data: { userId, destinoId },
  });
  return { favorito, created: true };
}

async function removeFavorito(userId, destinoId) {
  const favorito = await prisma.favorito.findUnique({
    where: { userId_destinoId: { userId, destinoId } },
  });
  if (!favorito) {
    const error = new Error('Favorito no encontrado');
    error.status = 404;
    throw error;
  }
  await prisma.favorito.delete({ where: { id: favorito.id } });
  return { removed: true };
}

async function isFavorito(userId, destinoId) {
  const favorito = await prisma.favorito.findUnique({
    where: { userId_destinoId: { userId, destinoId } },
    select: { id: true },
  });
  return Boolean(favorito);
}

module.exports = {
  listFavoritos,
  getFavoriteIds,
  addFavorito,
  removeFavorito,
  isFavorito,
};
