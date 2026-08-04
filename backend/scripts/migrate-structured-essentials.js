const { prisma, pool } = require("../src/config/database");
const { parseLegacyEssentials } = require("../src/domain/essentials");

const dryRun = process.argv.includes("--dry-run");
const repair = process.argv.includes("--repair");

async function run() {
  const destinations = await prisma.destino.findMany({
    select: {
      id: true,
      nombre: true,
      imprescindibles: true,
      essentialGroups: {
        select: { _count: { select: { items: true } } },
      },
    },
    orderBy: { nombre: "asc" },
  });
  let destinationCount = 0;
  let groupCount = 0;
  let itemCount = 0;
  const skipped = [];

  for (const destination of destinations) {
    const groups = parseLegacyEssentials(destination.imprescindibles);
    if (!groups.length) {
      skipped.push(destination.nombre);
      continue;
    }
    const expectedItems = groups.reduce(
      (total, group) => total + group.items.length,
      0,
    );
    const currentItems = destination.essentialGroups.reduce(
      (total, group) => total + group._count.items,
      0,
    );
    const structureMatches =
      destination.essentialGroups.length === groups.length &&
      currentItems === expectedItems;
    if (structureMatches || (!repair && destination.essentialGroups.length)) {
      continue;
    }
    destinationCount += 1;
    groupCount += groups.length;
    itemCount += groups.reduce((total, group) => total + group.items.length, 0);
    if (dryRun) continue;

    await prisma.$transaction(async (transaction) => {
      if (repair) {
        await transaction.essentialGroup.deleteMany({
          where: { destinoId: destination.id },
        });
      }
      for (const group of groups) {
        await transaction.essentialGroup.create({
          data: {
            destinoId: destination.id,
            title: group.title,
            sortOrder: group.sortOrder,
            items: { create: group.items },
          },
        });
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : repair ? "repair" : "write",
        destinations: destinationCount,
        groups: groupCount,
        items: itemCount,
        skipped,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
