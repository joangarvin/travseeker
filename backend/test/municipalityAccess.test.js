const test = require("node:test");
const assert = require("node:assert/strict");

// Exercise the public handler without connecting to the production database.
const databasePath = require.resolve("../src/config/database");
let current;
let query;
require.cache[databasePath] = {
  exports: {
    prisma: {
      municipio: {
        findFirst: async (args) => {
          query = args;
          return current &&
            Object.entries(args.where).every(([key, value]) =>
              key === "country"
                ? current.country?.preparationComplete &&
                  current.country?.showOnWebsite
                : current[key] === value,
            )
            ? current
            : null;
        },
      },
    },
  },
};
const router = require("../src/routes/municipalityRoutes");
const handler = router.stack.find((layer) => layer.route?.path === "/:id").route
  .stack[0].handle;

async function request(row) {
  current = row;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await handler({ params: { id: "town" } }, res, (error) => {
    throw error;
  });
  return res;
}

test("direct URLs only expose published municipalities with guide access enabled", async () => {
  const town = {
    preparationComplete: true,
    showOnWebsite: true,
    country: { preparationComplete: true, showOnWebsite: true },
    id: "town",
    nombre: "Municipio",
    editorialStatus: "published",
    guideEnabled: false,
    destinoLinks: [],
  };
  for (const row of [
    { ...town, guideEnabled: true, showOnWebsite: false },
    {
      ...town,
      guideEnabled: true,
      country: { preparationComplete: true, showOnWebsite: false },
    },
    town,
    { ...town, guideEnabled: true, editorialStatus: "pending" },
    null,
  ]) {
    const response = await request(row);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.nombre, undefined);
  }
  const response = await request({ ...town, guideEnabled: true });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.nombre, "Municipio");
  assert.deepEqual(query.where, {
    id: "town",
    editorialStatus: "published",
    guideEnabled: true,
    preparationComplete: true,
    showOnWebsite: true,
    country: { is: { preparationComplete: true, showOnWebsite: true } },
  });
});
