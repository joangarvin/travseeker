require('dotenv').config();
const { processAlerts } = require('../src/services/alertWorkerService');
const { prisma, pool } = require('../src/config/database');

processAlerts({ dryRun: process.argv.includes('--dry-run') })
  .then((report) => console.log(JSON.stringify(report)))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
