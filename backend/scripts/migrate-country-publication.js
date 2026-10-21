// Idempotent, transactional migration; preserves current published content on its first run.
const fs = require("node:fs");
const path = require("node:path");
const { prisma, pool } = require("../src/config/database");
const sql = fs.readFileSync(
  path.join(
    __dirname,
    "../prisma/migrations/20261021000000_country_publication/migration.sql",
  ),
  "utf8",
);
prisma
  .$transaction((tx) => tx.$executeRawUnsafe(sql))
  .then(() =>
    console.log("Country publication is ready. Existing visibility preserved."),
  )
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
