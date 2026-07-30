const { prisma } = require('../config/database');
const { randomBytes } = require('crypto');
const { LIST_SELECT } = require('../constants/selects');
const { canAccess } = require('../domain/collectionAccess');

function clean(str, max) {
  if (typeof str !== 'string') return null;
  const t = str.trim();
  return t ? t.slice(0, max) : null;
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
        orderBy: { createdAt: 'desc' },
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
    role: access.role,
    members: collection.members.map((member) => ({ id: member.id, role: member.role, user: member.user })),
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    items: collection.items.map((i) => ({
      id: i.id,
      destinoId: i.destinoId,
      notas: i.notas,
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

async function updateCollection(userId, id, { nombre, descripcion, color }) {
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
    include: { items: { orderBy: { createdAt: 'asc' }, include: { destino: { select: LIST_SELECT } } } },
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
    items: collection.items.map((item) => ({ id: item.id, destino: item.destino })),
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

async function updateItemNotes(userId, collectionId, destinoId, notas) {
  await getAccess(userId, collectionId, 'editor');
  const cleanNotes = clean(notas, 500);
  await prisma.collectionItem.update({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    data: { notas: cleanNotes },
  });
  return { notas: cleanNotes };
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
  updateItemNotes,
  removeItem,
  getCollectionsForDestino,
  shareCollection,
  stopSharingCollection,
  getPublicCollection,
  addMember,
  updateMember,
  removeMember,
};
