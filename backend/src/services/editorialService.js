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
  const search = String(query.q || "").trim().slice(0, 120);
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

  const rows = await Promise.all(
    resources.map(async (resource) => {
      const { config, delegate } = delegateFor(resource);
      const items = await delegate.findMany({
        where: listWhere(config, query),
        select: editorialSelect(config),
        orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
        take: 250,
      });
      return items.map((item) => normalizeItem(resource, config, item));
    }),
  );
  return rows
    .flat()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

async function getPendingCounts() {
  const entries = await Promise.all(
    Object.entries(EDITORIAL_RESOURCES).map(async ([resource, config]) => [
      resource,
      await prisma[config.model].count({ where: { editorialStatus: "pending" } }),
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
      ...(config.publicActive
        ? { isActive: status === "published" }
        : {}),
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
  existing.forEach((item) => assertEditorialTransition(item.editorialStatus, status));
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

module.exports = {
  listEditorial,
  getPendingCounts,
  transitionOne,
  transitionBatch,
  listWhere,
};
