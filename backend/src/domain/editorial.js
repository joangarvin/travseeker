const EDITORIAL_STATUSES = Object.freeze([
  "draft",
  "pending",
  "published",
  "archived",
]);

const EDITORIAL_RESOURCES = Object.freeze({
  destinos: {
    model: "destino",
    labelField: "nombre",
    publicActive: false,
  },
  activities: {
    model: "activity",
    labelField: "name",
    publicActive: true,
  },
  "tourism-types": {
    model: "tourismType",
    labelField: "name",
    publicActive: true,
  },
  municipios: {
    model: "municipio",
    labelField: "nombre",
    publicActive: false,
  },
  places: {
    model: "place",
    labelField: "nombre",
    publicActive: true,
  },
});

const ALLOWED_TRANSITIONS = Object.freeze({
  draft: new Set(["pending", "published", "archived"]),
  pending: new Set(["draft", "published", "archived"]),
  published: new Set(["draft", "archived"]),
  archived: new Set(["draft", "published"]),
});

function publicEditorialWhere(extra = {}) {
  return { ...extra, editorialStatus: "published" };
}

function publicActiveEditorialWhere(extra = {}) {
  return { ...extra, editorialStatus: "published", isActive: true };
}

function publicDestinationByIdWhere(id) {
  return publicEditorialWhere({ id });
}

function validateEditorialStatus(status, { allowAll = false } = {}) {
  if (allowAll && status === "all") return status;
  if (!EDITORIAL_STATUSES.includes(status)) {
    const error = new Error("Estado editorial no válido");
    error.status = 400;
    throw error;
  }
  return status;
}

function validateEditorialResource(resource) {
  const config = EDITORIAL_RESOURCES[resource];
  if (!config) {
    const error = new Error("Tipo de contenido editorial no válido");
    error.status = 400;
    throw error;
  }
  return config;
}

function validateEditorialIds(ids, limit = 100) {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("Selecciona al menos un contenido");
    error.status = 400;
    throw error;
  }
  const cleanIds = [...new Set(ids.map((id) => String(id || "").trim()))].filter(
    Boolean,
  );
  if (cleanIds.length !== ids.length || cleanIds.length > limit) {
    const error = new Error(
      cleanIds.length > limit
        ? `Puedes actualizar un máximo de ${limit} contenidos cada vez`
        : "Los identificadores editoriales no son válidos",
    );
    error.status = 400;
    throw error;
  }
  return cleanIds;
}

function assertEditorialTransition(from, to) {
  validateEditorialStatus(from);
  validateEditorialStatus(to);
  if (from === to || !ALLOWED_TRANSITIONS[from]?.has(to)) {
    const error = new Error(
      from === to
        ? `El contenido ya está en estado ${to}`
        : `No se puede pasar contenido de ${from} a ${to}`,
    );
    error.status = 409;
    throw error;
  }
}

function editorialUpdateData(status, reviewerId, now = new Date()) {
  validateEditorialStatus(status);
  const reviewed = status === "published" || status === "archived";
  return {
    editorialStatus: status,
    reviewedAt: reviewed ? now : null,
    reviewedById: reviewed ? reviewerId : null,
  };
}

module.exports = {
  EDITORIAL_STATUSES,
  EDITORIAL_RESOURCES,
  publicEditorialWhere,
  publicActiveEditorialWhere,
  publicDestinationByIdWhere,
  validateEditorialStatus,
  validateEditorialResource,
  validateEditorialIds,
  assertEditorialTransition,
  editorialUpdateData,
};
