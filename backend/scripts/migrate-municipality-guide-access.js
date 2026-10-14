// Additive and idempotent for installations historically managed with db:push.
const fs = require("node:fs");
const path = require("node:path");
const { prisma, pool } = require("../src/config/database");
const sql = fs.readFileSync(
  path.join(__dirname, "../prisma/migrations/20261014000000_municipality_guide_access/migration.sql"),
  "utf8",
);
prisma.$executeRawUnsafe(sql)
  .then(() => console.log("Municipality guide access is ready; guides default to disabled."))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
