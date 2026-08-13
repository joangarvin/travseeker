const { prisma } = require("../config/database");
const {
  TOURISM_COLORS,
  TOURISM_ICONS,
  parseTags,
  serializeTags,
} = require("../constants/scales");
const { slugify } = require("./activityService");

function validatePayload(payload) {
  const name = String(payload.name || "")
    .trim()
    .slice(0, 80);
  const description = String(payload.description || "")
    .trim()
    .slice(0, 180);
  const icon = TOURISM_ICONS.includes(payload.icon) ? payload.icon : "Compass";
  const colorKey = TOURISM_COLORS.includes(payload.colorKey)
    ? payload.colorKey
    : "otro";
  const requestedColor = String(payload.colorValue || "")
    .trim()
    .toLowerCase();
  const defaultColors = {
    cultural: "#3047f2",
    naturaleza: "#256628",
    playa: "#006b63",
    rural: "#6d4c41",
    montana: "#4b4db0",
    patrimonial: "#8c1046",
    otro: "#5f6470",
  };
  const colorValue = /^#[0-9a-f]{6}$/.test(requestedColor)
    ? requestedColor
    : defaultColors[colorKey];
  const sortOrder = Number.isInteger(Number(payload.sortOrder))
    ? Number(payload.sortOrder)
    : 0;
  if (name.length < 2) {
    const error = new Error(
      "Escribe un nombre de tipo de viaje de al menos dos caracteres",
    );
    error.status = 400;
    throw error;
  }
  const slug = slugify(name);
  if (!slug) {
    const error = new Error("El nombre debe contener letras o números");
    error.status = 400;
    throw error;
  }
  return {
    name,
    slug,
    description,
    icon,
    colorKey,
    colorValue,
    sortOrder,
    isActive: payload.isActive !== false,
  };
}

function withCount(type) {
  const { _count, ...rest } = type;
  return { ...rest, destinationsCount: _count?.destinationLinks || 0 };
}

async function assertUnique(data, excludedId) {
  const existing = await prisma.tourismType.findFirst({
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
    const error = new Error("Ya existe un tipo de viaje con ese nombre");
    error.status = 409;
    throw error;
  }
}

async function listPublic() {
  const rows = await prisma.tourismType.findMany({
    where: { isActive: true, editorialStatus: "published" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          destinationLinks: {
            where: { destino: { editorialStatus: "published" } },
          },
        },
      },
    },
  });
  return rows.map(withCount);
}

async function listAdmin() {
  const rows = await prisma.tourismType.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { destinationLinks: true } } },
  });
  return rows.map(withCount);
}

async function create(payload, createdById) {
  const data = validatePayload(payload);
  await assertUnique(data);
  return withCount(
    await prisma.tourismType.create({
      data: {
        ...data,
        isActive: false,
        editorialStatus: "pending",
        createdById,
      },
      include: { _count: { select: { destinationLinks: true } } },
    }),
  );
}

async function update(id, payload) {
  const data = validatePayload(payload);
  await assertUnique(data, id);
  const current = await prisma.tourismType.findUnique({
    where: { id },
    include: {
      destinationLinks: {
        select: {
          destino: { select: { id: true, tipoTurismoPrincipal: true } },
        },
      },
    },
  });
  if (!current) {
    const error = new Error("Tipo de viaje no encontrado");
    error.status = 404;
    throw error;
  }
  data.isActive = current.editorialStatus === "published";
  await prisma.$transaction(async (transaction) => {
    if (current.name !== data.name) {
      for (const link of current.destinationLinks) {
        const names = parseTags(link.destino.tipoTurismoPrincipal).map(
          (name) =>
            name.toLocaleLowerCase("es") ===
            current.name.toLocaleLowerCase("es")
              ? data.name
              : name,
        );
        await transaction.destino.update({
          where: { id: link.destino.id },
          data: { tipoTurismoPrincipal: serializeTags(names) },
        });
      }
    }
    await transaction.tourismType.update({ where: { id }, data });
  });
  return withCount(
    await prisma.tourismType.findUnique({
      where: { id },
      include: { _count: { select: { destinationLinks: true } } },
    }),
  );
}

async function remove(id) {
  const type = await prisma.tourismType.findUnique({
    where: { id },
    include: {
      destinationLinks: {
        select: {
          destino: { select: { id: true, tipoTurismoPrincipal: true } },
        },
      },
    },
  });
  if (!type) {
    const error = new Error("Tipo de viaje no encontrado");
    error.status = 404;
    throw error;
  }
  await prisma.$transaction(async (transaction) => {
    for (const link of type.destinationLinks) {
      const names = parseTags(link.destino.tipoTurismoPrincipal).filter(
        (name) =>
          name.toLocaleLowerCase("es") !== type.name.toLocaleLowerCase("es"),
      );
      await transaction.destino.update({
        where: { id: link.destino.id },
        data: { tipoTurismoPrincipal: serializeTags(names) },
      });
    }
    await transaction.tourismType.delete({ where: { id } });
  });
  return {
    success: true,
    removedFromDestinations: type.destinationLinks.length,
  };
}

module.exports = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
  validatePayload,
};
