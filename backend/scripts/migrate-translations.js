// Additive and idempotent for installations managed with db:push as well as SQL
// migrations. Uses the configured DATABASE_URL; no editorial text is changed.
const { prisma, pool } = require("../src/config/database");

async function migrate() {
  const models = [
    "Destino",
    "Municipio",
    "Place",
    "Activity",
    "TourismType",
    "EssentialGroup",
    "EssentialItem",
  ];
  await prisma.$transaction(async (transaction) => {
    for (const model of models) {
      // Identifiers come exclusively from the fixed list above, never user input.
      await transaction.$executeRawUnsafe(
        `ALTER TABLE "${model}" ADD COLUMN IF NOT EXISTS "translations" JSONB NOT NULL DEFAULT '{}'`,
      );
    }
  });
  console.log(
    "Translation columns are ready. Existing Spanish content is unchanged.",
  );
}

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
