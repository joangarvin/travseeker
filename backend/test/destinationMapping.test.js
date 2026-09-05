const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mapDestinationRelations,
  mapAdminDestination,
  mapTourismTypes,
} = require("../src/domain/destinationMapping");
const { parseTags } = require("../src/constants/scales");

test("destination mapping sorts and cleans relations without mutating database records", () => {
  const destination = {
    id: "destination",
    municipioLinks: [
      { municipio: { id: "z", nombre: "<b>Zaragoza</b>" } },
      { municipio: null },
      { municipio: { id: "a", nombre: "Ávila" } },
    ],
    activityLinks: [
      { activity: { id: "s", name: "Senderismo" } },
      { activity: null },
      { activity: { id: "a", name: "Aventura" } },
    ],
    tourismTypeLinks: [
      { tourismType: { id: "n", name: "Naturaleza", sortOrder: 2 } },
      { tourismType: { id: "r", name: "Rural", sortOrder: 1 } },
      { tourismType: { id: "c", name: "Cultural", sortOrder: 1 } },
    ],
  };
  const original = structuredClone(destination);
  const mapped = mapDestinationRelations(destination);
  assert.deepEqual(
    mapped.municipios.map(({ nombre }) => nombre),
    ["Ávila", "Zaragoza"],
  );
  assert.deepEqual(mapped.activityIds, ["a", "s"]);
  assert.deepEqual(mapped.tourismTypeIds, ["c", "r", "n"]);
  assert.deepEqual(parseTags(mapped.tipoTurismoPrincipal), [
    "Cultural",
    "Rural",
    "Naturaleza",
  ]);
  assert.deepEqual(parseTags(mapped.tipoTurismoSecundario), [
    "Aventura",
    "Senderismo",
  ]);
  for (const relation of [
    "municipioLinks",
    "activityLinks",
    "tourismTypeLinks",
  ]) {
    assert.equal(relation in mapped, false);
  }
  assert.deepEqual(destination, original);
});

test("only admin responses preserve legacy tags when catalog relations are absent", () => {
  const legacy = {
    id: "legacy",
    tipoTurismoPrincipal: "Cultural",
    tipoTurismoSecundario: "Aventura",
  };
  const publicResult = mapDestinationRelations(legacy);
  const adminResult = mapAdminDestination(legacy);
  assert.deepEqual(parseTags(publicResult.tipoTurismoPrincipal), []);
  assert.deepEqual(parseTags(publicResult.tipoTurismoSecundario), []);
  assert.equal(adminResult.tipoTurismoPrincipal, "Cultural");
  assert.equal(adminResult.tipoTurismoSecundario, "Aventura");
  assert.deepEqual(adminResult.municipios, []);
});

test("linked catalog tags replace legacy tags in admin responses", () => {
  const mapped = mapAdminDestination({
    tipoTurismoPrincipal: "Rural",
    tipoTurismoSecundario: "Aventura",
    tourismTypeLinks: [
      { tourismType: { id: "c", name: "Cultural", sortOrder: 0 } },
    ],
    activityLinks: [{ activity: { id: "s", name: "Senderismo" } }],
  });
  assert.deepEqual(parseTags(mapped.tipoTurismoPrincipal), ["Cultural"]);
  assert.deepEqual(parseTags(mapped.tipoTurismoSecundario), ["Senderismo"]);
});

test("partial list mapping does not add unrelated fields and null remains null", () => {
  assert.equal(mapDestinationRelations(null), null);
  assert.equal(mapAdminDestination(null), null);
  const mapped = mapTourismTypes({ id: "list" });
  assert.equal("municipios" in mapped, false);
  assert.equal("activities" in mapped, false);
});
