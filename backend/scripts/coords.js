/**
 * Coordenadas curadas (centroides aproximados) de cada destino/comarca.
 * Más fiable que el geocoder automático para nombres de comarca ambiguos.
 *
 * Uso: node scripts/coords.js
 */
require('dotenv').config();
const { prisma } = require('../src/config/database');

const COORDS = {
  'Pinares de Soria y Burgos': [41.85, -3.05],
  'Costa de la Luz': [36.5, -6.2],
  'Cuenca de Pamplona': [42.81, -1.64],
  'Campiña Sur Extremeña': [38.35, -6.0],
  'Costa del Sol': [36.55, -4.6],
  'Gran Canaria': [27.96, -15.6],
  'Valencia': [39.47, -0.38],
  'Campo de Calatrava': [38.85, -3.87],
  'Pirineo Aragonés': [42.65, -0.15],
  'Desierto de Tabernas': [37.05, -2.39],
  'Bajo Aragón': [40.95, -0.21],
  'Asturias Oriental': [43.39, -4.95],
  'Bilbao y el Gran Bilbao': [43.26, -2.93],
  'Asturias Occidental': [43.45, -6.55],
  'El Hierro, La Gomera y La Palma': [28.4, -17.8],
  'Rías Baixas': [42.4, -8.75],
  'Doñana y el Bajo Guadalquivir': [37.0, -6.45],
  'La Mancha': [39.2, -3.1],
  'Costa del Azahar': [40.1, 0.03],
  'Costa Cantábrica y Santander': [43.46, -3.81],
  'Menorca': [39.95, 4.05],
  'Tierra de Barros': [38.62, -6.35],
  'Serranía de Cuenca': [40.3, -1.9],
  'Rías Altas': [43.45, -8.2],
  'El Bierzo': [42.55, -6.6],
  'Interior de Galicia': [42.4, -7.7],
  'Rioja Alta': [42.45, -2.95],
  'La Sierra de Grazalema': [36.76, -5.37],
  'Ceuta': [35.89, -5.32],
  'Murcia y su altiplano': [38.2, -1.3],
  'Madrid Capital': [40.42, -3.7],
  'Costa Brava': [41.9, 3.16],
  'Santiago de Compostela y alrededores': [42.88, -8.54],
  'Costa da Morte': [43.0, -9.1],
  'Mallorca': [39.61, 2.99],
  'Sierra de Espuña y el Noroeste Murciano': [37.85, -1.57],
  'Costa Daurada': [41.12, 1.25],
  'Tierras de Henares y la Campiña del Sur': [40.6, -3.16],
  'Montaña Palentina': [42.94, -4.5],
  'Sierra de Albarracín': [40.41, -1.44],
  'Pirineo Navarro': [42.9, -1.3],
  'Zona Media Navarra': [42.55, -1.65],
  'Costa Cálida': [37.6, -0.98],
  'Tierra de Campos': [42.0, -5.0],
  'Sierra de Gredos y Béjar': [40.35, -5.2],
  'Costa Blanca': [38.35, -0.45],
  'Zaragoza y el Valle del Ebro': [41.65, -0.89],
  'Interior de Valencia y Castellón': [39.9, -0.7],
  'Tenerife': [28.29, -16.62],
  'Melilla': [35.29, -2.94],
  'Costa Tropical': [36.73, -3.52],
  'Montes de Toledo': [39.5, -4.2],
  'Costa del Maresme': [41.6, 2.6],
  'Pirineo catalán': [42.4, 1.5],
  'Las Sierras Subbéticas': [37.45, -4.3],
  'Ibiza y Formentera': [38.95, 1.43],
  'Valles y Montañas de Cantabria': [43.15, -4.2],
  'Barcelona': [41.39, 2.16],
  'Asturias Sur': [43.05, -5.8],
  'Alcarria': [40.6, -2.8],
  'Fuerteventura, Lanzarote y La Graciosa': [28.7, -13.8],
  'Delta del Ebro': [40.72, 0.73],
  'A Mariña Lucense': [43.55, -7.3],
  'La Campiña andaluza': [37.4, -4.9],
  'Costa Vasca': [43.32, -2.2],
  'La Alpujarra': [36.95, -3.3],
  'Corazón del Ebro Riojano': [42.4, -2.2],
  'La plana de Lleida': [41.62, 0.62],
  'Tierras de León': [42.6, -5.57],
  'Interior de Euskadi': [42.85, -2.67],
  'Segovia y su entorno': [40.95, -4.12],
  'Costa del Garraf': [41.25, 1.9],
  'Norte de Cáceres': [40.0, -6.1],
  'Ribera de Navarra': [42.07, -1.62],
  'Ribera del Duero': [41.66, -3.69],
  'Zona Central de Asturias': [43.36, -5.85],
  'Montañas y el Valle de Madrid': [40.75, -3.9],
};

async function main() {
  const destinos = await prisma.destino.findMany({ select: { id: true, nombre: true } });
  let updated = 0;
  let missing = [];

  for (const d of destinos) {
    const key = d.nombre.trim();
    const coords = COORDS[key];
    if (!coords) {
      missing.push(key);
      continue;
    }
    await prisma.destino.update({
      where: { id: d.id },
      data: { latitud: coords[0], longitud: coords[1] },
    });
    updated++;
  }

  console.log(`Actualizados ${updated}/${destinos.length} destinos.`);
  if (missing.length) console.log('Sin coordenadas curadas:', missing.join(', '));
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
