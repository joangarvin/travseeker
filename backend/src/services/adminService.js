const {
  guideInclude,
  flattenGuide,
  municipalityAssociations,
} = require("../domain/municipalityCatalog");
const { pagination, catalogWhere } = require("../domain/pagination");
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
        include: { place: true, catalogActivity: { include: { essentialItem: true } } },
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

  const sharedIds = essentialGroups.flatMap(group => group.items.map(item => item.catalogActivityId).filter(Boolean));
  if (new Set(sharedIds).size !== sharedIds.length) throw Object.assign(new Error("Una actividad ya está marcada como imprescindible en este destino"), { status: 400 });
  const ids = essentialGroups.flatMap(group => group.items.map(item => item.id).filter(Boolean));
  const foreignItems = await transaction.essentialItem.count({ where: { id: { in: ids }, group: { destinoId: { not: destinoId } } } });
  if (foreignItems) throw Object.assign(new Error("Una actividad pertenece a otro destino. Reutilízala desde el catálogo."), { status: 400 });
  const linked = await transaction.experience.findMany({ where: { essentialItemId: { in: ids } }, select: { id: true, essentialItemId: true } });
  for (const group of essentialGroups) for (const item of group.items) {
    if (!item.catalogActivityId) continue;
    const activity = await transaction.experience.findUnique({ where: { id: item.catalogActivityId }, include: { essentialItem: true } });
    if (!activity) throw Object.assign(new Error("La actividad seleccionada ya no existe"), { status: 400 });
    const shared = require("../domain/municipalityCatalog").catalogRecord(activity);
    Object.assign(item, { title: shared.nombre, description: shared.descripcion || null, imageUrl: shared.imagen || null, imageAlt: shared.imagenAlt || null, duration: shared.duration || null, bestTime: shared.bestTime || null, officialUrl: shared.website || null });
  }
  const sourceRecords = await transaction.experience.findMany({ where: { essentialItem: { group: { destinoId } } }, include: { essentialItem: true } });
  for (const sourceRecord of sourceRecords) {
    const shared = require("../domain/municipalityCatalog").catalogRecord(sourceRecord);
    await transaction.experience.update({ where: { id: sourceRecord.id }, data: { nombre: shared.nombre, descripcion: shared.descripcion, imagen: shared.imagen, imagenAlt: shared.imagenAlt, duration: shared.duration, bestTime: shared.bestTime, website: shared.website, translations: shared.translations } });
  }
  await transaction.essentialGroup.deleteMany({ where: { destinoId } });
  for (const group of essentialGroups) {
    await transaction.essentialGroup.create({
      data: {
        destinoId,
        title: group.title,
        icon: group.icon,
        translations: group.translations,
        sortOrder: group.sortOrder,
        items: { create: group.items },
      },
    });
  }
  for (const record of linked) await transaction.experience.update({ where: { id: record.id }, data: { essentialItemId: record.essentialItemId } });
}

async function listDestinos(query = {}) {
  if (query.options === "1")
    return prisma.destino.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  const where = catalogWhere(query, [
    "nombre",
    "ubicacion",
    "tipoTurismoPrincipal",
  ]);
  const paging = query.meta === "1" ? pagination(query) : {};
  const rows = await prisma.destino.findMany({
    where,
    ...paging,
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
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
  const items = rows.map(mapAdminDestination);
  return query.meta === "1"
    ? { items, total: await prisma.destino.count({ where }) }
    : items;
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

async function listMunicipios(query = {}) {
  const where = catalogWhere(query, ["nombre", "tipoTurismo", "conexiones"]);
  const paging = query.meta === "1" ? pagination(query) : {};
  if (query.options === "1")
    return prisma.municipio.findMany({
      where,
      select: { id: true, nombre: true, latitud: true, longitud: true },
      orderBy: { nombre: "asc" },
    });
  const rows = await prisma.municipio.findMany({
    where,
    ...paging,
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    include: {
      ...guideInclude,
      _count: { select: { destinoLinks: true } },
    },
  });
  const items = rows.map(({ _count, ...m }) => ({
    ...flattenGuide(cleanMunicipalityFields(m)),
    destinosCount: _count.destinoLinks,
  }));
  return query.meta === "1"
    ? { items, total: await prisma.municipio.count({ where }) }
    : items;
}

async function createMunicipio(payload, createdById) {
  const data = normalizeMunicipioPayload(payload);
  const created = await prisma.$transaction(async (tx) => {
    const links = await municipalityAssociations(tx, payload);
    // Create does not need deleteMany on a relation that has no records yet.
    for (const link of Object.values(links)) delete link.deleteMany;
    return tx.municipio.create({
      data: { ...data, ...links, editorialStatus: "pending", createdById },
      include: { ...guideInclude, _count: { select: { destinoLinks: true } } },
    });
  });
  return {
    ...flattenGuide(cleanMunicipalityFields(created)),
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
  const updated = await prisma.$transaction(async (tx) =>
    tx.municipio.update({
      where: { id },
      data: { ...data, ...(await municipalityAssociations(tx, payload)) },
      include: { ...guideInclude, _count: { select: { destinoLinks: true } } },
    }),
  );
  return {
    ...flattenGuide(cleanMunicipalityFields(updated)),
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
  syncDestinationEssentials,
  syncDestinationActivities,
  syncDestinationTourismTypes,
};
