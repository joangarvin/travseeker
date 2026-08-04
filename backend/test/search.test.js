const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSearchText,
  destinationSearchMatch,
  rankDestinationSearch,
} = require("../src/domain/search");

const destinations = [
  {
    id: "asturias",
    nombre: "Picos de Europa",
    ubicacion: "Montaña",
    descripcion: "Grandes rutas entre desfiladeros y bosques atlánticos.",
    imprescindibles: "Lagos de Covadonga y miradores del Cares",
    municipioLinks: [{ municipio: { nombre: "Cangas de Onís" } }],
    activityLinks: [{ activity: { name: "Senderismo" } }],
    tourismTypeLinks: [{ tourismType: { name: "Naturaleza" } }],
    places: [{ nombre: "Mirador del Fitu" }],
  },
  {
    id: "canarias",
    nombre: "Gran Canaria",
    ubicacion: "Isla",
    descripcion: "Playas, pueblos y caminos volcánicos.",
    imprescindibles: "Roque Nublo",
    municipioLinks: [{ municipio: { nombre: "Tejeda" } }],
    activityLinks: [{ activity: { name: "Observación astronómica" } }],
    tourismTypeLinks: [{ tourismType: { name: "Sol y playa" } }],
    places: [],
  },
];

test("normaliza mayúsculas, tildes, signos y HTML", () => {
  assert.equal(
    normalizeSearchText("<p>Cangas de Onís &amp; Lagos</p>"),
    "cangas de onis lagos",
  );
});

test("encuentra un destino mediante un municipio sin tildes", () => {
  const match = destinationSearchMatch(destinations[0], "cangas de onis");
  assert.equal(match.kind, "municipality");
  assert.equal(match.label, "Municipio · Cangas de Onís");
});

test("encuentra actividades y tipos de viaje", () => {
  assert.equal(
    destinationSearchMatch(destinations[0], "senderismo").kind,
    "activity",
  );
  assert.equal(
    destinationSearchMatch(destinations[0], "naturaleza").kind,
    "tourism",
  );
});

test("encuentra contenido de descripción e imprescindibles", () => {
  assert.equal(
    destinationSearchMatch(destinations[0], "desfiladeros").kind,
    "description",
  );
  assert.equal(
    destinationSearchMatch(destinations[0], "Lagos de Covadonga").kind,
    "essential",
  );
});

test("encuentra lugares activos asociados al destino", () => {
  const match = destinationSearchMatch(destinations[0], "Mirador del Fitu");
  assert.equal(match.kind, "place");
  assert.equal(match.label, "Lugar · Mirador del Fitu");
});

test("permite omitir preposiciones dentro de un imprescindible", () => {
  const destination = {
    ...destinations[0],
    imprescindibles: "Subir al Monte do Castro para ver la ría.",
  };
  assert.equal(
    destinationSearchMatch(destination, "Monte Castro").kind,
    "essential",
  );
});

test("prioriza títulos y elementos estructurados tras la migración", () => {
  const destination = {
    ...destinations[0],
    imprescindibles: "Contenido heredado sin esta parada",
    essentialGroups: [
      {
        title: "Miradores y castros",
        items: [
          {
            title: "Subir al Monte do Castro para ver la ría.",
            description: "Conviene llegar antes del atardecer.",
          },
        ],
      },
    ],
  };
  assert.equal(
    destinationSearchMatch(destination, "Monte Castro").kind,
    "essential-item",
  );
  assert.equal(
    destinationSearchMatch(destination, "miradores y castros").kind,
    "essential-group",
  );
});

test("tolera una errata pequeña en el nombre", () => {
  const ranked = rankDestinationSearch(destinations, "Gran Canria");
  assert.equal(ranked[0].id, "canarias");
  assert.equal(ranked[0].searchMatch.kind, "destination");
});

test("combina términos presentes en criterios diferentes", () => {
  const ranked = rankDestinationSearch(destinations, "naturaleza senderismo");
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, "asturias");
  assert.equal(ranked[0].searchMatch.kind, "multiple");
});

test("descarta resultados que no se parecen a la consulta", () => {
  assert.deepEqual(rankDestinationSearch(destinations, "museos romanos"), []);
  assert.deepEqual(
    rankDestinationSearch([destinations[1]], "Playa Blanca"),
    [],
  );
});
