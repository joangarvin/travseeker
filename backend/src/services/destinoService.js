const { prisma } = require('../config/database');
const { buildWhereClause } = require('../utils/buildWhereClause');
const { LIST_SELECT, MAP_SELECT, COMPARE_SELECT } = require('../constants/selects');

async function searchDestinos(query) {
  return prisma.destino.findMany({
    where: buildWhereClause(query),
    select: LIST_SELECT,
  });
}

async function getDestinoById(id) {
  return prisma.destino.findUnique({
    where: { id },
    include: { municipios: true },
  });
}

async function getDestacados(limit = 6) {
  const rows = await prisma.$queryRaw`
    SELECT id FROM "Destino" ORDER BY RANDOM() LIMIT ${limit}
  `;
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const destinos = await prisma.destino.findMany({
    where: { id: { in: ids } },
    select: LIST_SELECT,
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return destinos.sort((a, b) => order.get(a.id) - order.get(b.id));
}

async function getRelacionados(id) {
  const destino = await prisma.destino.findUnique({
    where: { id },
    select: { ubicacion: true, tipoTurismoPrincipal: true, presupuesto: true },
  });

  if (!destino) return null;

  return prisma.destino.findMany({
    where: {
      id: { not: id },
      OR: [
        { ubicacion: { contains: destino.ubicacion } },
        { tipoTurismoPrincipal: { contains: destino.tipoTurismoPrincipal } },
        { presupuesto: { contains: destino.presupuesto } },
      ],
    },
    take: 3,
    select: LIST_SELECT,
  });
}

async function getMapaDestinos(query) {
  return prisma.destino.findMany({
    where: {
      ...buildWhereClause(query),
      latitud: { not: null },
      longitud: { not: null },
    },
    select: MAP_SELECT,
  });
}

async function compareDestinos(ids) {
  if (!Array.isArray(ids) || ids.length < 2) {
    const error = new Error('Selecciona al menos dos destinos para comparar');
    error.status = 400;
    throw error;
  }
  if (ids.length > 4) {
    const error = new Error('Puedes comparar un máximo de 4 destinos');
    error.status = 400;
    throw error;
  }

  const destinos = await prisma.destino.findMany({
    where: { id: { in: ids } },
    select: COMPARE_SELECT,
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return destinos.sort((a, b) => order.get(a.id) - order.get(b.id));
}

async function getStats() {
  const [total, reviewAgg] = await Promise.all([
    prisma.destino.count(),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
  ]);
  return {
    total,
    totalReviews: reviewAgg._count.rating || 0,
    avgRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
  };
}

module.exports = {
  searchDestinos,
  getDestinoById,
  getDestacados,
  getRelacionados,
  getMapaDestinos,
  compareDestinos,
  getStats,
};
