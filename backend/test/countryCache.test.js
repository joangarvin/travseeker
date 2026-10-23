const test = require("node:test");
const assert = require("node:assert/strict");
let visible = true,
  queries = 0;
const prisma = {
  country: {
    findMany: async () => {
      queries++;
      return visible
        ? [{ code: "ES", name: "España", preparationComplete: true }]
        : [];
    },
    findFirst: async ({ where }) => {
      queries++;
      return visible
        ? {
            code: where.code,
            name: where.code === "ES" ? "España" : "Portugal",
            preparationComplete: true,
          }
        : null;
    },
  },
  destino: {
    groupBy: async ({ by }) => {
      queries++;
      return by[0] === "countryCode"
        ? [{ countryCode: "ES", _count: { _all: 77 } }]
        : [];
    },
    findFirst: async () => {
      queries++;
      return { imagen: "cover.jpg", nombre: "Costa" };
    },
    count: async () => {
      queries++;
      return 77;
    },
  },
  tourismType: {
    findMany: async () => {
      queries++;
      return [];
    },
  },
};
require.cache[require.resolve("../src/config/database")] = {
  exports: { prisma },
};
require.cache[require.resolve("../src/services/destinoService")] = {
  exports: {
    getFilterOptions: async () => ({ locations: [], activities: [] }),
    searchDestinosPage: async (query, scope) => ({
      items: [
        { id: `${scope.countryCode}-${query.tipoTurismo || "all"}-${query.q}` },
      ],
      total: 1,
      hasMore: false,
    }),
  },
};
const countries = require("../src/services/countryService");
const { publicCache } = require("../src/cache/publicData");
test.beforeEach(() => {
  visible = true;
  queries = 0;
  publicCache.clear();
});
test("concurrent country reads coalesce, return independent values and invalidate on publication saves", async () => {
  const results = await Promise.all(
    Array.from({ length: 50 }, () => countries.list("es")),
  );
  assert.equal(queries, 3);
  results[0][0].name = "mutated";
  assert.equal((await countries.list("es"))[0].name, "España");
  visible = false;
  publicCache.clear();
  assert.deepEqual(await countries.list("es"), []);
});
test("country pages isolate locale, country and filters while ignoring tracking keys", async () => {
  const a = await countries.page(
    " es ",
    { tipoTurismo: "Naturaleza", q: " costa " },
    "es",
  );
  const before = queries;
  const b = await countries.page(
    "ES",
    { q: "costa", tipoTurismo: "Naturaleza", utm_source: "ignored" },
    "es",
  );
  assert.deepEqual(a, b);
  assert.equal(queries, before);
  const alias = await countries.page(
    "ES",
    { type: "Naturaleza", q: "costa" },
    "es",
  );
  assert.deepEqual(alias, a);
  assert.equal(queries, before);
  const en = await countries.page(
    "ES",
    { tipoTurismo: "Naturaleza", q: "costa" },
    "en",
  );
  assert.equal(en.name, "Spain");
  assert.notEqual(
    (await countries.page("PT", {}, "es")).items[0].id,
    a.items[0].id,
  );
  assert.notEqual(
    (await countries.page("ES", { tipoTurismo: "Cultural" }, "es")).items[0].id,
    a.items[0].id,
  );
});
test("a hidden country stays unavailable after cache invalidation; errors are not cached", async () => {
  await countries.page("ES");
  visible = false;
  publicCache.clear();
  await assert.rejects(countries.page("ES"), { status: 404 });
  visible = true;
  assert.equal((await countries.page("ES")).code, "ES");
});
