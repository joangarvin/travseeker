const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { buildMunicipalityMerges, remapItinerary } = require('../src/domain/municipalityMerge');

async function main() {
  const apply = process.argv.includes('--apply');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (apply) await client.query('LOCK TABLE "Municipio", "DestinoMunicipio", "Collection" IN SHARE ROW EXCLUSIVE MODE');
    const { rows: municipalities } = await client.query('SELECT * FROM "Municipio" ORDER BY nombre, id');
    const plans = buildMunicipalityMerges(municipalities);
    const mapping = new Map(plans.flatMap(p => p.duplicateIds.map(id => [id, p.canonicalId])));
    const { rows: links } = await client.query('SELECT * FROM "DestinoMunicipio"');
    const { rows: collections } = await client.query('SELECT id, itinerary, "updatedAt" FROM "Collection"');
    const changedCollections = collections.filter(c =>
      JSON.stringify(remapItinerary(c.itinerary, mapping)) !== JSON.stringify(c.itinerary));
    const summary = { before: municipalities.length, after: municipalities.length - mapping.size,
      mergedGroups: plans.length, removed: mapping.size, movedLinks: links.filter(l => mapping.has(l.municipioId)).length,
      updatedItineraries: changedCollections.length };
    console.log(JSON.stringify({ ...summary, names: plans.map(p => p.data.nombre) }, null, 2));
    if (!apply || !plans.length) {
      await client.query('ROLLBACK');
      return;
    }
    const backupDir = path.resolve(__dirname, '../backups');
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `municipios-merge-${stamp}.json`);
    const involved = new Set(plans.flatMap(p => [p.canonicalId, ...p.duplicateIds]));
    fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), summary, plans,
      municipalities: municipalities.filter(m => involved.has(m.id)),
      links: links.filter(l => involved.has(l.municipioId)), collections: changedCollections }, null, 2),
    { mode: 0o600, flag: 'wx' });
    console.log(`Copia previa: ${backupPath}`);
    for (const plan of plans) {
      await client.query(`INSERT INTO "DestinoMunicipio" ("destinoId", "municipioId")
        SELECT "destinoId", $1 FROM "DestinoMunicipio" WHERE "municipioId" = ANY($2::text[])
        ON CONFLICT DO NOTHING`, [plan.canonicalId, plan.duplicateIds]);
      const d = plan.data;
      await client.query(`UPDATE "Municipio" SET nombre=$2, precios=$3, conexiones=$4, "tipoTurismo"=$5,
        latitud=$6, longitud=$7, translations=$8::jsonb WHERE id=$1`,
      [plan.canonicalId, d.nombre, d.precios, d.conexiones, d.tipoTurismo, d.latitud, d.longitud, JSON.stringify(d.translations)]);
    }
    for (const collection of changedCollections) {
      await client.query('UPDATE "Collection" SET itinerary=$2::jsonb, "updatedAt"=now() WHERE id=$1',
        [collection.id, JSON.stringify(remapItinerary(collection.itinerary, mapping))]);
    }
    await client.query('DELETE FROM "Municipio" WHERE id = ANY($1::text[])', [[...mapping.keys()]]);
    const { rows: remainingLinks } = await client.query('SELECT * FROM "DestinoMunicipio"');
    const expected = new Set(links.map(l => `${l.destinoId}:${mapping.get(l.municipioId) || l.municipioId}`));
    const actual = new Set(remainingLinks.map(l => `${l.destinoId}:${l.municipioId}`));
    if (actual.size !== expected.size || [...expected].some(key => !actual.has(key))) {
      throw new Error('La verificación de vínculos ha fallado; se revierte la fusión.');
    }
    const { rows: remaining } = await client.query('SELECT * FROM "Municipio"');
    if (remaining.length !== summary.after || buildMunicipalityMerges(remaining).length) {
      throw new Error('La verificación del catálogo ha fallado; se revierte la fusión.');
    }
    await client.query('COMMIT');
    console.log(`Fusión completada y verificada: ${summary.removed} duplicados eliminados; ${actual.size} vínculos conservados.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
