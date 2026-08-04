const test = require("node:test");
const assert = require("node:assert/strict");
const { slugify, validatePayload } = require("../src/services/activityService");

test("genera identificadores legibles para actividades con acentos", () => {
  assert.equal(slugify("Observación de aves"), "observacion-de-aves");
});

test("acepta únicamente iconos del catálogo compartido", () => {
  assert.equal(
    validatePayload({ name: "Cicloturismo", icon: "Bike" }).icon,
    "Bike",
  );
  assert.equal(
    validatePayload({ name: "Cicloturismo", icon: "Icono inventado" }).icon,
    "Compass",
  );
});

test("normaliza orden y visibilidad al crear una actividad", () => {
  assert.deepEqual(
    validatePayload({ name: "  Fotografía  ", sortOrder: "4" }),
    {
      name: "Fotografía",
      slug: "fotografia",
      icon: "Compass",
      sortOrder: 4,
      isActive: true,
    },
  );
});

test("rechaza nombres vacíos", () => {
  assert.throws(
    () => validatePayload({ name: " " }),
    /al menos dos caracteres/,
  );
});
