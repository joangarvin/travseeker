const { prisma } = require('../config/database');
const { LIST_SELECT } = require('../constants/selects');

function clean(str, max) {
  if (typeof str !== 'string') return null;
  const t = str.trim();
  return t ? t.slice(0, max) : null;
}

async function assertOwned(userId, collectionId) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!collection) {
    const error = new Error('Colección no encontrada');
    error.status = 404;
    throw error;
  }
}

async function listCollections(userId) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { destino: { select: { imagen: true } } },
      },
    },
  });

  return collections.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    color: c.color,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    count: c._count.items,
    covers: c.items.map((i) => i.destino.imagen),
  }));
}

async function getCollection(userId, id) {
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: { destino: { select: LIST_SELECT } },
      },
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
  await assertOwned(userId, id);

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

async function deleteCollection(userId, id) {
  await assertOwned(userId, id);
  await prisma.collection.delete({ where: { id } });
  return { removed: true };
}

async function addItem(userId, collectionId, destinoId, notas) {
  await assertOwned(userId, collectionId);

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
  await assertOwned(userId, collectionId);
  const cleanNotes = clean(notas, 500);
  await prisma.collectionItem.update({
    where: { collectionId_destinoId: { collectionId, destinoId } },
    data: { notas: cleanNotes },
  });
  return { notas: cleanNotes };
}

async function removeItem(userId, collectionId, destinoId) {
  await assertOwned(userId, collectionId);
  await prisma.collectionItem.deleteMany({ where: { collectionId, destinoId } });
  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return { removed: true };
}

async function getCollectionsForDestino(userId, destinoId) {
  const collections = await prisma.collection.findMany({
    where: { userId },
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
};
