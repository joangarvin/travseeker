/**
 * Seed de reseñas editoriales piloto (no borra destinos).
 * Uso: node scripts/seed-editorial-reviews.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const EDITORIAL_EMAIL = 'editorial@travseeker.com';
const EDITORIAL_PASSWORD = 'EditorialSeed1!';

const COMMENTS = [
  'Ficha revisada a mano: datos de presupuesto y afluencia contrastados con temporada real.',
  'Recomendable fuera de agosto. El cuaderno prioriza sitios donde aún se puede pasear sin cola.',
  'Buena base para comparar: tipología clara y municipios con precios honestos.',
  'Apunte de equipo Travseeker: ir en temporada media si buscas silencio sin cerrar todo.',
  'Selección editorial. Sin patrocinio: si está aquí es porque encaja con el criterio del cuaderno.',
];

async function main() {
  const passwordHash = await bcrypt.hash(EDITORIAL_PASSWORD, 10);

  const editor = await prisma.user.upsert({
    where: { email: EDITORIAL_EMAIL },
    update: {
      nombre: 'Equipo',
      apellidos: 'Travseeker',
      emailVerified: true,
      role: 'admin',
    },
    create: {
      email: EDITORIAL_EMAIL,
      passwordHash,
      nombre: 'Equipo',
      apellidos: 'Travseeker',
      emailVerified: true,
      role: 'admin',
      locale: 'es',
    },
  });

  const destinos = await prisma.destino.findMany({
    take: 8,
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });

  if (destinos.length === 0) {
    console.log('No hay destinos para reseñar.');
    return;
  }

  let n = 0;
  for (let i = 0; i < destinos.length; i++) {
    const d = destinos[i];
    const rating = 4 + (i % 2);
    await prisma.review.upsert({
      where: { userId_destinoId: { userId: editor.id, destinoId: d.id } },
      update: { rating, comment: COMMENTS[i % COMMENTS.length] },
      create: {
        userId: editor.id,
        destinoId: d.id,
        rating,
        comment: COMMENTS[i % COMMENTS.length],
      },
    });
    n += 1;
    console.log(`✓ ${d.nombre}`);
  }

  console.log(`Listo: ${n} reseñas editoriales (usuario ${EDITORIAL_EMAIL}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
