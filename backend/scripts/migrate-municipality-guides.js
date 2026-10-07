// Additive, idempotent migration for installations historically managed with db:push.
const fs = require('node:fs');
const path = require('node:path');
const { prisma, pool } = require('../src/config/database');
const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20261007000000_municipality_guides/migration.sql'), 'utf8');
prisma.$transaction(async tx => {
  for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
}).then(() => console.log('Municipality guides and reusable catalogs are ready.'))
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
