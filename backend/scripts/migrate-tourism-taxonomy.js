const { prisma } = require("../src/config/database");
const {
  parseTags,
  serializeTags,
  isTourismType,
  normalizeActivity,
} = require("../src/constants/scales");

const applyChanges = process.argv.includes("--apply");

function normalizedDestination(destination) {
  const secondaryValues = parseTags(destination.tipoTurismoSecundario);
  const primaryTypes = [
    ...new Set([
      ...parseTags(destination.tipoTurismoPrincipal),
      ...secondaryValues.filter(isTourismType),
    ]),
  ];
  const activities = [
    ...new Set(
      secondaryValues
        .filter((value) => !isTourismType(value))
        .map(normalizeActivity),
    ),
  ];
  return {
    tipoTurismoPrincipal: serializeTags(primaryTypes),
    tipoTurismoSecundario: serializeTags(activities),
  };
}

async function main() {
  const destinations = await prisma.destino.findMany({
    select: {
      id: true,
      nombre: true,
      tipoTurismoPrincipal: true,
      tipoTurismoSecundario: true,
    },
  });
  const changes = destinations
    .map((destination) => ({
      destination,
      data: normalizedDestination(destination),
    }))
    .filter(
      ({ destination, data }) =>
        destination.tipoTurismoPrincipal !== data.tipoTurismoPrincipal ||
        destination.tipoTurismoSecundario !== data.tipoTurismoSecundario,
    );

  console.log(
    `${changes.length} de ${destinations.length} destinos necesitan normalización.`,
  );
  changes.forEach(({ destination, data }) => {
    console.log(
      `- ${destination.nombre}: principales=${data.tipoTurismoPrincipal} actividades=${data.tipoTurismoSecundario}`,
    );
  });

  if (!applyChanges) {
    console.log("Simulación terminada. Usa --apply para guardar los cambios.");
    return;
  }

  await prisma.$transaction(
    changes.map(({ destination, data }) =>
      prisma.destino.update({ where: { id: destination.id }, data }),
    ),
  );
  console.log(`${changes.length} destinos actualizados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
