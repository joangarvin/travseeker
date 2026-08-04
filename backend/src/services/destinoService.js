const { prisma } = require("../config/database");
const { buildWhereClause } = require("../utils/buildWhereClause");
const {
  LIST_SELECT,
  MAP_SELECT,
  SEARCH_LIST_SELECT,
  SEARCH_MAP_SELECT,
  COMPARE_SELECT,
} = require("../constants/selects");
const { normalizeMonth, rankForSeason } = require("../domain/season");
const { rankDestinationSearch } = require("../domain/search");
const { parseTags, serializeTags } = require("../constants/scales");

function mapActivities(destino) {
  if (!destino) return destino;
  const activities = (destino.activityLinks || [])
    .map((link) => link.activity)
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name, "es"));
  const { activityLinks, ...rest } = destino;
  return {
    ...rest,
    tipoTurismoSecundario: serializeTags(
      activities.map((activity) => activity.name),
    ),
    activities,
    activityIds: activities.map((activity) => activity.id),
  };
}

function mapTourismTypes(destino) {
  if (!destino) return destino;
  const tourismTypes = (destino.tourismTypeLinks || [])
    .map((link) => link.tourismType)
    .filter(Boolean)
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name, "es"),
    );
  const { tourismTypeLinks, ...rest } = destino;
  return {
    ...rest,
    tipoTurismoPrincipal: serializeTags(tourismTypes.map((type) => type.name)),
    tourismTypes,
    tourismTypeIds: tourismTypes.map((type) => type.id),
  };
}

function mapMunicipalities(destino) {
  if (!destino) return destino;
  const municipios = (destino.municipioLinks || [])
    .map((link) => link.municipio)
    .filter(Boolean)
    .sort((first, second) => first.nombre.localeCompare(second.nombre, "es"));
  const { municipioLinks, ...rest } = destino;
  return { ...rest, municipios };
}

function prepareSearchResults(destinations, query) {
  const searched = rankDestinationSearch(destinations, query.q);
  const prepared = searched.map((destination) =>
    mapTourismTypes(mapActivities(mapMunicipalities(destination))),
  );
  const seasonal = rankForSeason(prepared, {
    month: normalizeMonth(query.month),
    avoidCrowds: query.avoidCrowds === "true",
  });
  if (query.q) {
    seasonal.sort(
      (first, second) =>
        second._searchScore - first._searchScore ||
        first.nombre.localeCompare(second.nombre, "es"),
    );
  }
  return seasonal.map(
    ({
      _searchScore,
      descripcion,
      imprescindibles,
      places,
      essentialGroups,
      ...destination
    }) => destination,
  );
}

async function searchDestinos(query) {
  const hasQuery = Boolean(String(query.q || "").trim());
  const destinos = await prisma.destino.findMany({
    where: buildWhereClause(query),
    select: hasQuery ? SEARCH_LIST_SELECT : LIST_SELECT,
  });
  if (hasQuery) return prepareSearchResults(destinos, query);
  return rankForSeason(destinos.map(mapTourismTypes), {
    month: normalizeMonth(query.month),
    avoidCrowds: query.avoidCrowds === "true",
  });
}

async function getDestinoById(id) {
  const destino = await prisma.destino.findUnique({
    where: { id },
    include: {
      municipioLinks: {
        include: { municipio: true },
      },
      places: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }],
      },
      essentialGroups: {
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        include: {
          items: {
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
            include: { place: true },
          },
        },
      },
      activityLinks: {
        where: { activity: { isActive: true } },
        include: { activity: true },
      },
      tourismTypeLinks: {
        where: { tourismType: { isActive: true } },
        include: { tourismType: true },
      },
    },
  });
  if (!destino) return null;
  const municipios = (destino.municipioLinks || [])
    .map((link) => link.municipio)
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const { municipioLinks, ...rest } = destino;
  return { ...mapTourismTypes(mapActivities(rest)), municipios };
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
  return destinos
    .map(mapTourismTypes)
    .sort((a, b) => order.get(a.id) - order.get(b.id));
}

async function getRelacionados(id) {
  const destino = await prisma.destino.findUnique({
    where: { id },
    select: { ubicacion: true, tipoTurismoPrincipal: true, presupuesto: true },
  });

  if (!destino) return null;

  const tourismMatches = parseTags(destino.tipoTurismoPrincipal).map(
    (type) => ({
      tipoTurismoPrincipal: { contains: type, mode: "insensitive" },
    }),
  );

  const related = await prisma.destino.findMany({
    where: {
      id: { not: id },
      OR: [
        { ubicacion: { contains: destino.ubicacion } },
        ...tourismMatches,
        { presupuesto: { contains: destino.presupuesto } },
      ],
    },
    take: 3,
    select: LIST_SELECT,
  });
  return related.map(mapTourismTypes);
}

async function getMapaDestinos(query) {
  const hasQuery = Boolean(String(query.q || "").trim());
  const destinos = await prisma.destino.findMany({
    where: {
      ...buildWhereClause(query),
      latitud: { not: null },
      longitud: { not: null },
    },
    select: hasQuery ? SEARCH_MAP_SELECT : MAP_SELECT,
  });
  if (hasQuery) return prepareSearchResults(destinos, query);
  return rankForSeason(destinos.map(mapTourismTypes), {
    month: normalizeMonth(query.month),
    avoidCrowds: query.avoidCrowds === "true",
  });
}

async function compareDestinos(ids) {
  if (!Array.isArray(ids) || ids.length < 2) {
    const error = new Error("Selecciona al menos dos destinos para comparar");
    error.status = 400;
    throw error;
  }
  if (ids.length > 4) {
    const error = new Error("Puedes comparar un máximo de 4 destinos");
    error.status = 400;
    throw error;
  }

  const destinos = await prisma.destino.findMany({
    where: { id: { in: ids } },
    select: COMPARE_SELECT,
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return destinos
    .map((destination) => mapTourismTypes(mapActivities(destination)))
    .sort((a, b) => order.get(a.id) - order.get(b.id));
}

async function getStats() {
  const [total, reviewAgg] = await Promise.all([
    prisma.destino.count(),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  return {
    total,
    totalReviews: reviewAgg._count.rating || 0,
    avgRating: reviewAgg._avg.rating
      ? Number(reviewAgg._avg.rating.toFixed(1))
      : null,
  };
}

async function getFilterOptions() {
  const [destinations, activityCatalog] = await Promise.all([
    prisma.destino.findMany({ select: { ubicacion: true } }),
    prisma.activity.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);
  const locations = [
    ...new Set(
      destinations.flatMap((destination) => parseTags(destination.ubicacion)),
    ),
  ].sort((first, second) => first.localeCompare(second, "es"));
  const activities = activityCatalog.map((activity) => activity.name);
  return { locations, activities };
}

module.exports = {
  searchDestinos,
  getDestinoById,
  getDestacados,
  getRelacionados,
  getMapaDestinos,
  compareDestinos,
  getStats,
  getFilterOptions,
};
