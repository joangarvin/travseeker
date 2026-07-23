/**
 * One-shot: copy Municipio.destinoId → DestinoMunicipio, then clear destinoId.
 * Run after schema includes DestinoMunicipio but still has destinoId.
 *
 *   node scripts/migrate-municipios-m2m.js
 */
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      SELECT id, "destinoId"
      FROM "Municipio"
      WHERE "destinoId" IS NOT NULL
    `);

    console.log(`Municipios con destino legacy: ${rows.length}`);

    let linked = 0;
    for (const row of rows) {
      const result = await client.query(
        `
        INSERT INTO "DestinoMunicipio" ("destinoId", "municipioId")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [row.destinoId, row.id],
      );
      linked += result.rowCount || 0;
    }

    console.log(`Vínculos creados/asegurados: ${linked}`);

    await client.query(`UPDATE "Municipio" SET "destinoId" = NULL WHERE "destinoId" IS NOT NULL`);
    console.log('Columna destinoId vaciada (lista para eliminarse del schema).');

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
