const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let headerCounts = {};
    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => {
          let cleanHeader = header.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
          headerCounts[cleanHeader] = (headerCounts[cleanHeader] || 0) + 1;
          return headerCounts[cleanHeader] > 1 ? `${cleanHeader}_${headerCounts[cleanHeader]}` : cleanHeader;
        }
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

async function main() {
  console.log('Iniciando importación...');
  
  // Limpiar base de datos (orden: unión → municipios → destinos)
  await prisma.destinoMunicipio.deleteMany();
  await prisma.municipio.deleteMany();
  await prisma.destino.deleteMany();

  // Leer y parsear CSVs
  const destinosRaw = await parseCSV('/Users/joan/Downloads/Destinos.csv');
  const tablaRaw = await parseCSV('/Users/joan/Downloads/Tabla.csv');

  console.log(`Se han leído ${destinosRaw.length} destinos y ${tablaRaw.length} municipios.`);

  // Insertar Destinos
  for (const row of destinosRaw) {
    if (!row.ID) continue;

    await prisma.destino.create({
      data: {
        id: row.ID,
        nombre: row.Nombre || '',
        tipoTurismoPrincipal: row['Tipo de turismo principal'] || '',
        tipoTurismoSecundario: row['Tipo de turismo secundario'] || '',
        presupuesto: row.Presupuesto || '',
        masificacion: row.Masificación || '',
        mesesJulioAgosto: parseInt(row['M-julio-y-agosto']) || 0,
        mesesNovAbril: parseInt(row['M-nov-abril']) || 0,
        mesesMayJunSeptOct: parseInt(row['M-may-jun-sept-oct']) || 0,
        destinosItem: row['Destinos (Item)'] || '',
        ubicacion: row.Ubicación || '',
        descripcion: row['Descripcion del sitio'] || '',
        imprescindibles: row.Imprescindibles || '',
        imagen: row.Imagen || '',
      }
    });
  }

  console.log('Destinos importados correctamente.');

  // Insertar Municipios (catálogo) y vincular a destinos
  for (const row of tablaRaw) {
    if (!row.ID || !row.Municipio) continue;

    await prisma.municipio.upsert({
      where: { id: row.ID },
      create: {
        id: row.ID,
        nombre: row.Municipio,
        precios: row.Precios || '',
        conexiones: row.Conexiones || '',
        tipoTurismo: row['Tipo de Turismo'] || '',
      },
      update: {
        nombre: row.Municipio,
        precios: row.Precios || '',
        conexiones: row.Conexiones || '',
        tipoTurismo: row['Tipo de Turismo'] || '',
      },
    });

    if (row.Referencia) {
      const exists = await prisma.destino.findUnique({ where: { id: row.Referencia } });
      if (exists) {
        await prisma.destinoMunicipio.upsert({
          where: {
            destinoId_municipioId: {
              destinoId: row.Referencia,
              municipioId: row.ID,
            },
          },
          create: {
            destinoId: row.Referencia,
            municipioId: row.ID,
          },
          update: {},
        });
      }
    }
  }

  console.log('Municipios importados y vinculados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
