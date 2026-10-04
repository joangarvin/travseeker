const {
  pagination,
  encodeEditorialCursor,
  editorialCursorWhere,
} = require("../domain/pagination");
const { prisma } = require("../config/database");
const {
  EDITORIAL_RESOURCES,
  assertEditorialTransition,
  editorialUpdateData,
  validateEditorialIds,
  validateEditorialResource,
  validateEditorialStatus,
} = require("../domain/editorial");

const USER_SELECT = {
  id: true,
  nombre: true,
  apellidos: true,
  avatarUrl: true,
  email: true,
};

function delegateFor(resource) {
  const config = validateEditorialResource(resource);
  return { config, delegate: prisma[config.model] };
}

function editorialSelect(config) {
  return {
    id: true,
    [config.labelField]: true,
    editorialStatus: true,
    submittedAt: true,
    reviewedAt: true,
    createdBy: { select: USER_SELECT },
    reviewedBy: { select: USER_SELECT },
    ...(config.publicActive ? { isActive: true } : {}),
  };
}

function normalizeItem(resource, config, item) {
  return {
    ...item,
    resource,
    title: item[config.labelField],
  };
}

function listWhere(config, query) {
  const status = validateEditorialStatus(query.status || "pending", {
    allowAll: true,
  });
  const search = String(query.q || "")
    .trim()
    .slice(0, 120);
  return {
    ...(status === "all" ? {} : { editorialStatus: status }),
    ...(search
      ? { [config.labelField]: { contains: search, mode: "insensitive" } }
      : {}),
  };
}

async function listEditorial(query = {}) {
  const requestedResource = query.resource || "all";
  const resources =
    requestedResource === "all"
      ? Object.keys(EDITORIAL_RESOURCES)
      : [requestedResource];
  resources.forEach(validateEditorialResource);

  const { take } = pagination(query);
  const pages = await Promise.all(
    resources.map(async (resource) => {
      const { config, delegate } = delegateFor(resource);
      const where = listWhere(config, query);
      const [items, counts] = await Promise.all([
        delegate.findMany({
          where: { AND: [where, editorialCursorWhere(query.cursor, resource)] },
          select: editorialSelect(config),
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
          take: take + 1,
        }),
        delegate.groupBy({
          by: ["editorialStatus"],
          where: listWhere(config, { ...query, status: "all" }),
          _count: { _all: true },
        }),
      ]);
      return {
        items: items.map((item) => normalizeItem(resource, config, item)),
        counts,
      };
    }),
  );
  const merged = pages
    .flatMap((page) => page.items)
    .sort(
      (a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt) ||
        (a.id < b.id
          ? 1
          : a.id > b.id
            ? -1
            : a.resource < b.resource
              ? -1
              : a.resource > b.resource
                ? 1
                : 0),
    );
  const items = merged.slice(0, take);
  const counts = { all: 0, pending: 0, draft: 0, published: 0, archived: 0 };
  pages.forEach((page) =>
    page.counts.forEach((row) => {
      counts[row.editorialStatus] += row._count._all;
      counts.all += row._count._all;
    }),
  );
  return {
    items,
    counts,
    nextCursor:
      merged.length > take ? encodeEditorialCursor(items.at(-1)) : null,
  };
}

async function getPendingCounts() {
  const entries = await Promise.all(
    Object.entries(EDITORIAL_RESOURCES).map(async ([resource, config]) => [
      resource,
      await prisma[config.model].count({
        where: { editorialStatus: "pending" },
      }),
    ]),
  );
  const byResource = Object.fromEntries(entries);
  return {
    total: Object.values(byResource).reduce((total, count) => total + count, 0),
    byResource,
  };
}

async function transitionOne(resource, id, status, reviewerId) {
  const { config, delegate } = delegateFor(resource);
  validateEditorialStatus(status);
  const current = await delegate.findUnique({
    where: { id },
    select: { id: true, editorialStatus: true },
  });
  if (!current) {
    const error = new Error("Contenido editorial no encontrado");
    error.status = 404;
    throw error;
  }
  assertEditorialTransition(current.editorialStatus, status);
  const updated = await delegate.update({
    where: { id },
    data: {
      ...editorialUpdateData(status, reviewerId),
      ...(config.publicActive ? { isActive: status === "published" } : {}),
    },
    select: editorialSelect(config),
  });
  return normalizeItem(resource, config, updated);
}

async function transitionBatch(resource, ids, status, reviewerId) {
  const cleanIds = validateEditorialIds(ids);
  const { config, delegate } = delegateFor(resource);
  validateEditorialStatus(status);
  const existing = await delegate.findMany({
    where: { id: { in: cleanIds } },
    select: { id: true, editorialStatus: true },
  });
  if (existing.length !== cleanIds.length) {
    const error = new Error("Algún contenido seleccionado ya no existe");
    error.status = 404;
    throw error;
  }
  existing.forEach((item) =>
    assertEditorialTransition(item.editorialStatus, status),
  );
  await prisma.$transaction(
    existing.map((item) =>
      delegate.update({
        where: { id: item.id },
        data: {
          ...editorialUpdateData(status, reviewerId),
          ...(config.publicActive ? { isActive: status === "published" } : {}),
        },
      }),
    ),
  );
  return { updated: existing.length, ids: cleanIds, status };
}

async function getAdminCounts() {
  const models = {
    destinos: "destino",
    municipios: "municipio",
    activities: "activity",
    "tourism-types": "tourismType",
    places: "place",
    reviews: "review",
  };
  const entries = await Promise.all(
    Object.entries(models).map(async ([key, model]) => [
      key,
      await prisma[model].count(),
    ]),
  );
  return {
    ...Object.fromEntries(entries),
    editorial: (await getPendingCounts()).total,
  };
}
async function getEditorialRecord(resource, id) {
  const { delegate } = delegateFor(resource);
  const record = await delegate.findUnique({ where: { id } });
  if (!record) {
    const error = new Error("Contenido no encontrado");
    error.status = 404;
    throw error;
  }
  return record;
}

module.exports = {
  getAdminCounts,
  getEditorialRecord,
  listEditorial,
  getPendingCounts,
  transitionOne,
  transitionBatch,
  listWhere,
};
