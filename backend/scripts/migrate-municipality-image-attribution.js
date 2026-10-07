// Additive and idempotent for installations historically managed with db:push.
const { prisma, pool } = require("../src/config/database");

prisma.$executeRaw`ALTER TABLE "Municipio" ADD COLUMN IF NOT EXISTS "imageAttribution" JSONB NOT NULL DEFAULT '{}'`
  .then(() => console.log("Municipality image attribution is ready."))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
