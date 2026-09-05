const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeDestinationPayload,
  validateDestino,
  normalizeMunicipioPayload,
  normalizePlace,
} = require("../src/domain/adminPayload");
const { parseTags } = require("../src/constants/scales");

test("destination normalization migrates legacy tourism tags and keeps absent coordinates null", () => {
  const payload = {
    nombre: "  Sierra  ",
    tipoTurismoPrincipal: "Naturaleza",
    tipoTurismoSecundario: '["Cultural","Senderismo"]',
    latitud: "",
    longitud: null,
  };
  const original = structuredClone(payload);
  const normalized = normalizeDestinationPayload(payload);
  assert.equal(normalized.nombre, "Sierra");
  assert.deepEqual(parseTags(normalized.tipoTurismoPrincipal), [
    "Naturaleza",
    "Cultural",
  ]);
  assert.deepEqual(parseTags(normalized.tipoTurismoSecundario), ["Senderismo"]);
  assert.equal(normalized.latitud, null);
  assert.equal(normalized.longitud, null);
  assert.deepEqual(payload, original);
});

test("destination validation retains actionable errors and supports structured essentials", () => {
  assert.throws(() => validateDestino({}), {
    status: 400,
    message: "Falta completar: Tipo de turismo principal",
  });
  const valid = {
    tipoTurismoPrincipal: "Cultural",
    nombre: "Ávila",
    presupuesto: "Bajo",
    masificacion: "Leve",
    ubicacion: "Castilla",
    descripcion: "Una visita",
    imagen: "cover.jpg",
  };
  assert.throws(() => validateDestino(valid), {
    status: 400,
    message: "Añade al menos un imprescindible",
  });
  assert.doesNotThrow(() =>
    validateDestino(valid, [{ title: "Visitar", items: [] }]),
  );
  assert.doesNotThrow(() =>
    validateDestino({ ...valid, imprescindibles: "<p>La muralla</p>" }),
  );
});

test("municipality payloads remove markup and require a valid coordinate pair", () => {
  assert.deepEqual(
    normalizeMunicipioPayload({
      nombre: "<b>Ávila</b>",
      latitud: "40.65",
      longitud: "-4.7",
    }),
    {
      nombre: "Ávila",
      precios: "",
      conexiones: "",
      tipoTurismo: "",
      latitud: 40.65,
      longitud: -4.7,
    },
  );
  for (const coordinates of [
    { latitud: 40 },
    { latitud: 91, longitud: 0 },
    { latitud: 0, longitud: 181 },
    { latitud: "bad", longitud: 0 },
  ]) {
    assert.throws(
      () => normalizeMunicipioPayload({ nombre: "Ávila", ...coordinates }),
      { status: 400 },
    );
  }
  assert.equal(normalizeMunicipioPayload({ nombre: "Ávila" }).latitud, null);
});

test("place payloads enforce bounds, trim text and retain visibility defaults", () => {
  const valid = {
    nombre: " Mirador ",
    categoria: " Naturaleza ",
    latitud: "40",
    longitud: "-3",
  };
  const normalized = normalizePlace(valid);
  assert.equal(normalized.nombre, "Mirador");
  assert.equal(normalized.latitud, 40);
  assert.equal(normalized.sortOrder, 0);
  assert.equal(normalized.isActive, true);
  assert.equal(normalizePlace({ ...valid, isActive: false }).isActive, false);
  assert.throws(() => normalizePlace({ ...valid, longitud: 181 }), {
    status: 400,
  });
});
