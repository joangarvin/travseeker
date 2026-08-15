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
const { cleanMunicipalityFields } = require("../utils/sanitizeContent");
const {
  publicDestinationByIdWhere,
  publicEditorialWhere,
} = require("../domain/editorial");

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
    .map((link) => cleanMunicipalityFields(link.municipio))
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

function parsePagination(query) {
  const hasQuery = Boolean(String(query.q || "").trim());
  const requestedLimit = Number.parseInt(query.limit, 10);
  const requestedOffset = Number.parseInt(query.offset, 10);
  return {
    hasQuery,
    limit: Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 24,
    offset: Number.isFinite(requestedOffset)
      ? Math.min(Math.max(requestedOffset, 0), 100000)
      : 0,
  };
}

function textSearchWhere(query, structuredWhere) {
  const terms = String(query.q || '')
    .trim()
    .slice(0, 120)
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .slice(0, 6);
  if (!terms.length) return structuredWhere;

  const searchConditions = terms.flatMap((term) => {
    const contains = { contains: term, mode: 'insensitive' };
    return [
      { nombre: contains },
      { ubicacion: contains },
      { descripcion: contains },
      { imprescindibles: contains },
      { tipoTurismoPrincipal: contains },
      { tipoTurismoSecundario: contains },
      {
        municipioLinks: {
          some: { municipio: { nombre: contains, editorialStatus: "published" } },
        },
      },
      {
        activityLinks: {
          some: {
            activity: {
              name: contains,
              isActive: true,
              editorialStatus: "published",
            },
          },
        },
      },
      {
        tourismTypeLinks: {
          some: {
            tourismType: {
              name: contains,
              isActive: true,
              editorialStatus: "published",
            },
          },
        },
      },
      {
        places: {
          some: {
            nombre: contains,
            isActive: true,
            editorialStatus: "published",
          },
        },
      },
      {
        essentialGroups: {
          some: {
            OR: [
              { title: contains },
              { items: { some: { OR: [{ title: contains }, { description: contains }] } } },
            ],
          },
        },
      },
    ];
  });
  const { OR, AND, ...rest } = structuredWhere;
  const clauses = [{ OR: searchConditions }];
  if (OR) clauses.unshift({ OR });
  if (AND) clauses.unshift({ AND });
  return { ...rest, AND: clauses };
}

async function searchDestinosPage(query) {
  const { hasQuery, limit, offset } = parsePagination(query);
  const where = publicEditorialWhere(buildWhereClause(query));

  if (hasQuery) {
    // Fuzzy ranking needs the candidate set before it can score and sort it.
    // Pagination is still applied to the ranked result returned to the client.
    const searchWhere = textSearchWhere(query, where);
    let destinos = await prisma.destino.findMany({
      where: searchWhere,
      select: SEARCH_LIST_SELECT,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    });
    let ranked = prepareSearchResults(destinos, query);
    // Preserve typo-tolerant search when the database pre-filter finds no candidates.
    if (!ranked.length) {
      destinos = await prisma.destino.findMany({
        where,
        select: SEARCH_LIST_SELECT,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      });
      ranked = prepareSearchResults(destinos, query);
    }
    const items = ranked.slice(offset, offset + limit);
    return { items, total: ranked.length, hasMore: offset + items.length < ranked.length };
  }

  const [total, destinos] = await Promise.all([
    prisma.destino.count({ where }),
    prisma.destino.findMany({
      where,
      select: LIST_SELECT,
      skip: offset,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
  ]);
  const items = rankForSeason(destinos.map(mapTourismTypes), {
    month: normalizeMonth(query.month),
    avoidCrowds: query.avoidCrowds === "true",
  });
  return { items, total, hasMore: offset + items.length < total };
}

async function searchDestinos(query) {
  return (await searchDestinosPage(query)).items;
}

async function getDestinoById(id) {
  const destino = await prisma.destino.findFirst({
    where: publicDestinationByIdWhere(id),
    include: {
      municipioLinks: {
        where: { municipio: { editorialStatus: "published" } },
        include: { municipio: true },
      },
      places: {
        where: { isActive: true, editorialStatus: "published" },
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
        where: { activity: { isActive: true, editorialStatus: "published" } },
        include: { activity: true },
      },
      tourismTypeLinks: {
        where: { tourismType: { isActive: true, editorialStatus: "published" } },
        include: { tourismType: true },
      },
    },
  });
  if (!destino) return null;
  destino.essentialGroups?.forEach((group) => {
    group.items?.forEach((item) => {
      if (item.place?.editorialStatus !== "published" || item.place?.isActive !== true) {
        item.place = null;
        item.placeId = null;
      }
    });
  });
  const municipios = (destino.municipioLinks || [])
    .map((link) => cleanMunicipalityFields(link.municipio))
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const { municipioLinks, ...rest } = destino;
  return { ...mapTourismTypes(mapActivities(rest)), municipios };
}

async function getDestacados(limit = 6) {
  const destinos = await prisma.destino.findMany({
    where: { editorialStatus: "published" },
    orderBy: { updatedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 12),
    select: LIST_SELECT,
  });
  return destinos.map(mapTourismTypes);
}

async function getRelacionados(id) {
  const destino = await prisma.destino.findFirst({
    where: publicDestinationByIdWhere(id),
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
      editorialStatus: "published",
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
      ...publicEditorialWhere(buildWhereClause(query)),
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
    where: { id: { in: ids }, editorialStatus: "published" },
    select: COMPARE_SELECT,
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return destinos
    .map((destination) => mapTourismTypes(mapActivities(destination)))
    .sort((a, b) => order.get(a.id) - order.get(b.id));
}

async function getStats() {
  const [total, reviewAgg] = await Promise.all([
    prisma.destino.count({ where: { editorialStatus: "published" } }),
    prisma.review.aggregate({
      where: { status: 'published' },
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
    prisma.destino.findMany({
      where: { editorialStatus: "published" },
      select: { ubicacion: true },
    }),
    prisma.activity.findMany({
      where: { isActive: true, editorialStatus: "published" },
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
  searchDestinosPage,
  getDestinoById,
  getDestacados,
  getRelacionados,
  getMapaDestinos,
  compareDestinos,
  getStats,
  getFilterOptions,
};
