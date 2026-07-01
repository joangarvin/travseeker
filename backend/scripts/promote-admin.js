/**
 * Promueve un usuario a administrador (role = 'admin').
 *
 * Uso:
 *   node scripts/promote-admin.js tu@email.com
 *   npm run db:promote-admin -- tu@email.com
 */
require('dotenv').config();
const { prisma } = require('../src/config/database');

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Uso: node scripts/promote-admin.js <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, nombre: true, role: true },
  });

  if (!user) {
    console.error(`No existe ningún usuario con email: ${email}`);
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`✓ ${user.email} ya es administrador.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });

  console.log(`✓ ${user.email} promovido a administrador.`);
  console.log('  Cierra sesión y vuelve a entrar (o recarga) para ver el panel admin.');
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
