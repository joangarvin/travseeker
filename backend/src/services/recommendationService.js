const { prisma } = require("../config/database");
const { rankRecommendations } = require("../domain/recommendations");

const DISPLAY_SELECT = {
  id: true,
  nombre: true,
  translations: true,
  imagen: true,
  presupuesto: true,
  masificacion: true,
  ubicacion: true,
  tipoTurismoPrincipal: true,
  tipoTurismoSecundario: true,
};

async function getRecommendations(userId, limit = 8) {
  const [favorites, collectionItems, user] = await Promise.all([
    prisma.favorito.findMany({
      where: { userId },
      select: { destinoId: true },
    }),
    prisma.collectionItem.findMany({
      where: {
        collection: { OR: [{ userId }, { members: { some: { userId } } }] },
      },
      select: { destinoId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    }),
  ]);

  const likedIds = [
    ...new Set([
      ...favorites.map((favorite) => favorite.destinoId),
      ...collectionItems.map((item) => item.destinoId),
    ]),
  ];

  const liked = likedIds.length
    ? await prisma.destino.findMany({
        where: { id: { in: likedIds }, editorialStatus: "published" },
        select: DISPLAY_SELECT,
      })
    : [];

  const candidates = await prisma.destino.findMany({
    where: {
      editorialStatus: "published",
      ...(likedIds.length ? { id: { notIn: likedIds } } : {}),
    },
    select: DISPLAY_SELECT,
  });

  return rankRecommendations(candidates, liked, user?.preferences, {
    limit,
    hasSavedDestinations: likedIds.length > 0,
  });
}

module.exports = { getRecommendations };
