const { prisma } = require('../src/config/database');

const DESTINATION_NAME = 'A Mariña Lucense';

const essentials = [
  {
    matches: ['Playa de As Catedrais', 'Praia das Catedrais'],
    title: 'Praia das Catedrais',
    description:
      'Recorre los arcos, columnas y cuevas que el mar ha abierto en el acantilado. El acceso al arenal depende de la bajamar y requiere autorización gratuita en Semana Santa y del 1 de julio al 30 de septiembre.',
    icon: 'Waves',
    bestTime: 'Entre 2 h antes y 2 h después de la bajamar',
    officialUrl: 'https://ascatedrais.xunta.gal/monatr/inicio?lang=es',
    place: {
      nombre: 'Praia das Catedrais',
      categoria: 'Monumento natural',
      descripcion: 'Acceso principal al Monumento Natural Praia das Catedrais.',
      latitud: 43.5559167,
      longitud: -7.1563333,
      website: 'https://ascatedrais.xunta.gal/monatr/inicio?lang=es',
    },
  },
  {
    matches: ['Ruta de los Acantilados de O Vicedo', 'PR-G 156 Costa do Vicedo'],
    title: 'PR-G 156 Costa do Vicedo',
    description:
      'Sendero lineal de 13 km que parte del puerto de O Vicedo y enlaza playas, acantilados y el mirador de Illa Coelleira hasta el arenal de San Román.',
    icon: 'Footprints',
    duration: '2 h 40 min',
    officialUrl:
      'https://www.turismo.gal/recurso/-/detalle/170526000694/pr-g-156-costa-do-vicedo?ctre=23&langId=es_ES&tp=6',
    place: {
      nombre: 'Inicio PR-G 156 · Puerto de O Vicedo',
      categoria: 'Inicio de ruta',
      descripcion: 'Panel de inicio del sendero, al comienzo del espigón del puerto.',
      latitud: 43.7390278,
      longitud: -7.6751944,
      website: 'https://turismo.concellodovicedo.org/project/costa-do-vicedo-pr-g-156/',
    },
  },
  {
    matches: ['Faro de Punta Atalaia'],
    title: 'Faro de Punta Atalaia',
    description:
      'El cabo reúne el faro original de granito y la torre actual. Desde el área recreativa se contemplan los Farallóns y el litoral de San Cibrao.',
    icon: 'Landmark',
    officialUrl:
      'https://www.turismo.gal/recurso/-/detalle/36836/san-cibrao-punta-atalaia?langId=es_ES',
    place: {
      nombre: 'Faro de Punta Atalaia',
      categoria: 'Faro',
      descripcion: 'Faro y área recreativa de Punta Atalaia, en San Cibrao.',
      latitud: 43.7005556,
      longitud: -7.4368889,
      website:
        'https://www.turismo.gal/recurso/-/detalle/36836/san-cibrao-punta-atalaia?langId=es_ES',
    },
  },
  {
    matches: ['Pasear por Ribadeo, su puerto', 'Faro de Illa Pancha'],
    title: 'Faro de Illa Pancha',
    description:
      'Los dos faros de Ribadeo se contemplan desde el mirador de la costa. El paseo continúa junto a la ría, aunque el acceso público a la isla no está permitido.',
    icon: 'Landmark',
    officialUrl:
      'https://www.turismo.gal/recurso/-/detalle/7180/illa-pancha?ctre=44&langId=es_ES&tp=9',
    useDestinationImage: true,
    imageAlt: 'Los dos faros de Illa Pancha frente a la costa de Ribadeo.',
    place: {
      nombre: 'Mirador de Illa Pancha',
      categoria: 'Faro y mirador',
      descripcion: 'Mirador costero frente a los dos faros de Illa Pancha.',
      latitud: 43.5563889,
      longitud: -7.0416111,
      website:
        'https://www.turismo.gal/recurso/-/detalle/7180/illa-pancha?ctre=44&langId=es_ES&tp=9',
    },
  },
];

function findEssentialItem(groups, candidates) {
  return groups
    .flatMap((group) => group.items)
    .find((item) => candidates.some((candidate) => item.title.includes(candidate)));
}

async function upsertPlace(transaction, destinationId, place, sortOrder) {
  const existing = await transaction.place.findFirst({
    where: { destinoId: destinationId, nombre: place.nombre },
  });

  const data = {
    ...place,
    destinoId: destinationId,
    sortOrder,
    isActive: true,
  };

  if (existing) {
    return transaction.place.update({ where: { id: existing.id }, data });
  }
  return transaction.place.create({ data });
}

async function enrichAmarinaEssentials() {
  const destination = await prisma.destino.findFirst({
    where: { nombre: DESTINATION_NAME },
    include: {
      essentialGroups: {
        include: { items: true },
      },
      places: true,
    },
  });

  if (!destination) {
    throw new Error(`No se encontró el destino ${DESTINATION_NAME}.`);
  }

  await prisma.$transaction(async (transaction) => {
    for (const [index, essential] of essentials.entries()) {
      const item = findEssentialItem(destination.essentialGroups, essential.matches);
      if (!item) {
        throw new Error(`No se encontró el imprescindible: ${essential.matches.join(' / ')}`);
      }

      const place = await upsertPlace(
        transaction,
        destination.id,
        essential.place,
        destination.places.length + index,
      );

      await transaction.essentialItem.update({
        where: { id: item.id },
        data: {
          title: essential.title,
          description: essential.description,
          icon: essential.icon,
          duration: essential.duration || null,
          bestTime: essential.bestTime || null,
          reservationRequired: null,
          officialUrl: essential.officialUrl,
          imageUrl: essential.useDestinationImage ? destination.imagen : null,
          imageAlt: essential.imageAlt || null,
          placeId: place.id,
        },
      });
    }
  });

  console.log(`Se han completado ${essentials.length} imprescindibles de ${DESTINATION_NAME}.`);
}

enrichAmarinaEssentials()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
