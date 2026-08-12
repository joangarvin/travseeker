const { prisma, pool } = require('../src/config/database');
const { cleanMunicipalityFields } = require('../src/utils/sanitizeContent');

const applyChanges = process.argv.includes('--apply');

async function main() {
  const municipalities = await prisma.municipio.findMany({
    select: { id: true, nombre: true, precios: true, conexiones: true, tipoTurismo: true },
    orderBy: { nombre: 'asc' },
  });
  const changes = municipalities.flatMap((municipality) => {
    const cleaned = cleanMunicipalityFields(municipality);
    const data = {
      nombre: cleaned.nombre,
      precios: cleaned.precios,
      conexiones: cleaned.conexiones,
      tipoTurismo: cleaned.tipoTurismo,
    };
    const changed = Object.entries(data).some(([key, value]) => value !== municipality[key]);
    return changed ? [{ id: municipality.id, nombre: municipality.nombre, data }] : [];
  });

  console.log(`${municipalities.length} municipios revisados; ${changes.length} requieren limpieza.`);
  changes.slice(0, 20).forEach((change) => console.log(`- ${change.nombre}`));
  if (changes.length > 20) console.log(`- …y ${changes.length - 20} más`);

  if (!applyChanges) {
    console.log('Vista previa solamente. Ejecuta con --apply para guardar los cambios.');
    return;
  }

  const batchSize = 50;
  for (let index = 0; index < changes.length; index += batchSize) {
    const batch = changes.slice(index, index + batchSize);
    await prisma.$transaction(
      batch.map((change) =>
        // updateMany only returns a count, avoiding reads of schema fields that may
        // belong to a pending migration (for example municipality coordinates).
        prisma.municipio.updateMany({ where: { id: change.id }, data: change.data }),
      ),
    );
    console.log(`${Math.min(index + batch.length, changes.length)}/${changes.length} actualizados`);
  }
  console.log(`${changes.length} municipios actualizados. Puedes repetir el script de forma segura.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
