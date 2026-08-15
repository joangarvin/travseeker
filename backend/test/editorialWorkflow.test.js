const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertEditorialTransition,
  editorialUpdateData,
  publicActiveEditorialWhere,
  publicDestinationByIdWhere,
  publicEditorialWhere,
  validateEditorialIds,
  validateEditorialResource,
} = require("../src/domain/editorial");
const {
  LIST_SELECT,
  SEARCH_LIST_SELECT,
  COMPARE_SELECT,
} = require("../src/constants/selects");

test("los filtros públicos siempre exigen contenido publicado", () => {
  assert.deepEqual(publicEditorialWhere({ presupuesto: "Medio" }), {
    presupuesto: "Medio",
    editorialStatus: "published",
  });
  assert.deepEqual(publicActiveEditorialWhere({ sortOrder: 3 }), {
    sortOrder: 3,
    editorialStatus: "published",
    isActive: true,
  });
  assert.deepEqual(publicDestinationByIdWhere("destino-oculto"), {
    id: "destino-oculto",
    editorialStatus: "published",
  });
});

test("las relaciones públicas seleccionan solo catálogos publicados", () => {
  assert.equal(
    LIST_SELECT.tourismTypeLinks.where.tourismType.editorialStatus,
    "published",
  );
  assert.equal(
    SEARCH_LIST_SELECT.activityLinks.where.activity.editorialStatus,
    "published",
  );
  assert.equal(
    SEARCH_LIST_SELECT.places.where.editorialStatus,
    "published",
  );
  assert.equal(
    COMPARE_SELECT.activityLinks.where.activity.editorialStatus,
    "published",
  );
});

test("valida recursos, selección por lotes y transiciones editoriales", () => {
  assert.equal(validateEditorialResource("destinos").model, "destino");
  assert.deepEqual(validateEditorialIds(["a", "b"]), ["a", "b"]);
  assert.doesNotThrow(() => assertEditorialTransition("pending", "published"));
  assert.throws(() => assertEditorialTransition("published", "pending"), /No se puede/);
  assert.throws(() => validateEditorialIds(["a", "a"]), /identificadores/);
  assert.throws(() => validateEditorialResource("reviews"), /no válido/);
});

test("publicar y archivar registran revisor; borrador limpia la revisión", () => {
  const now = new Date("2026-08-13T15:00:00.000Z");
  assert.deepEqual(editorialUpdateData("published", "admin-1", now), {
    editorialStatus: "published",
    reviewedAt: now,
    reviewedById: "admin-1",
  });
  assert.deepEqual(editorialUpdateData("draft", "admin-1", now), {
    editorialStatus: "draft",
    reviewedAt: null,
    reviewedById: null,
  });
});
