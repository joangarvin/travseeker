const { publicGeography } = require("../domain/publication");
const {
  cleanCollectionText,
  optionalDate,
  optionalTravelerCount,
  validateTripRange,
  normalizeCollectionItem,
} = require("../domain/collectionPayload");
const {
  COLLECTION_DESTINATION_SELECT,
  mapCollectionSummary,
  mapPrivateCollection,
  mapPublicCollection,
} = require("../domain/collectionResponses");
const { prisma } = require("../config/database");
const { randomBytes } = require("crypto");
const { canAccess } = require("../domain/collectionAccess");
const { buildCollectionOrder } = require("../domain/collectionOrder");
const {
  normalizeItinerary,
  reconcileItineraryDates,
} = require("../domain/itinerary");

async function getAccess(userId, collectionId, required = "viewer") {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId },
    select: {
      id: true,
      userId: true,
      members: { where: { userId }, select: { role: true } },
    },
  });
  const role =
    collection?.userId === userId ? "owner" : collection?.members[0]?.role;
  if (!collection || !canAccess(role, required)) {
    const error = new Error("Colección no encontrada");
    error.status = 404;
    throw error;
  }
  return { role, ownerId: collection.userId };
}

async function listCollections(userId) {
  const collections = await prisma.collection.findMany({
    where: { OR: [{ userId }, { members: { some: { userId } } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        where: {
          destino: { editorialStatus: "published", ...publicGeography() },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { destino: { select: { imagen: true } } },
      },
      members: { where: { userId }, select: { role: true } },
      _count: { select: { items: true, members: true } },
    },
  });

  return collections.map((collection) =>
    mapCollectionSummary(collection, userId),
  );
}

async function getCollection(userId, id) {
  const access = await getAccess(userId, id);
  const collection = await prisma.collection.findFirst({
    where: { id },
    include: {
      user: { select: { id: true, nombre: true, avatarUrl: true } },
      items: {
        where: {
          destino: { editorialStatus: "published", ...publicGeography() },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { destino: { select: COLLECTION_DESTINATION_SELECT } },
      },
      members: {
        include: {
          user: {
            select: { id: true, email: true, nombre: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!collection) {
    const error = new Error("Colección no encontrada");
    error.status = 404;
    throw error;
  }

  return mapPrivateCollection(collection, access.role);
}

async function createCollection(
  userId,
  { nombre, descripcion, color, startDate, endDate, travelerCount },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    const error = new Error("Verifica tu email antes de crear colecciones");
    error.status = 403;
    throw error;
  }

  const cleanName = cleanCollectionText(nombre, 80);
  if (!cleanName) {
    const error = new Error("El nombre de la colección es obligatorio");
    error.status = 400;
    throw error;
  }

  const parsedStart = optionalDate(startDate, "La fecha de inicio");
  const parsedEnd = optionalDate(endDate, "La fecha de fin");
  validateTripRange(parsedStart, parsedEnd);

  const collection = await prisma.collection.create({
    data: {
      userId,
      nombre: cleanName,
      descripcion: cleanCollectionText(descripcion, 280),
      color: color || "emerald",
      startDate: parsedStart ?? null,
      endDate: parsedEnd ?? null,
      travelerCount: optionalTravelerCount(travelerCount) ?? 2,
    },
  });
  return { ...collection, count: 0, covers: [] };
}

async function updateCollection(
  userId,
  id,
  { nombre, descripcion, color, startDate, endDate, travelerCount, itinerary },
) {
  await getAccess(userId, id, "editor");

  const data = {};
  if (nombre !== undefined) {
    const cleanName = cleanCollectionText(nombre, 80);
    if (!cleanName) {
      const error = new Error("El nombre no puede estar vacío");
      error.status = 400;
      throw error;
    }
    data.nombre = cleanName;
  }
  if (descripcion !== undefined)
    data.descripcion = cleanCollectionText(descripcion, 280);
  if (color !== undefined) data.color = color;
  const parsedStart = optionalDate(startDate, "La fecha de inicio");
  const parsedEnd = optionalDate(endDate, "La fecha de fin");
  if (parsedStart !== undefined) data.startDate = parsedStart;
  if (parsedEnd !== undefined) data.endDate = parsedEnd;
  const parsedTravelerCount = optionalTravelerCount(travelerCount);
  if (parsedTravelerCount !== undefined)
    data.travelerCount = parsedTravelerCount;
  const current = await prisma.collection.findUnique({
    where: { id },
    select: { startDate: true, endDate: true, itinerary: true },
  });
  const effectiveStart =
    parsedStart === undefined ? current.startDate : parsedStart;
  const effectiveEnd = parsedEnd === undefined ? current.endDate : parsedEnd;
  validateTripRange(effectiveStart, effectiveEnd);

  if (itinerary !== undefined) {
    const items = await prisma.collectionItem.findMany({
      where: { collectionId: id },
      select: {
        destinoId: true,
        destino: {
          select: { municipioLinks: { select: { municipioId: true } } },
        },
      },
    });
    data.itinerary = normalizeItinerary(itinerary, {
      destinationIds: new Set(items.map((item) => item.destinoId)),
      municipalityIdsByDestination: new Map(
        items.map((item) => [
          item.destinoId,
          new Set(item.destino.municipioLinks.map((link) => link.municipioId)),
        ]),
      ),
    });
  } else if (startDate !== undefined || endDate !== undefined) {
    data.itinerary = reconcileItineraryDates(
      Array.isArray(current.itinerary) ? current.itinerary : [],
      effectiveStart,
      effectiveEnd,
    );
  }

  return prisma.collection.update({ where: { id }, data });
}

async function shareCollection(userId, id, { regenerate = false } = {}) {
  await getAccess(userId, id, "owner");
  if (!regenerate) {
    const current = await prisma.collection.findUnique({
      where: { id },
      select: { id: true, shareToken: true, visibility: true },
    });
    if (current?.shareToken && current.visibility === "shared") return current;
  }
  const shareToken = randomBytes(24).toString("base64url");
  return prisma.collection.update({
    where: { id },
    data: { visibility: "shared", shareToken },
    select: { id: true, shareToken: true, visibility: true },
  });
}

async function stopSharingCollection(userId, id) {
  await getAccess(userId, id, "owner");
  return prisma.collection.update({
    where: { id },
    data: { visibility: "private", shareToken: null },
    select: { id: true, visibility: true },
  });
}

async function getPublicCollection(shareToken) {
  const collection = await prisma.collection.findFirst({
    where: { shareToken, visibility: "shared" },
    include: {
      user: { select: { id: true, nombre: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, nombre: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      items: {
        where: {
          destino: { editorialStatus: "published", ...publicGeography() },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { destino: { select: COLLECTION_DESTINATION_SELECT } },
      },
    },
  });
  if (!collection) {
    const error = new Error("Este enlace de viaje ya no está disponible");
    error.status = 404;
    throw error;
  }
  return mapPublicCollection(collection);
}

async function deleteCollection(userId, id) {
  await getAccess(userId, id, "owner");
  await prisma.collection.delete({ where: { id } });
  return { removed: true };
}

async function addItem(userId, collectionId, destinoId, notas) {
  await getAccess(userId, collectionId, "editor");

  const destino = await prisma.destino.findFirst({
    where: {
      id: destinoId,
      editorialStatus: "published",
      ...publicGeography(),
    },
    select: { id: true },
  });
  if (!destino) {
    const error = new Error("Destino no encontrado");
    error.status = 404;
    throw error;
  }

  const cleanNotes = cleanCollectionText(notas, 500);
  const item = await prisma.collectionItem.upsert({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    update: cleanNotes !== null ? { notas: cleanNotes } : {},
    create: { collectionId, destinoId, notas: cleanNotes },
  });

  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return item;
}

async function updateItem(userId, collectionId, destinoId, payload) {
  await getAccess(userId, collectionId, "editor");
  const data = normalizeCollectionItem(payload);
  const item = await prisma.collectionItem.update({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    data,
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return item;
}

async function reorderItems(userId, collectionId, orderedDestinoIds) {
  await getAccess(userId, collectionId, "editor");
  const current = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { destinoId: true },
  });
  const order = buildCollectionOrder(
    current.map((item) => item.destinoId),
    orderedDestinoIds,
  );
  await prisma.$transaction([
    ...order.map(({ destinoId, sortOrder }) =>
      prisma.collectionItem.update({
        where: { collectionId_destinoId: { collectionId, destinoId } },
        data: { sortOrder },
      }),
    ),
    prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return { order: orderedDestinoIds };
}

async function removeItem(userId, collectionId, destinoId) {
  await getAccess(userId, collectionId, "editor");
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { itinerary: true },
  });
  const itinerary = (
    Array.isArray(collection?.itinerary) ? collection.itinerary : []
  )
    .filter((day) => day.destinationId !== destinoId)
    .map((day, index) => ({ ...day, dayNumber: index + 1 }));
  await prisma.$transaction([
    prisma.collectionItem.deleteMany({ where: { collectionId, destinoId } }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { itinerary, updatedAt: new Date() },
    }),
  ]);
  return { removed: true };
}

async function getCollectionsForDestino(userId, destinoId) {
  const collections = await prisma.collection.findMany({
    where: {
      OR: [{ userId }, { members: { some: { userId, role: "editor" } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: { items: { where: { destinoId }, select: { id: true } } },
  });

  return collections.map((collection) => ({
    id: collection.id,
    nombre: collection.nombre,
    color: collection.color,
    contains: collection.items.length > 0,
  }));
}

async function addMember(userId, collectionId, { email, role }) {
  await getAccess(userId, collectionId, "owner");
  if (!["editor", "viewer"].includes(role)) {
    const error = new Error("El permiso debe ser editor o lector");
    error.status = 400;
    throw error;
  }
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const invited = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, email: true, nombre: true, avatarUrl: true },
  });
  if (!invited) {
    const error = new Error("No existe una cuenta con ese email");
    error.status = 404;
    throw error;
  }
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });
  if (invited.id === collection.userId) {
    const error = new Error("El propietario ya forma parte del viaje");
    error.status = 400;
    throw error;
  }
  const member = await prisma.collectionMember.upsert({
    where: { collectionId_userId: { collectionId, userId: invited.id } },
    update: { role },
    create: { collectionId, userId: invited.id, role },
  });
  return { id: member.id, role: member.role, user: invited };
}

async function updateMember(userId, collectionId, memberId, role) {
  await getAccess(userId, collectionId, "owner");
  if (!["editor", "viewer"].includes(role)) {
    const error = new Error("Permiso no válido");
    error.status = 400;
    throw error;
  }
  return prisma.collectionMember.update({
    where: { id: memberId, collectionId },
    data: { role },
    include: {
      user: {
        select: { id: true, email: true, nombre: true, avatarUrl: true },
      },
    },
  });
}

async function removeMember(userId, collectionId, memberId) {
  await getAccess(userId, collectionId, "owner");
  await prisma.collectionMember.deleteMany({
    where: { id: memberId, collectionId },
  });
  return { removed: true };
}

module.exports = {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addItem,
  updateItem,
  reorderItems,
  removeItem,
  getCollectionsForDestino,
  shareCollection,
  stopSharingCollection,
  getPublicCollection,
  addMember,
  updateMember,
  removeMember,
};
