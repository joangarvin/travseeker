const { prisma, pool } = require("../src/config/database");
const { translationModels } = require("../src/domain/translationBackfill");
const config = require("../../shared/localization.json");

async function audit() {
  let missingFields = 0;
  const summary = [];
  for (const [resource, table] of Object.entries(translationModels)) {
    const fields = Object.keys(config.fields[resource]);
    const { rows } = await pool.query(
      `SELECT id, translations, ${fields.map((field) => `"${field}"`).join(", ")} FROM "${table}"`,
    );
    const missing = rows.flatMap((record) => {
      const untranslated = fields.filter(
        (field) =>
          String(record[field] || "").trim() &&
          !record.translations?.en?.[field]?.trim(),
      );
      missingFields += untranslated.length;
      return untranslated.length
        ? [{ id: record.id, fields: untranslated }]
        : [];
    });
    summary.push({ resource, records: rows.length, missing });
  }
  console.log(
    JSON.stringify({ language: "en", missingFields, summary }, null, 2),
  );
  if (missingFields) process.exitCode = 1;
}
audit()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
