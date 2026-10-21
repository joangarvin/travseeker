const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { env } = require("./env");

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});
const adapter = new PrismaPg(pool);
const base = new PrismaClient({ adapter });
const publishedModels = new Set([
  "Destino",
  "Municipio",
  "Place",
  "Activity",
  "TourismType",
  "Experience",
  "Hotel",
  "Restaurant",
]);
function syncLegacy(data) {
  if (!data || Object.hasOwn(data, "showOnWebsite")) return data;
  const next = { ...data };
  if (typeof data.editorialStatus === "string") {
    next.preparationComplete = data.editorialStatus === "published";
    if (data.editorialStatus !== "published") next.showOnWebsite = false;
  }
  if (data.isPublished === true) next.preparationComplete = true;
  if (data.isPublished === false || data.isActive === false)
    next.showOnWebsite = false;
  return next;
}
const prisma = base.$extends({
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        if (publishedModels.has(model)) {
          if (["create", "update", "updateMany"].includes(operation))
            args.data = syncLegacy(args.data);
          if (operation === "createMany")
            args.data = Array.isArray(args.data)
              ? args.data.map(syncLegacy)
              : syncLegacy(args.data);
          if (operation === "upsert") {
            args.create = syncLegacy(args.create);
            args.update = syncLegacy(args.update);
          }
        }
        return query(args);
      },
    },
  },
});

module.exports = { prisma, pool };
