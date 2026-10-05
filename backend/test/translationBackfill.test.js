const test = require("node:test");
const assert = require("node:assert/strict");
const {
  missingTranslationPatch,
} = require("../src/domain/translationBackfill");

test("backfill preserves edits and skips translations whose Spanish source changed", () => {
  const record = {
    id: "coast",
    nombre: "Costa",
    descripcion: "New source",
    ubicacion: "Costa",
    translations: { en: { nombre: "Editor choice", ubicacion: "  " } },
  };
  const before = structuredClone(record);
  const result = missingTranslationPatch("destination", record, {
    id: "coast",
    source: { nombre: "Costa", descripcion: "Old source", ubicacion: "Costa" },
    english: {
      nombre: "Coast",
      descripcion: "Old translation",
      ubicacion: "Coast",
    },
  });
  assert.deepEqual(result, {
    patch: { ubicacion: "Coast" },
    stale: ["descripcion"],
  });
  assert.deepEqual(record, before);
});

test("backfill validates field limits and record identity before writing", () => {
  assert.throws(() =>
    missingTranslationPatch(
      "activity",
      { id: "a" },
      { id: "b", source: {}, english: {} },
    ),
  );
  assert.throws(() =>
    missingTranslationPatch(
      "activity",
      { id: "a" },
      { id: "a", source: {}, english: { role: "admin" } },
    ),
  );
});
