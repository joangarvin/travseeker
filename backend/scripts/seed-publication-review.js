// Disposable review fixtures. Never accepts a production or configured project database.
if (process.env.DATABASE_URL !== "postgresql://joan@127.0.0.1:55439/postgres")
  throw new Error(
    "This fixture script only accepts the isolated local review database.",
  );
const { prisma, pool } = require("../src/config/database");
const bcrypt = require("bcryptjs");
(async () => {
  await prisma.tourismType.deleteMany({
    where: { slug: "publication-test-cultural" },
  });
  for (const country of [
    {
      code: "ES",
      name: "España",
      preparationComplete: true,
      showOnWebsite: true,
    },
    {
      code: "PT",
      name: "Portugal",
      preparationComplete: true,
      showOnWebsite: false,
    },
    {
      code: "FR",
      name: "Francia",
      preparationComplete: false,
      showOnWebsite: true,
    },
    {
      code: "MA",
      name: "Marruecos",
      preparationComplete: false,
      showOnWebsite: false,
    },
  ])
    await prisma.country.upsert({
      where: { code: country.code },
      create: country,
      update: country,
    });
  await prisma.user.upsert({
    where: { email: "expansion-review@example.test" },
    update: { role: "admin", emailVerified: true },
    create: {
      email: "expansion-review@example.test",
      nombre: "Revisión local",
      role: "admin",
      emailVerified: true,
      passwordHash: await bcrypt.hash("ExpansionReview-2026!", 10),
    },
  });
  const base = {
    tipoTurismoPrincipal: "Cultural",
    tipoTurismoSecundario: "",
    presupuesto: "Medio",
    masificacion: "Medio",
    mesesJulioAgosto: 60,
    mesesNovAbril: 20,
    mesesMayJunSeptOct: 35,
    descripcion:
      "Contenido de demostración para revisar los estados de publicación.",
    imprescindibles: "Paseo de ejemplo",
    imagen: "/brand/travseeker-logo.svg",
    editorialStatus: "published",
  };
  for (const d of [
    {
      id: "review-porto",
      nombre: "Oporto · demostración",
      countryCode: "PT",
      region: "Norte",
      preparationComplete: true,
      showOnWebsite: true,
    },
    {
      id: "review-lisboa",
      nombre: "Lisboa · demostración",
      countryCode: "PT",
      region: "Lisboa",
      preparationComplete: true,
      showOnWebsite: false,
    },
    {
      id: "review-garraf",
      nombre: "Costa del Garraf · demostración",
      countryCode: "ES",
      region: "Cataluña",
      preparationComplete: true,
      showOnWebsite: true,
    },
    {
      id: "review-bretana",
      nombre: "Bretaña · demostración",
      countryCode: "FR",
      region: "Bretaña",
      preparationComplete: false,
      showOnWebsite: true,
    },
  ])
    await prisma.destino.upsert({
      where: { id: d.id },
      create: { ...base, ...d, ubicacion: d.region },
      update: { ...d, imagen: "/brand/travseeker-logo.svg" },
    });
  await prisma.hotel.upsert({
    where: { id: "review-hotel" },
    update: {},
    create: {
      id: "review-hotel",
      nombre: "Alojamiento de demostración",
      countryCode: "PT",
      region: "Norte",
      descripcion:
        "Datos de demostración; no representan un establecimiento real.",
      isPublished: false,
    },
  });
  await prisma.restaurant.upsert({
    where: { id: "review-restaurant" },
    update: {},
    create: {
      id: "review-restaurant",
      nombre: "Restaurante de demostración",
      countryCode: "PT",
      region: "Lisboa",
      descripcion:
        "Datos de demostración; no representan un establecimiento real.",
      isPublished: false,
    },
  });
  await prisma.tourismType.upsert({
    where: { slug: "cultural" },
    update: {},
    create: {
      name: "Cultural",
      slug: "cultural",
      description: "Visitas de patrimonio y cultura.",
      icon: "Landmark",
      isActive: true,
      editorialStatus: "published",
      preparationComplete: true,
      showOnWebsite: true,
    },
  });
  console.log(
    "Local review fixtures ready. Account: expansion-review@example.test (test environment only).",
  );
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.tourismType.deleteMany({
      where: { slug: "publication-test-cultural" },
    });
    await prisma.$disconnect();
    await pool.end();
  });
