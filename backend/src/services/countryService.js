const { prisma } = require("../config/database");
const { publicGeography, publicGlobal } = require("../domain/publication");
const destinations = require("./destinoService");
const { cachedPublic } = require("../cache/publicData");
const { profiles } = require("../domain/countryInfo");
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
const loadList = cachedPublic("countryList", async function (locale) {
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
});
const loadPage = cachedPublic(
  "countryPage",
  async function (rawCode, query, locale) {
    const code = String(rawCode).toUpperCase();
    if (!/^[A-Z]{2}$/.test(code))
      throw Object.assign(new Error("País no encontrado"), { status: 404 });
    const c = await prisma.country.findFirst({
      where: { code, showOnWebsite: true },
      select: { code: true, name: true, preparationComplete: true },
    });
    if (!c)
      throw Object.assign(new Error("País no encontrado"), { status: 404 });
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
  },
);
function list(locale = "es") {
  return loadList(locale === "en" ? "en" : "es");
}
function page(rawCode, query = {}, locale = "es") {
  // Canonical keys avoid one cache entry per tracking/ignored query parameter.
  const normalized = normalizeQuery(query);
  const filters = {
    ...normalized,
    type: "",
    tipoTurismo: String(query.tipoTurismo || normalized.type),
  };
  for (const key of [
    "presupuesto",
    "masificacion",
    "ubicacion",
    "actividades",
    "month",
    "avoidCrowds",
  ])
    if (query[key]) filters[key] = String(query[key]);
  return loadPage(
    String(rawCode).trim().toUpperCase(),
    filters,
    locale === "en" ? "en" : "es",
  );
}
module.exports = { list, page, normalizeQuery };
