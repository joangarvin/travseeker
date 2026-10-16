const { flattenGuide, publicGuideInclude } = require("./municipalityCatalog");
const { LIST_SELECT } = require("../constants/selects");
const { cleanMunicipalityFields } = require("../utils/sanitizeContent");

const COLLECTION_DESTINATION_SELECT = {
  ...LIST_SELECT,
  latitud: true,
  longitud: true,
  municipioLinks: {
    where: { municipio: { editorialStatus: "published" } },
    select: {
      municipio: {
        select: {
          activityLinks: publicGuideInclude.activityLinks,
          id: true,
          nombre: true,
          guideEnabled: true,
          translations: true,
          precios: true,
          conexiones: true,
          tipoTurismo: true,
          latitud: true,
          longitud: true,
        },
      },
    },
  },
  activityLinks: {
    where: { activity: { isActive: true, editorialStatus: "published" } },
    include: { activity: true },
  },
};

function mapCollectionDestination(destino) {
  const municipios = (destino.municipioLinks || [])
    .map((link) => flattenGuide(cleanMunicipalityFields(link.municipio)))
    .filter(Boolean);
  const activities = (destino.activityLinks || [])
    .map((link) => link.activity)
    .filter(Boolean);
  const { municipioLinks, activityLinks, ...rest } = destino;
  return {
    ...rest,
    municipios,
    activities,
    activityIds: activities.map((activity) => activity.id),
  };
}

function mapCollectionSummary(collection, userId) {
  return {
    id: collection.id,
    nombre: collection.nombre,
    descripcion: collection.descripcion,
    color: collection.color,
    visibility: collection.visibility,
    startDate: collection.startDate,
    endDate: collection.endDate,
    travelerCount: collection.travelerCount,
    itineraryDays: Array.isArray(collection.itinerary)
      ? collection.itinerary.length
      : 0,
    memberCount: collection._count.members,
    role:
      collection.userId === userId
        ? "owner"
        : collection.members[0]?.role || "viewer",
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    count: collection._count.items,
    covers: collection.items.map((item) => item.destino.imagen),
  };
}

function mapPrivateCollection(collection, role) {
  return {
    id: collection.id,
    nombre: collection.nombre,
    descripcion: collection.descripcion,
    color: collection.color,
    visibility: collection.visibility,
    shareToken: collection.shareToken,
    startDate: collection.startDate,
    endDate: collection.endDate,
    travelerCount: collection.travelerCount,
    itinerary: Array.isArray(collection.itinerary) ? collection.itinerary : [],
    role,
    owner: collection.user,
    members: collection.members.map((member) => ({
      id: member.id,
      role: member.role,
      user: member.user,
    })),
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    items: collection.items.map((item) => ({
      id: item.id,
      destinoId: item.destinoId,
      notas: item.notas,
      dayIndex: item.dayIndex,
      status: item.status,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      destino: mapCollectionDestination(item.destino),
    })),
  };
}

// Keep public fields explicit: never spread a private collection into this response.
function mapPublicCollection(collection) {
  return {
    nombre: collection.nombre,
    descripcion: collection.descripcion,
    color: collection.color,
    startDate: collection.startDate,
    endDate: collection.endDate,
    travelerCount: collection.travelerCount,
    itinerary: Array.isArray(collection.itinerary) ? collection.itinerary : [],
    owner: collection.user,
    members: collection.members.map((member) => ({
      id: member.id,
      role: member.role,
      user: member.user,
    })),
    items: collection.items.map((item) => ({
      id: item.id,
      dayIndex: item.dayIndex,
      status: item.status,
      sortOrder: item.sortOrder,
      destino: mapCollectionDestination(item.destino),
    })),
  };
}

module.exports = {
  COLLECTION_DESTINATION_SELECT,
  mapCollectionSummary,
  mapPrivateCollection,
  mapPublicCollection,
};
