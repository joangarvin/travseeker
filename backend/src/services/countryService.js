const { prisma } = require("../config/database");
const { publicGeography, publicGlobal } = require("../domain/publication");
const destinations = require("./destinoService");
const profiles = {
  ES: {
    en: "Spain",
    es: "Costa, pueblos, ciudades y montaña. Encuentra un destino que encaje con tu forma de viajar y recórrelo a tu ritmo.",
    description:
      "Coast, villages, cities and mountains. Find a destination that suits your way of travelling and explore at your own pace.",
    currency: ["Euro", "Euro"],
    languages: [
      "Español y lenguas cooficiales",
      "Spanish and co-official languages",
    ],
    bbox: [-9.5, 35.5, 4.4, 43.8],
  },
  PT: {
    en: "Portugal",
    es: "Ciudades para caminar, patrimonio y una costa que invita a parar. Explora sus destinos y encuentra tu siguiente viaje.",
    description:
      "Walkable cities, heritage and a coast that invites you to slow down. Explore its destinations and find your next trip.",
    currency: ["Euro", "Euro"],
    languages: ["Portugués", "Portuguese"],
    bbox: [-9.7, 36.8, -6.1, 42.2],
  },
  FR: {
    en: "France",
    es: "Arte, ciudades y paisajes con personalidad propia. Elige una región y descubre los destinos de esta guía.",
    description:
      "Art, cities and landscapes with a personality of their own. Choose a region and discover the destinations in this guide.",
    currency: ["Euro", "Euro"],
    languages: ["Francés", "French"],
    bbox: [-5.2, 41.3, 9.6, 51.2],
  },
  MA: {
    en: "Morocco",
    es: "Patrimonio, jardines y ciudades junto al Atlántico. Encuentra un punto de partida para conocer Marruecos.",
    description:
      "Heritage, gardens and Atlantic cities. Find a starting point for discovering Morocco.",
    currency: ["Dírham marroquí", "Moroccan dirham"],
    languages: ["Árabe y amazig", "Arabic and Amazigh"],
    bbox: [-13.2, 27.2, -0.8, 35.9],
  },
};
function normalizeQuery(query = {}) {
  return {
    q: String(query.q || "")
      .trim()
      .slice(0, 120),
    region: String(query.region || "").slice(0, 160),
    type: String(query.type || "").slice(0, 120),
    offset: Math.max(0, Math.min(100000, parseInt(query.offset, 10) || 0)),
  };
}
function countryName(c, locale) {
  return locale === "en" ? profiles[c.code]?.en || c.name : c.name;
}
const visible = (code) =>
  publicGeography({ countryCode: code, editorialStatus: "published" });
async function list(locale = "es") {
  const rows = await prisma.country.findMany({
    where: { showOnWebsite: true },
    orderBy: { name: "asc" },
    select: { code: true, name: true, preparationComplete: true },
  });
  const counts = await prisma.destino.groupBy({
    by: ["countryCode"],
    where: visible(undefined),
    _count: { _all: true },
  });
  const covers = await Promise.all(
    rows.map((c) =>
      c.preparationComplete
        ? prisma.destino.findFirst({
            where: { ...visible(c.code), imagen: { not: "" } },
            select: { imagen: true },
            orderBy: { nombre: "asc" },
          })
        : null,
    ),
  );
  return rows.flatMap((c, i) =>
    !c.preparationComplete
      ? [{ code: c.code, name: countryName(c, locale), status: "upcoming" }]
      : counts.find((n) => n.countryCode === c.code)
        ? [
            {
              code: c.code,
              name: countryName(c, locale),
              status: "public",
              image: covers[i]?.imagen || "",
              destinationCount: counts.find((n) => n.countryCode === c.code)
                ._count._all,
            },
          ]
        : [],
  );
}
async function page(rawCode, query = {}, locale = "es") {
  const code = String(rawCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code))
    throw Object.assign(new Error("País no encontrado"), { status: 404 });
  const c = await prisma.country.findFirst({
    where: { code, showOnWebsite: true },
    select: { code: true, name: true, preparationComplete: true },
  });
  if (!c) throw Object.assign(new Error("País no encontrado"), { status: 404 });
  const basic = {
    code: c.code,
    name: countryName(c, locale),
    status: c.preparationComplete ? "public" : "upcoming",
  };
  if (!c.preparationComplete) return basic;
  const { q, region, type, offset } = normalizeQuery(query);
  const scope = visible(code);
  const [catalog, filterOptions, regions, types, cover, destinationCount] =
    await Promise.all([
      destinations.searchDestinosPage(
        {
          ...query,
          q,
          tipoTurismo: query.tipoTurismo || type,
          lang: locale,
          limit: "24",
          offset: String(offset),
        },
        { countryCode: code, ...(region ? { region } : {}) },
      ),
      destinations.getFilterOptions(locale, { countryCode: code }),
      prisma.destino.groupBy({
        by: ["region"],
        where: { ...scope, region: { not: "" } },
        orderBy: { region: "asc" },
      }),
      prisma.tourismType.findMany({
        where: {
          ...publicGlobal({ isActive: true, editorialStatus: "published" }),
          destinationLinks: { some: { destino: scope } },
        },
        select: { name: true, translations: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.destino.findFirst({
        where: { ...scope, imagen: { not: "" } },
        select: { imagen: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.destino.count({ where: scope }),
    ]);
  const profile = profiles[code];
  return {
    ...basic,
    description: profile
      ? locale === "en"
        ? profile.description
        : profile.es
      : "",
    currency: profile?.currency[locale === "en" ? 1 : 0] || "",
    languages: profile?.languages[locale === "en" ? 1 : 0] || "",
    bbox: profile?.bbox || null,
    image: cover?.imagen || "",
    imageAlt: cover?.nombre || basic.name,
    destinationCount,
    regions: regions.map((r) => r.region),
    types: types.map((t) => ({ ...t, value: t.name })),
    filterOptions,
    ...catalog,
    offset,
  };
}
module.exports = { list, page, normalizeQuery };
