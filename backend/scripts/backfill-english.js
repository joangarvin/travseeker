// Preview by default; --apply fills only missing English fields from reviewed data.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { prisma, pool } = require("../src/config/database");
const {
  translationModels,
  missingTranslationPatch,
} = require("../src/domain/translationBackfill");
const manifest = require("../data/english-translations.json");

async function run() {
  const apply = process.argv.includes("--apply");
  const client = await pool.connect();
  const backup = [];
  const summary = [];
  try {
    await client.query("BEGIN");
    for (const [resource, table] of Object.entries(translationModels)) {
      const entries = manifest.resources[resource] || [];
      const { rows } = await client.query(
        `SELECT * FROM "${table}"${apply ? " FOR UPDATE" : ""}`,
      );
      const byId = new Map(rows.map((row) => [row.id, row]));
      const updates = [];
      let staleFields = 0;
      let missingRecords = 0;
      for (const entry of entries) {
        const record = byId.get(entry.id);
        if (!record) {
          missingRecords++;
          continue;
        }
        const { patch, stale } = missingTranslationPatch(
          resource,
          record,
          entry,
        );
        staleFields += stale.length;
        if (!Object.keys(patch).length) continue;
        backup.push({
          resource,
          id: record.id,
          translations: record.translations,
        });
        updates.push({ id: record.id, patch });
      }
      if (apply && updates.length) {
        // Municipio has no updatedAt column in the existing schema.
        const timestampUpdate =
          resource === "municipality" ? "" : ', "updatedAt" = NOW()';
        await client.query(
          `UPDATE "${table}" AS target
          SET translations = COALESCE(target.translations, '{}'::jsonb) ||
            jsonb_build_object('en', COALESCE(target.translations->'en', '{}'::jsonb) || entry->'patch')${timestampUpdate}
          FROM jsonb_array_elements($1::jsonb) AS entry
          WHERE target.id = entry->>'id'`,
          [JSON.stringify(updates)],
        );
      }
      summary.push({
        resource,
        records: updates.length,
        fields: updates.reduce(
          (count, row) => count + Object.keys(row.patch).length,
          0,
        ),
        staleFields,
        missingRecords,
      });
    }
    if (apply && backup.length) {
      const backupPath = path.join(
        os.tmpdir(),
        `travseeker-translations-backup-${Date.now()}.json`,
      );
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), {
        mode: 0o600,
      });
      console.log(`Backup: ${backupPath}`);
    }
    await client.query(apply ? "COMMIT" : "ROLLBACK");
    console.log(JSON.stringify({ applied: apply, summary }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
