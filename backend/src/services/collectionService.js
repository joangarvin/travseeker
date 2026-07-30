const { prisma } = require('../config/database');
const { randomBytes } = require('crypto');
const { LIST_SELECT } = require('../constants/selects');
const { canAccess } = require('../domain/collectionAccess');

function clean(str, max) {
  if (typeof str !== 'string') return null;
  const t = str.trim();
  return t ? t.slice(0, max) : null;
}

function optionalDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(`${field} debe tener formato AAAA-MM-DD`); error.status = 400; throw error;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) { const error = new Error(`${field} no es válida`); error.status = 400; throw error; }
  return parsed;
}

async function getAccess(userId, collectionId, required = 'viewer') {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId },
    select: { id: true, userId: true, members: { where: { userId }, select: { role: true } } },
  });
  const role = collection?.userId === userId ? 'owner' : collection?.members[0]?.role;
  if (!collection || !canAccess(role, required)) {
    const error = new Error('Colección no encontrada');
    error.status = 404;
    throw error;
  }
  return { role, ownerId: collection.userId };
}

async function listCollections(userId) {
  const collections = await prisma.collection.findMany({
    where: { OR: [{ userId }, { members: { some: { userId } } }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { destino: { select: { imagen: true } } },
      },
      members: { where: { userId }, select: { role: true } },
    },
  });

  return collections.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    color: c.color,
    visibility: c.visibility,
    startDate: c.startDate,
    endDate: c.endDate,
    role: c.userId === userId ? 'owner' : c.members[0]?.role || 'viewer',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    count: c._count.items,
    covers: c.items.map((i) => i.destino.imagen),
  }));
}

async function getCollection(userId, id) {
  const access = await getAccess(userId, id);
  const collection = await prisma.collection.findFirst({
    where: { id },
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { destino: { select: LIST_SELECT } },
      },
      members: { include: { user: { select: { id: true, email: true, nombre: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!collection) {
    const error = new Error('Colección no encontrada');
    error.status = 404;
    throw error;
  }

  return {
    id: collection.id,
    nombre: collection.nombre,
    descripcion: collection.descripcion,
    color: collection.color,
    visibility: collection.visibility,
    shareToken: collection.shareToken,
    startDate: collection.startDate,
    endDate: collection.endDate,
    role: access.role,
    members: collection.members.map((member) => ({ id: member.id, role: member.role, user: member.user })),
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    items: collection.items.map((i) => ({
      id: i.id,
      destinoId: i.destinoId,
      notas: i.notas,
      dayIndex: i.dayIndex,
      status: i.status,
      sortOrder: i.sortOrder,
      createdAt: i.createdAt,
      destino: i.destino,
    })),
  };
}

async function createCollection(userId, { nombre, descripcion, color }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    const error = new Error('Verifica tu email antes de crear colecciones');
    error.status = 403;
    throw error;
  }

  const cleanName = clean(nombre, 80);
  if (!cleanName) {
    const error = new Error('El nombre de la colección es obligatorio');
    error.status = 400;
    throw error;
  }

  const collection = await prisma.collection.create({
    data: {
      userId,
      nombre: cleanName,
      descripcion: clean(descripcion, 280),
      color: color || 'emerald',
    },
  });
  return { ...collection, count: 0, covers: [] };
}

async function updateCollection(userId, id, { nombre, descripcion, color, startDate, endDate }) {
  await getAccess(userId, id, 'editor');

  const data = {};
  if (nombre !== undefined) {
    const cleanName = clean(nombre, 80);
    if (!cleanName) {
      const error = new Error('El nombre no puede estar vacío');
      error.status = 400;
      throw error;
    }
    data.nombre = cleanName;
  }
  if (descripcion !== undefined) data.descripcion = clean(descripcion, 280);
  if (color !== undefined) data.color = color;
  const parsedStart = optionalDate(startDate, 'La fecha de inicio');
  const parsedEnd = optionalDate(endDate, 'La fecha de fin');
  if (parsedStart !== undefined) data.startDate = parsedStart;
  if (parsedEnd !== undefined) data.endDate = parsedEnd;
  const current = await prisma.collection.findUnique({ where: { id }, select: { startDate: true, endDate: true } });
  const effectiveStart = parsedStart === undefined ? current.startDate : parsedStart;
  const effectiveEnd = parsedEnd === undefined ? current.endDate : parsedEnd;
  if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
    const error = new Error('La fecha de fin no puede ser anterior al inicio'); error.status = 400; throw error;
  }

  return prisma.collection.update({ where: { id }, data });
}

async function shareCollection(userId, id) {
  await getAccess(userId, id, 'owner');
  const shareToken = randomBytes(24).toString('base64url');
  return prisma.collection.update({
    where: { id },
    data: { visibility: 'shared', shareToken },
    select: { id: true, shareToken: true, visibility: true },
  });
}

async function stopSharingCollection(userId, id) {
  await getAccess(userId, id, 'owner');
  return prisma.collection.update({
    where: { id },
    data: { visibility: 'private', shareToken: null },
    select: { id: true, visibility: true },
  });
}

async function getPublicCollection(shareToken) {
  const collection = await prisma.collection.findFirst({
    where: { shareToken, visibility: 'shared' },
    include: { items: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], include: { destino: { select: LIST_SELECT } } } },
  });
  if (!collection) {
    const error = new Error('Este enlace de viaje ya no está disponible');
    error.status = 404;
    throw error;
  }
  return {
    nombre: collection.nombre,
    descripcion: collection.descripcion,
    color: collection.color,
    startDate: collection.startDate,
    endDate: collection.endDate,
    items: collection.items.map((item) => ({ id: item.id, dayIndex: item.dayIndex, status: item.status, sortOrder: item.sortOrder, destino: item.destino })),
  };
}

async function deleteCollection(userId, id) {
  await getAccess(userId, id, 'owner');
  await prisma.collection.delete({ where: { id } });
  return { removed: true };
}

async function addItem(userId, collectionId, destinoId, notas) {
  await getAccess(userId, collectionId, 'editor');

  const destino = await prisma.destino.findUnique({ where: { id: destinoId }, select: { id: true } });
  if (!destino) {
    const error = new Error('Destino no encontrado');
    error.status = 404;
    throw error;
  }

  const cleanNotes = clean(notas, 500);
  const item = await prisma.collectionItem.upsert({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    update: cleanNotes !== null ? { notas: cleanNotes } : {},
    create: { collectionId, destinoId, notas: cleanNotes },
  });

  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return item;
}

async function updateItem(userId, collectionId, destinoId, payload) {
  await getAccess(userId, collectionId, 'editor');
  const data = {};
  if (payload.notas !== undefined) data.notas = clean(payload.notas, 500);
  if (payload.dayIndex !== undefined) {
    const day = payload.dayIndex === null || payload.dayIndex === '' ? null : Number(payload.dayIndex);
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 365)) { const error = new Error('El día debe estar entre 1 y 365'); error.status = 400; throw error; }
    data.dayIndex = day;
  }
  if (payload.status !== undefined) {
    if (!['idea', 'confirmed', 'booked'].includes(payload.status)) { const error = new Error('Estado no válido'); error.status = 400; throw error; }
    data.status = payload.status;
  }
  if (payload.sortOrder !== undefined) {
    const order = Number(payload.sortOrder);
    if (!Number.isInteger(order) || order < 0 || order > 9999) { const error = new Error('Posición no válida'); error.status = 400; throw error; }
    data.sortOrder = order;
  }
  const item = await prisma.collectionItem.update({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    data,
  });
  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return item;
}

async function removeItem(userId, collectionId, destinoId) {
  await getAccess(userId, collectionId, 'editor');
  await prisma.collectionItem.deleteMany({ where: { collectionId, destinoId } });
  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return { removed: true };
}

async function getCollectionsForDestino(userId, destinoId) {
  const collections = await prisma.collection.findMany({
    where: { OR: [{ userId }, { members: { some: { userId, role: 'editor' } } }] },
    orderBy: { updatedAt: 'desc' },
    include: { items: { where: { destinoId }, select: { id: true } } },
  });

  return collections.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    contains: c.items.length > 0,
  }));
}

async function addMember(userId, collectionId, { email, role }) {
  await getAccess(userId, collectionId, 'owner');
  if (!['editor', 'viewer'].includes(role)) {
    const error = new Error('El permiso debe ser editor o lector'); error.status = 400; throw error;
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  const invited = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true, email: true, nombre: true, avatarUrl: true } });
  if (!invited) { const error = new Error('No existe una cuenta con ese email'); error.status = 404; throw error; }
  const collection = await prisma.collection.findUnique({ where: { id: collectionId }, select: { userId: true } });
  if (invited.id === collection.userId) { const error = new Error('El propietario ya forma parte del viaje'); error.status = 400; throw error; }
  const member = await prisma.collectionMember.upsert({
    where: { collectionId_userId: { collectionId, userId: invited.id } },
    update: { role }, create: { collectionId, userId: invited.id, role },
  });
  return { id: member.id, role: member.role, user: invited };
}

async function updateMember(userId, collectionId, memberId, role) {
  await getAccess(userId, collectionId, 'owner');
  if (!['editor', 'viewer'].includes(role)) { const error = new Error('Permiso no válido'); error.status = 400; throw error; }
  return prisma.collectionMember.update({ where: { id: memberId, collectionId }, data: { role }, include: { user: { select: { id: true, email: true, nombre: true, avatarUrl: true } } } });
}

async function removeMember(userId, collectionId, memberId) {
  await getAccess(userId, collectionId, 'owner');
  await prisma.collectionMember.deleteMany({ where: { id: memberId, collectionId } });
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
  removeItem,
  getCollectionsForDestino,
  shareCollection,
  stopSharingCollection,
  getPublicCollection,
  addMember,
  updateMember,
  removeMember,
};
