const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseTags,
  serializeTags,
  normalizeActivity,
  activitySearchTerms,
} = require("../src/constants/scales");
const { buildWhereClause } = require("../src/utils/buildWhereClause");

test("interpreta valores antiguos, arrays JSON y listas de filtros", () => {
  assert.deepEqual(parseTags("Naturaleza"), ["Naturaleza"]);
  assert.deepEqual(parseTags('["Naturaleza","Rural"]'), [
    "Naturaleza",
    "Rural",
  ]);
  assert.deepEqual(parseTags("Naturaleza,Rural,Naturaleza"), [
    "Naturaleza",
    "Rural",
  ]);
});

test("serializa etiquetas sin vacíos ni duplicados", () => {
  assert.equal(
    serializeTags(["Naturaleza", "", "Rural", "Naturaleza"]),
    '["Naturaleza","Rural"]',
  );
});

test("el filtro de turismo consulta únicamente los tipos principales", () => {
  assert.deepEqual(buildWhereClause({ tipoTurismo: "Naturaleza,Cultural" }), {
    OR: [
      { tipoTurismoPrincipal: { contains: "Naturaleza", mode: "insensitive" } },
      { tipoTurismoPrincipal: { contains: "Cultural", mode: "insensitive" } },
    ],
  });
});

test("combina tipos generales y actividades sin perder condiciones", () => {
  const where = buildWhereClause({
    tipoTurismo: "Naturaleza,Rural",
    actividades: "Senderismo,Aventura",
  });
  assert.equal(where.OR, undefined);
  assert.equal(where.AND.length, 2);
  assert.equal(where.AND[0].OR.length, 2);
  assert.equal(where.AND[1].OR.length, 2);
});

test("normaliza actividades antiguas y conserva términos para buscarlas", () => {
  assert.equal(normalizeActivity("Animales"), "Observación de fauna");
  assert.equal(normalizeActivity("Deportes Aquáticos"), "Deportes acuáticos");
  assert.deepEqual(activitySearchTerms("Observación astronómica"), [
    "Observación astronómica",
    "Astronómico",
    "Astronomia",
  ]);
});
