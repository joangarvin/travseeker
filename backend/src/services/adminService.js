const { prisma } = require("../config/database");
const { parseTags } = require("../constants/scales");
const { normalizeEssentialGroups } = require("../domain/essentials");
const {
  normalizeDestinationPayload,
  validateDestino,
  normalizeMunicipioPayload,
  normalizePlace,
} = require("../domain/adminPayload");
const { mapAdminDestination } = require("../domain/destinationMapping");
const { cleanMunicipalityFields } = require("../utils/sanitizeContent");
const uploadService = require("./uploadService");

async function syncDestinationTourismTypes(
  transaction,
  destinoId,
  serializedNames,
) {
  const names = parseTags(serializedNames);
  const types = names.length
    ? await transaction.tourismType.findMany({
        where: {
          OR: names.map((name) => ({
            name: { equals: name, mode: "insensitive" },
          })),
        },
      })
    : [];
  const missing = names.filter(
    (name) =>
      !types.some(
        (type) =>
          type.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"),
      ),
  );
  if (missing.length) {
    const error = new Error(
      `Crea primero estos tipos de viaje en el catálogo: ${missing.join(", ")}`,
    );
    error.status = 400;
    throw error;
  }
  await transaction.destinoTourismType.deleteMany({ where: { destinoId } });
  if (types.length) {
    await transaction.destinoTourismType.createMany({
      data: types.map((type) => ({ destinoId, tourismTypeId: type.id })),
      skipDuplicates: true,
    });
  }
}

async function syncDestinationActivities(
  transaction,
  destinoId,
  serializedNames,
) {
  const names = parseTags(serializedNames);
  const activities = names.length
    ? await transaction.activity.findMany({
        where: {
          OR: names.map((name) => ({
            name: { equals: name, mode: "insensitive" },
          })),
        },
      })
    : [];

  const missingNames = names.filter(
    (name) =>
      !activities.some(
        (activity) =>
          activity.name.toLocaleLowerCase("es") ===
          name.toLocaleLowerCase("es"),
      ),
  );
  if (missingNames.length) {
    const error = new Error(
      `Crea primero estas actividades en el catálogo: ${missingNames.join(", ")}`,
    );
    error.status = 400;
    throw error;
  }

  await transaction.destinoActivity.deleteMany({ where: { destinoId } });
  if (activities.length) {
    await transaction.destinoActivity.createMany({
      data: activities.map((activity) => ({
        destinoId,
        activityId: activity.id,
      })),
      skipDuplicates: true,
    });
  }
}

const destinationRelations = {
  municipioLinks: { include: { municipio: true } },
  activityLinks: { include: { activity: true } },
  tourismTypeLinks: { include: { tourismType: true } },
  places: { orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }] },
  essentialGroups: {
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      items: {
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        include: { place: true },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      avatarUrl: true,
      email: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      avatarUrl: true,
      email: true,
    },
  },
};

async function syncDestinationEssentials(
  transaction,
  destinoId,
  essentialGroups,
) {
  if (!Array.isArray(essentialGroups)) return;
  const placeIds = [
    ...new Set(
      essentialGroups.flatMap((group) =>
        group.items.map((item) => item.placeId).filter(Boolean),
      ),
    ),
  ];
  if (placeIds.length) {
    const places = await transaction.place.findMany({
      where: { destinoId, id: { in: placeIds } },
      select: { id: true },
    });
    const validIds = new Set(places.map((place) => place.id));
    const invalidId = placeIds.find((id) => !validIds.has(id));
    if (invalidId) {
      const error = new Error(
        "Uno de los lugares asociados no pertenece a este destino",
      );
      error.status = 400;
      throw error;
    }
  }

  await transaction.essentialGroup.deleteMany({ where: { destinoId } });
  for (const group of essentialGroups) {
    await transaction.essentialGroup.create({
      data: {
        destinoId,
        title: group.title,
        sortOrder: group.sortOrder,
        items: { create: group.items },
      },
    });
  }
}

async function listDestinos() {
  const rows = await prisma.destino.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      ubicacion: true,
      imagen: true,
      tipoTurismoPrincipal: true,
      tipoTurismoSecundario: true,
      presupuesto: true,
      masificacion: true,
      latitud: true,
      longitud: true,
      editorialStatus: true,
      submittedAt: true,
      reviewedAt: true,
      createdById: true,
      reviewedById: true,
      municipioLinks: {
        select: {
          municipio: { select: { id: true, nombre: true } },
        },
      },
      activityLinks: { include: { activity: true } },
      tourismTypeLinks: { include: { tourismType: true } },
    },
  });
  return rows.map(mapAdminDestination);
}

async function getDestino(id) {
  const destination = await prisma.destino.findUnique({
    where: { id },
    include: destinationRelations,
  });
  if (!destination) {
    const error = new Error("Destino no encontrado");
    error.status = 404;
    throw error;
  }
  return mapAdminDestination(destination);
}

async function createDestino(payload, createdById) {
  const essentialGroups = normalizeEssentialGroups(payload.essentialGroups);
  const data = normalizeDestinationPayload(payload, essentialGroups);
  validateDestino(data, essentialGroups);
  const created = await prisma.$transaction(async (transaction) => {
    const destination = await transaction.destino.create({
      data: { ...data, editorialStatus: "pending", createdById },
    });
    await syncDestinationActivities(
      transaction,
      destination.id,
      data.tipoTurismoSecundario,
    );
    await syncDestinationTourismTypes(
      transaction,
      destination.id,
      data.tipoTurismoPrincipal,
    );
    await syncDestinationEssentials(
      transaction,
      destination.id,
      essentialGroups,
    );
    return transaction.destino.findUnique({
      where: { id: destination.id },
      include: destinationRelations,
    });
  });
  return mapAdminDestination(created);
}

async function updateDestino(id, payload) {
  const essentialGroups = normalizeEssentialGroups(payload.essentialGroups);
  const data = normalizeDestinationPayload(payload, essentialGroups);
  validateDestino(data, essentialGroups);
  const previousImages = await prisma.essentialItem.findMany({
    where: { group: { destinoId: id }, imageUrl: { not: null } },
    select: { imageUrl: true },
  });
  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.destino.update({ where: { id }, data });
    await syncDestinationActivities(
      transaction,
      id,
      data.tipoTurismoSecundario,
    );
    await syncDestinationTourismTypes(
      transaction,
      id,
      data.tipoTurismoPrincipal,
    );
    await syncDestinationEssentials(transaction, id, essentialGroups);
    return transaction.destino.findUnique({
      where: { id },
      include: destinationRelations,
    });
  });
  const retainedImages = new Set(
    (essentialGroups || []).flatMap((group) =>
      group.items.map((item) => item.imageUrl).filter(Boolean),
    ),
  );
  await uploadService.deleteEssentialImages(
    previousImages
      .map((item) => item.imageUrl)
      .filter((url) => !retainedImages.has(url)),
  );
  return mapAdminDestination(updated);
}

async function deleteDestino(id) {
  const images = await prisma.essentialItem.findMany({
    where: { group: { destinoId: id }, imageUrl: { not: null } },
    select: { imageUrl: true },
  });
  await prisma.destino.delete({ where: { id } });
  await uploadService.deleteEssentialImages(
    images.map((item) => item.imageUrl),
  );
  return { success: true };
}

async function listMunicipios() {
  const rows = await prisma.municipio.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { destinoLinks: true } },
    },
  });
  return rows.map(({ _count, ...m }) => ({
    ...cleanMunicipalityFields(m),
    destinosCount: _count.destinoLinks,
  }));
}

async function createMunicipio(payload, createdById) {
  const data = normalizeMunicipioPayload(payload);
  const created = await prisma.municipio.create({
    data: { ...data, editorialStatus: "pending", createdById },
    include: { _count: { select: { destinoLinks: true } } },
  });
  return {
    id: created.id,
    nombre: created.nombre,
    precios: created.precios,
    conexiones: created.conexiones,
    tipoTurismo: created.tipoTurismo,
    latitud: created.latitud,
    longitud: created.longitud,
    destinosCount: created._count.destinoLinks,
  };
}

async function updateMunicipio(id, payload) {
  const data = normalizeMunicipioPayload(payload);
  const updated = await prisma.municipio.update({
    where: { id },
    data,
    include: { _count: { select: { destinoLinks: true } } },
  });
  return {
    id: updated.id,
    nombre: updated.nombre,
    precios: updated.precios,
    conexiones: updated.conexiones,
    tipoTurismo: updated.tipoTurismo,
    latitud: updated.latitud,
    longitud: updated.longitud,
    destinosCount: updated._count.destinoLinks,
  };
}

async function deleteMunicipio(id) {
  await prisma.municipio.delete({ where: { id } });
  return { success: true };
}

async function linkMunicipio(destinoId, municipioId) {
  const mid = String(municipioId || "").trim();
  if (!mid) {
    const err = new Error("Elige un municipio de la lista");
    err.status = 400;
    throw err;
  }

  const [destino, municipio] = await Promise.all([
    prisma.destino.findUnique({
      where: { id: destinoId },
      select: { id: true },
    }),
    prisma.municipio.findUnique({ where: { id: mid } }),
  ]);
  if (!destino) {
    const err = new Error("Destino no encontrado");
    err.status = 404;
    throw err;
  }
  if (!municipio) {
    const err = new Error("Municipio no encontrado");
    err.status = 404;
    throw err;
  }

  await prisma.destinoMunicipio.upsert({
    where: {
      destinoId_municipioId: { destinoId, municipioId: mid },
    },
    create: { destinoId, municipioId: mid },
    update: {},
  });

  return cleanMunicipalityFields(municipio);
}

async function unlinkMunicipio(destinoId, municipioId) {
  await prisma.destinoMunicipio.deleteMany({
    where: { destinoId, municipioId },
  });
  return { success: true };
}

async function listPlaces(destinoId) {
  return prisma.place.findMany({
    where: { destinoId },
    orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }],
  });
}
async function createPlace(destinoId, payload, createdById) {
  return prisma.place.create({
    data: {
      destinoId,
      ...normalizePlace(payload),
      isActive: false,
      editorialStatus: "pending",
      createdById,
    },
  });
}
async function updatePlace(id, payload) {
  const current = await prisma.place.findUnique({
    where: { id },
    select: { editorialStatus: true },
  });
  if (!current) {
    const error = new Error("Lugar no encontrado");
    error.status = 404;
    throw error;
  }
  return prisma.place.update({
    where: { id },
    data: {
      ...normalizePlace(payload),
      isActive: current.editorialStatus === "published",
    },
  });
}
async function deletePlace(id) {
  await prisma.place.delete({ where: { id } });
  return { success: true };
}

module.exports = {
  listDestinos,
  getDestino,
  createDestino,
  updateDestino,
  deleteDestino,
  listMunicipios,
  createMunicipio,
  updateMunicipio,
  deleteMunicipio,
  linkMunicipio,
  unlinkMunicipio,
  listPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  syncDestinationActivities,
  syncDestinationTourismTypes,
};
