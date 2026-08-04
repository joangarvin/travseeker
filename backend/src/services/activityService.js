const { prisma } = require("../config/database");
const {
  ACTIVITY_ICONS,
  normalizeActivity,
  parseTags,
  serializeTags,
} = require("../constants/scales");

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validatePayload(payload) {
  const name = normalizeActivity(String(payload.name || "").trim()).slice(
    0,
    80,
  );
  const icon = ACTIVITY_ICONS.includes(payload.icon) ? payload.icon : "Compass";
  const sortOrder = Number.isInteger(Number(payload.sortOrder))
    ? Number(payload.sortOrder)
    : 0;

  if (name.length < 2) {
    const error = new Error(
      "Escribe un nombre de actividad de al menos dos caracteres",
    );
    error.status = 400;
    throw error;
  }

  const slug = slugify(name);
  if (!slug) {
    const error = new Error(
      "El nombre de la actividad debe contener letras o números",
    );
    error.status = 400;
    throw error;
  }

  return {
    name,
    slug,
    icon,
    sortOrder,
    isActive: payload.isActive !== false,
  };
}

function withCount(activity) {
  const { _count, ...rest } = activity;
  return { ...rest, destinationsCount: _count?.destinationLinks || 0 };
}

async function assertUnique(data, excludedId) {
  const existing = await prisma.activity.findFirst({
    where: {
      id: excludedId ? { not: excludedId } : undefined,
      OR: [
        { name: { equals: data.name, mode: "insensitive" } },
        { slug: data.slug },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    const error = new Error("Ya existe una actividad con ese nombre");
    error.status = 409;
    throw error;
  }
}

async function listPublicActivities() {
  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { destinationLinks: true } } },
  });
  return activities.map(withCount);
}

async function listAdminActivities() {
  const activities = await prisma.activity.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { destinationLinks: true } } },
  });
  return activities.map(withCount);
}

async function createActivity(payload) {
  const data = validatePayload(payload);
  await assertUnique(data);
  const activity = await prisma.activity.create({
    data,
    include: { _count: { select: { destinationLinks: true } } },
  });
  return withCount(activity);
}

async function updateActivity(id, payload) {
  const data = validatePayload(payload);
  await assertUnique(data, id);
  const current = await prisma.activity.findUnique({
    where: { id },
    include: {
      destinationLinks: {
        select: {
          destino: { select: { id: true, tipoTurismoSecundario: true } },
        },
      },
    },
  });
  if (!current) {
    const error = new Error("Actividad no encontrada");
    error.status = 404;
    throw error;
  }

  await prisma.$transaction(async (transaction) => {
    if (current.name !== data.name) {
      for (const link of current.destinationLinks) {
        const names = parseTags(link.destino.tipoTurismoSecundario).map(
          (name) =>
            name.toLocaleLowerCase("es") ===
            current.name.toLocaleLowerCase("es")
              ? data.name
              : name,
        );
        await transaction.destino.update({
          where: { id: link.destino.id },
          data: { tipoTurismoSecundario: serializeTags(names) },
        });
      }
    }
    await transaction.activity.update({ where: { id }, data });
  });

  const updated = await prisma.activity.findUnique({
    where: { id },
    include: { _count: { select: { destinationLinks: true } } },
  });
  return withCount(updated);
}

async function deleteActivity(id) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      destinationLinks: {
        select: {
          destino: { select: { id: true, tipoTurismoSecundario: true } },
        },
      },
    },
  });
  if (!activity) {
    const error = new Error("Actividad no encontrada");
    error.status = 404;
    throw error;
  }

  await prisma.$transaction(async (transaction) => {
    for (const link of activity.destinationLinks) {
      const names = parseTags(link.destino.tipoTurismoSecundario).filter(
        (name) =>
          name.toLocaleLowerCase("es") !==
          activity.name.toLocaleLowerCase("es"),
      );
      await transaction.destino.update({
        where: { id: link.destino.id },
        data: { tipoTurismoSecundario: serializeTags(names) },
      });
    }
    await transaction.activity.delete({ where: { id } });
  });

  return {
    success: true,
    removedFromDestinations: activity.destinationLinks.length,
  };
}

module.exports = {
  listPublicActivities,
  listAdminActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  slugify,
  validatePayload,
};
