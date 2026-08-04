const { prisma } = require("../config/database");
const {
  parseTags,
  serializeTags,
  isTourismType,
  normalizeActivity,
} = require("../constants/scales");
const {
  normalizeEssentialGroups,
  plainHtml,
  serializeEssentialGroups,
} = require("../domain/essentials");

function clean(value, max) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function normalizePayload(data, essentialGroups = null) {
  const secondaryValues = parseTags(data.tipoTurismoSecundario);
  const primaryTypes = [
    ...new Set([
      ...parseTags(data.tipoTurismoPrincipal),
      ...secondaryValues.filter(isTourismType),
    ]),
  ];
  const secondaryTypes = [
    ...new Set(
      secondaryValues
        .filter((value) => !isTourismType(value))
        .map(normalizeActivity),
    ),
  ];
  return {
    nombre: String(data.nombre || "").trim(),
    tipoTurismoPrincipal: serializeTags(primaryTypes),
    tipoTurismoSecundario: serializeTags(secondaryTypes),
    presupuesto: String(data.presupuesto || "").trim(),
    masificacion: String(data.masificacion || "").trim(),
    mesesJulioAgosto: Number(data.mesesJulioAgosto || 0),
    mesesMayJunSeptOct: Number(data.mesesMayJunSeptOct || 0),
    mesesNovAbril: Number(data.mesesNovAbril || 0),
    destinosItem: data.destinosItem ? String(data.destinosItem).trim() : null,
    ubicacion: String(data.ubicacion || "").trim(),
    descripcion: String(data.descripcion || "").trim(),
    imprescindibles:
      essentialGroups?.length > 0
        ? serializeEssentialGroups(essentialGroups)
        : String(data.imprescindibles || "").trim(),
    imagen: String(data.imagen || "").trim(),
    latitud:
      data.latitud === "" || data.latitud == null ? null : Number(data.latitud),
    longitud:
      data.longitud === "" || data.longitud == null
        ? null
        : Number(data.longitud),
  };
}

function validateDestino(data, essentialGroups = null) {
  if (!parseTags(data.tipoTurismoPrincipal).length) {
    const err = new Error("Falta completar: Tipo de turismo principal");
    err.status = 400;
    throw err;
  }
  const labels = {
    nombre: "Nombre del destino",
    presupuesto: "Presupuesto",
    masificacion: "Masificación",
    ubicacion: "Zona o región",
    descripcion: "Descripción",
    imagen: "Imagen de portada",
  };
  for (const [key, label] of Object.entries(labels)) {
    if (!data[key]) {
      const err = new Error(`Falta completar: ${label}`);
      err.status = 400;
      throw err;
    }
  }
  if (!plainHtml(data.imprescindibles) && !essentialGroups?.length) {
    const error = new Error("Añade al menos un imprescindible");
    error.status = 400;
    throw error;
  }
}

function normalizeMunicipioPayload(payload) {
  const nombre = String(payload.nombre || "").trim();
  if (!nombre) {
    const err = new Error("El nombre del municipio es obligatorio");
    err.status = 400;
    throw err;
  }
  return {
    nombre,
    precios: payload.precios != null ? String(payload.precios).trim() : "",
    conexiones:
      payload.conexiones != null ? String(payload.conexiones).trim() : "",
    tipoTurismo:
      payload.tipoTurismo != null ? String(payload.tipoTurismo).trim() : "",
  };
}

function mapDestinoMunicipios(destino) {
  if (!destino) return destino;
  const municipios = (destino.municipioLinks || [])
    .map((link) => link.municipio)
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const activities = (destino.activityLinks || [])
    .map((link) => link.activity)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const tourismTypes = (destino.tourismTypeLinks || [])
    .map((link) => link.tourismType)
    .filter(Boolean)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
    );
  const { municipioLinks, activityLinks, tourismTypeLinks, ...rest } = destino;
  return {
    ...rest,
    tipoTurismoPrincipal: tourismTypes.length
      ? serializeTags(tourismTypes.map((type) => type.name))
      : rest.tipoTurismoPrincipal,
    tipoTurismoSecundario: activities.length
      ? serializeTags(activities.map((activity) => activity.name))
      : rest.tipoTurismoSecundario,
    municipios,
    activities,
    activityIds: activities.map((activity) => activity.id),
    tourismTypes,
    tourismTypeIds: tourismTypes.map((type) => type.id),
  };
}

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
      municipioLinks: {
        select: {
          municipio: { select: { id: true, nombre: true } },
        },
      },
      activityLinks: { include: { activity: true } },
      tourismTypeLinks: { include: { tourismType: true } },
    },
  });
  return rows.map(mapDestinoMunicipios);
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
  return mapDestinoMunicipios(destination);
}

async function createDestino(payload) {
  const essentialGroups = normalizeEssentialGroups(payload.essentialGroups);
  const data = normalizePayload(payload, essentialGroups);
  validateDestino(data, essentialGroups);
  const created = await prisma.$transaction(async (transaction) => {
    const destination = await transaction.destino.create({ data });
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
  return mapDestinoMunicipios(created);
}

async function updateDestino(id, payload) {
  const essentialGroups = normalizeEssentialGroups(payload.essentialGroups);
  const data = normalizePayload(payload, essentialGroups);
  validateDestino(data, essentialGroups);
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
  return mapDestinoMunicipios(updated);
}

async function deleteDestino(id) {
  await prisma.destino.delete({ where: { id } });
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
    ...m,
    destinosCount: _count.destinoLinks,
  }));
}

async function createMunicipio(payload) {
  const data = normalizeMunicipioPayload(payload);
  const created = await prisma.municipio.create({
    data,
    include: { _count: { select: { destinoLinks: true } } },
  });
  return {
    id: created.id,
    nombre: created.nombre,
    precios: created.precios,
    conexiones: created.conexiones,
    tipoTurismo: created.tipoTurismo,
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

  return municipio;
}

async function unlinkMunicipio(destinoId, municipioId) {
  await prisma.destinoMunicipio.deleteMany({
    where: { destinoId, municipioId },
  });
  return { success: true };
}

function normalizePlace(payload) {
  const nombre = clean(payload.nombre, 100);
  const categoria = clean(payload.categoria, 40);
  const latitud = Number(payload.latitud);
  const longitud = Number(payload.longitud);
  if (
    !nombre ||
    !categoria ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    Math.abs(latitud) > 90 ||
    Math.abs(longitud) > 180
  ) {
    const error = new Error(
      "Nombre, categoría y coordenadas válidas son obligatorios",
    );
    error.status = 400;
    throw error;
  }
  return {
    nombre,
    categoria,
    latitud,
    longitud,
    descripcion: clean(payload.descripcion, 500),
    website: clean(payload.website, 300),
    sortOrder: Number.isInteger(Number(payload.sortOrder))
      ? Number(payload.sortOrder)
      : 0,
    isActive: payload.isActive !== false,
  };
}

async function listPlaces(destinoId) {
  return prisma.place.findMany({
    where: { destinoId },
    orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }],
  });
}
async function createPlace(destinoId, payload) {
  return prisma.place.create({
    data: { destinoId, ...normalizePlace(payload) },
  });
}
async function updatePlace(id, payload) {
  return prisma.place.update({ where: { id }, data: normalizePlace(payload) });
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
