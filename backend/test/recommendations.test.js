const test = require("node:test");
const assert = require("node:assert/strict");
const { rankRecommendations } = require("../src/domain/recommendations");
const { prisma } = require("../src/config/database");
const { getRecommendations } = require("../src/services/recommendationService");

function destination(id, overrides = {}) {
  return {
    id,
    nombre: id,
    tipoTurismoPrincipal: "Cultural",
    presupuesto: "Medio",
    masificacion: "Medio",
    ...overrides,
  };
}

test("las preferencias explícitas y los favoritos conservan sus pesos y explicaciones", () => {
  const liked = [destination("favorito", { tipoTurismoPrincipal: "Rural" })];
  const candidates = [
    destination("rural", { tipoTurismoPrincipal: "Rural" }),
    destination("cultural"),
  ];
  const ranked = rankRecommendations(candidates, liked, {
    travel: { tipos: ["Cultural"] },
  });
  assert.deepEqual(
    ranked.map((item) => item.destino.id),
    ["cultural", "rural"],
  );
  assert.ok(Math.abs(ranked[0].score - 0.7) < 1e-12);
  assert.ok(Math.abs(ranked[1].score - 0.55) < 1e-12);
  assert.equal(ranked[0].reason, "Porque te gusta el turismo Cultural");
});

test("presupuesto y tranquilidad mantienen la prioridad de sus motivos", () => {
  const preferences = {
    travel: { presupuesto: "Bajo", evitarMasificacion: true },
  };
  const ranked = rankRecommendations(
    [
      destination("tranquilo", { presupuesto: "Alto", masificacion: "Nulo" }),
      destination("barato", { presupuesto: "Bajo", masificacion: "Alto" }),
    ],
    [],
    preferences,
  );
  assert.equal(ranked[0].destino.id, "barato");
  assert.equal(ranked[0].reason, "Encaja con tu presupuesto Bajo");
  assert.equal(ranked[1].reason, "Tranquilo, sin aglomeraciones");
});

test("los valores desconocidos y los favoritos ya ocultos conservan el resultado neutral", () => {
  const ranked = rankRecommendations(
    [destination("sin datos", { presupuesto: null, masificacion: null })],
    [],
    null,
    {
      hasSavedDestinations: true,
    },
  );
  assert.equal(ranked[0].score, 0.2);
  assert.equal(ranked[0].reason, "Podría encajar contigo");
});

test("sin preferencias se limita la selección popular y se conservan los datos de entrada", () => {
  const candidates = Object.freeze([
    destination("primero"),
    destination("segundo"),
  ]);
  const ranked = rankRecommendations(candidates, [], null, {
    limit: 1,
    random: () => 0.5,
  });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].destino.id, "primero");
  assert.equal(ranked[0].reason, "Popular entre viajeros");
  assert.equal(ranked[0].score, 0);
  assert.equal(candidates.length, 2);
});

test("los empates respetan el orden recibido y las respuestas conservan las traducciones", () => {
  const translations = { en: { nombre: "First" } };
  const ranked = rankRecommendations(
    [destination("primero", { translations }), destination("segundo")],
    [],
    { travel: { tipos: ["Cultural"] } },
    { limit: 1 },
  );
  assert.equal(ranked[0].destino.id, "primero");
  assert.deepEqual(ranked[0].destino.translations, translations);
});

test("el servicio excluye destinos guardados y nunca recomienda contenido sin publicar", async () => {
  const originals = {
    favorites: prisma.favorito.findMany,
    items: prisma.collectionItem.findMany,
    user: prisma.user.findUnique,
    destinations: prisma.destino.findMany,
  };
  const queries = [];
  prisma.favorito.findMany = async () => [{ destinoId: "guardado" }];
  prisma.collectionItem.findMany = async () => [
    { destinoId: "guardado" },
    { destinoId: "viaje" },
  ];
  prisma.user.findUnique = async () => ({ preferences: {} });
  prisma.destino.findMany = async (query) => {
    queries.push(query.where);
    return query.where.id.in ? [] : [destination("nuevo")];
  };
  try {
    const ranked = await getRecommendations("usuario", 1);
    assert.deepEqual(queries, [
      {
        id: { in: ["guardado", "viaje"] },
        editorialStatus: "published",
        preparationComplete: true,
        showOnWebsite: true,
        country: { is: { preparationComplete: true, showOnWebsite: true } },
      },
      {
        editorialStatus: "published",
        id: { notIn: ["guardado", "viaje"] },
        preparationComplete: true,
        showOnWebsite: true,
        country: { is: { preparationComplete: true, showOnWebsite: true } },
      },
    ]);
    assert.equal(ranked[0].reason, "Podría encajar contigo");
  } finally {
    prisma.favorito.findMany = originals.favorites;
    prisma.collectionItem.findMany = originals.items;
    prisma.user.findUnique = originals.user;
    prisma.destino.findMany = originals.destinations;
  }
});
