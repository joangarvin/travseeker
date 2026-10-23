const test = require("node:test");
const assert = require("node:assert/strict");
let query;
const fixtures = [
  {
    id: "pt",
    nombre: "Lisboa",
    countryCode: "PT",
    country: { code: "PT", name: "Portugal" },
    presupuesto: "Medio",
  },
  {
    id: "es",
    nombre: "Garraf",
    countryCode: "ES",
    country: { code: "ES", name: "España" },
    presupuesto: "Alto",
  },
  {
    id: "unknown",
    nombre: "Other",
    countryCode: "XX",
    country: { code: "XX", name: "Other" },
    presupuesto: "Bajo",
  },
];
require.cache[require.resolve("../src/config/database")] = {
  exports: {
    prisma: {
      destino: {
        findMany: async (options) => {
          query = options;
          return fixtures
            .filter((d) => options.where.id.in.includes(d.id))
            .map((d) =>
              Object.fromEntries(
                Object.entries(d).filter(([key]) => options.select[key]),
              ),
            );
        },
      },
    },
  },
};
const service = require("../src/services/destinoService");
test("comparison includes country and localized practical information in requested order", async () => {
  const response = await service.compareDestinos(["es", "pt"], "es");
  assert.deepEqual(
    response.map((d) => d.id),
    ["es", "pt"],
  );
  assert.deepEqual(response[0].country, { code: "ES", name: "España" });
  assert.equal(response[0].practicalInfo.currency, "Euro");
  assert.equal(response[1].practicalInfo.languages, "Portugués");
  assert.equal(query.where.editorialStatus, "published");
  assert.ok(
    query.where.country,
    "the public country visibility filter remains enforced",
  );
  const english = await service.compareDestinos(["pt", "unknown"], "en");
  assert.equal(english[0].practicalInfo.languages, "Portuguese");
  assert.equal(english[1].practicalInfo, null);
});
test("comparison preserves input limits", async () => {
  await assert.rejects(service.compareDestinos(["es"]), { status: 400 });
  await assert.rejects(service.compareDestinos(["a", "b", "c", "d", "e"]), {
    status: 400,
  });
});
