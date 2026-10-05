const { prisma, pool } = require("../src/config/database");
const { splitEmbeddedHeadings } = require("../src/domain/essentials");

const apply = process.argv.includes("--apply");

async function run() {
  const destinations = await prisma.destino.findMany({
    select: {
      id: true,
      nombre: true,
      essentialGroups: {
        orderBy: { sortOrder: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
    orderBy: { nombre: "asc" },
  });
  const report = [];

  for (const destination of destinations) {
    const { groups, headings } = splitEmbeddedHeadings(
      destination.essentialGroups,
    );
    if (!headings.length) continue;
    report.push({
      destination: destination.nombre,
      headings: headings.map((item) => item.title),
      groups: groups.map(
        (group) =>
          `${group.source ? "" : "+ "}${group.title}${
            group.source && group.source.title !== group.title
              ? ` (antes «${group.source.title}»)`
              : ""
          } · ${group.items.length}`,
      ),
    });
    if (!apply) continue;

    await prisma.$transaction(async (transaction) => {
      await transaction.essentialItem.deleteMany({
        where: { id: { in: headings.map((item) => item.id) } },
      });
      const keptGroupIds = new Set();
      for (const [groupIndex, group] of groups.entries()) {
        let groupId = group.source?.id;
        if (groupId) {
          keptGroupIds.add(groupId);
          await transaction.essentialGroup.update({
            where: { id: groupId },
            data: {
              title: group.title,
              icon: group.icon,
              translations: group.translations ?? {},
              sortOrder: groupIndex,
            },
          });
        } else {
          const created = await transaction.essentialGroup.create({
            data: {
              destinoId: destination.id,
              title: group.title,
              icon: group.icon,
              translations: group.translations,
              sortOrder: groupIndex,
            },
          });
          groupId = created.id;
        }
        for (const [itemIndex, item] of group.items.entries()) {
          await transaction.essentialItem.update({
            where: { id: item.id },
            data: { groupId, sortOrder: itemIndex },
          });
        }
      }
      const emptied = destination.essentialGroups
        .map((group) => group.id)
        .filter((id) => !keptGroupIds.has(id));
      if (emptied.length) {
        await transaction.essentialGroup.deleteMany({
          where: { id: { in: emptied } },
        });
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        destinations: report.length,
        headings: report.reduce(
          (total, entry) => total + entry.headings.length,
          0,
        ),
        changes: report,
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
