const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/database");
const {
  resourceConfig,
  publicationInput,
  result,
} = require("../domain/publication");
const { stripHtmlToText } = require("../utils/sanitizeContent");
const { publicCache } = require("../cache/publicData");
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const tables = {
  destino: "Destino",
  municipio: "Municipio",
  experience: "Experience",
  hotel: "Hotel",
  restaurant: "Restaurant",
  place: "Place",
  essentialItem: "EssentialItem",
  activity: "Activity",
  tourismType: "TourismType",
};
function source(config) {
  const table = Prisma.raw(`"${tables[config.model]}"`),
    name = Prisma.raw(`"${config.name}"`),
    description = config.description
      ? Prisma.raw(`"${config.description}"`)
      : Prisma.sql`''`;
  return Prisma.sql`SELECT id, ${name} AS title, ${description} AS description, "preparationComplete", "showOnWebsite", ${config.global ? Prisma.sql`NULL::text` : Prisma.sql`"countryCode"`} AS "countryCode", ${config.global ? Prisma.sql`''` : Prisma.sql`region`} AS region FROM ${table}`;
}
function catalogue(key, config) {
  if (key !== "actividades") return source(config);
  return Prisma.sql`${source(config)} UNION ALL SELECT 'source_'||e.id AS id,e.title,e.description,e."preparationComplete",e."showOnWebsite",e."countryCode",e.region FROM "EssentialItem" e WHERE e."catalogActivityId" IS NULL AND NOT EXISTS(SELECT 1 FROM "Experience" x WHERE x."essentialItemId"=e.id)`;
}
async function countries() {
  const rows = await prisma.country.findMany({ orderBy: { name: "asc" } });
  const counts =
    await prisma.$queryRaw`SELECT "countryCode",count(*)::int AS total,count(*) FILTER (WHERE "preparationComplete")::int AS complete FROM (SELECT "countryCode","preparationComplete" FROM "Destino" UNION ALL SELECT "countryCode","preparationComplete" FROM "Municipio" UNION ALL SELECT "countryCode","preparationComplete" FROM "Experience" UNION ALL SELECT "countryCode","preparationComplete" FROM "Hotel" UNION ALL SELECT "countryCode","preparationComplete" FROM "Restaurant" UNION ALL SELECT "countryCode","preparationComplete" FROM "Place" UNION ALL SELECT e."countryCode",e."preparationComplete" FROM "EssentialItem" e WHERE e."catalogActivityId" IS NULL AND NOT EXISTS (SELECT 1 FROM "Experience" x WHERE x."essentialItemId"=e.id)) cat GROUP BY "countryCode"`;
  return rows.map((c) => ({
    ...c,
    state: result(c, null, true),
    contentCount: counts.find((x) => x.countryCode === c.code)?.total || 0,
    completeCount: counts.find((x) => x.countryCode === c.code)?.complete || 0,
  }));
}
async function list(query = {}) {
  const key = String(query.resource || "destinos");
  const config = resourceConfig(key);
  const country = config.global ? "" : String(query.country || "");
  const region = config.global ? "" : String(query.region || "").slice(0, 160);
  const q = String(query.q || "")
    .trim()
    .slice(0, 120);
  const offset = Math.max(
    0,
    Math.min(100000, Number.parseInt(query.offset, 10) || 0),
  );
  const state = String(query.state || "");
  if (
    state &&
    !["draft", "ready", "public", "upcoming", "blocked"].includes(state)
  )
    fail("Estado no válido");
  const pattern = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  const base = Prisma.sql`WITH records AS (${catalogue(key, config)}), scoped AS(SELECT r.*,CASE WHEN NOT r."showOnWebsite" THEN CASE WHEN r."preparationComplete" THEN 'ready' ELSE 'draft' END WHEN r."countryCode" IS NOT NULL AND (c.code IS NULL OR NOT c."preparationComplete" OR NOT c."showOnWebsite") THEN 'blocked' WHEN r."preparationComplete" THEN 'public' ELSE ${config.teaser ? "upcoming" : "draft"} END AS state FROM records r LEFT JOIN "Country" c ON c.code=r."countryCode" WHERE (${country}='' OR r."countryCode"=${country}) AND (${region}='' OR r.region=${region}) AND r.title ILIKE ${pattern})`;
  const [rows, counts, regionRows] = await Promise.all([
    prisma.$queryRaw`${base} SELECT * FROM scoped WHERE (${state}='' OR state=${state}) ORDER BY lower(title),id LIMIT 40 OFFSET ${offset}`,
    prisma.$queryRaw`${base} SELECT state,count(*)::int AS count FROM scoped GROUP BY state`,
    config.global
      ? []
      : prisma[config.model].findMany({
          where: {
            ...(country ? { countryCode: country } : {}),
            region: { not: "" },
          },
          select: { region: true },
          distinct: ["region"],
          orderBy: { region: "asc" },
          take: 500,
        }),
  ]);
  const totals = Object.fromEntries(counts.map((c) => [c.state, c.count]));
  return {
    items: rows.map((row) => ({
      ...row,
      description: stripHtmlToText(row.description || ""),
      resource: key,
      global: !!config.global,
      teaser: !!config.teaser,
      editorTab: config.tab,
    })),
    total: state ? totals[state] || 0 : counts.reduce((n, c) => n + c.count, 0),
    counts: totals,
    regions: regionRows.map((r) => r.region),
  };
}
async function update(resource, id, body, actorId) {
  const config = resourceConfig(resource);
  let model = config.model;
  let recordId = id;
  if (resource === "actividades" && id.startsWith("source_")) {
    model = "essentialItem";
    recordId = id.slice(7);
  }
  const input = publicationInput(body, config);
  return prisma
    .$transaction(async (tx) => {
      const record = await tx[model].findUnique({ where: { id: recordId } });
      if (!record) fail("Contenido no encontrado", 404);
      if (!config.global) {
        const country = await tx.country.findUnique({
          where: { code: input.countryCode },
        });
        if (!country) fail("El país seleccionado no existe");
      }
      const description =
        model === "essentialItem"
          ? record.description
          : config.description
            ? record[config.description]
            : null;
      if (
        input.preparationComplete &&
        config.description &&
        stripHtmlToText(description || "").length < 20
      )
        fail(
          "Completa la descripción de la ficha (al menos 20 caracteres) antes de marcar Acabado.",
        );
      if (
        body.updatedAt &&
        record.updatedAt &&
        new Date(body.updatedAt).getTime() !== record.updatedAt.getTime()
      )
        fail("La ficha ha cambiado. Recarga antes de guardar.", 409);
      const data = {
        ...input,
        ...(config.editorial
          ? {
              editorialStatus: input.preparationComplete
                ? "published"
                : "draft",
            }
          : {}),
        ...(config.legacy && model !== "essentialItem"
          ? { isPublished: input.preparationComplete && input.showOnWebsite }
          : {}),
        ...(["place", "activity", "tourismType"].includes(model)
          ? { isActive: input.preparationComplete && input.showOnWebsite }
          : {}),
        ...(model === "municipio"
          ? { guideEnabled: input.preparationComplete && input.showOnWebsite }
          : {}),
      };
      if (config.editorial && record.editorialStatus !== data.editorialStatus) {
        data.reviewedAt = input.preparationComplete ? new Date() : null;
        data.reviewedById = input.preparationComplete ? actorId || null : null;
      }
      await tx[model].update({ where: { id: recordId }, data });
      if (model === "destino") {
        await tx.place.updateMany({
          where: { destinoId: recordId },
          data: { countryCode: input.countryCode, region: input.region },
        });
        await tx.essentialItem.updateMany({
          where: { group: { destinoId: recordId } },
          data: { countryCode: input.countryCode, region: input.region },
        });
      }
      // A source essential and its reusable activity are one canonical activity.
      if (model === "experience" && record.essentialItemId)
        await tx.essentialItem.update({
          where: { id: record.essentialItemId },
          data: input,
        });
      if (model === "essentialItem")
        await tx.experience.updateMany({
          where: {
            OR: [
              { essentialItemId: recordId },
              ...(record.catalogActivityId
                ? [{ id: record.catalogActivityId }]
                : []),
            ],
          },
          data: {
            ...input,
            isPublished: input.preparationComplete && input.showOnWebsite,
          },
        });
      return { saved: true };
    })
    .then((saved) => {
      publicCache.clear();
      return saved;
    });
}
async function updateCountry(code, body) {
  if (!/^[A-Z]{2}$/.test(code)) fail("País no válido");
  const input = publicationInput(
    { ...body, countryCode: code, region: "" },
    { teaser: true },
  );
  const changed = await prisma.country.updateMany({
    where: { code },
    data: {
      preparationComplete: input.preparationComplete,
      showOnWebsite: input.showOnWebsite,
    },
  });
  if (!changed.count) fail("País no encontrado", 404);
  publicCache.clear();
  return { saved: true };
}
async function preview(code) {
  const country = await prisma.country.findUnique({ where: { code } });
  if (!country) fail("País no encontrado", 404);
  const state = result(country, null, true);
  if (state !== "public")
    return {
      country: { code: country.code, name: country.name, state },
      items: [],
    };
  const rows = await prisma.destino.findMany({
    where: { countryCode: code, showOnWebsite: true },
    select: { id: true, nombre: true, preparationComplete: true },
    take: 100,
    orderBy: { nombre: "asc" },
  });
  return {
    country: { code: country.code, name: country.name, state },
    items: rows.map((r) => ({
      id: r.id,
      title: r.nombre,
      state: r.preparationComplete ? "public" : "upcoming",
    })),
  };
}
module.exports = { countries, list, update, updateCountry, preview };
async function summary(query = {}) {
  const country = String(query.country || "");
  const region = String(query.region || "");
  const counts = {};
  await Promise.all(
    Object.entries(RESOURCES_FOR_COUNTS()).map(async ([key, config]) => {
      const where = config.global
        ? {}
        : {
            ...(country ? { countryCode: country } : {}),
            ...(region ? { region } : {}),
          };
      counts[key] = await prisma[config.model].count({ where });
      if (key === "actividades")
        counts[key] += await prisma.essentialItem.count({
          where: {
            ...where,
            catalogActivityId: null,
            municipalityExperience: null,
          },
        });
    }),
  );
  return counts;
}
function RESOURCES_FOR_COUNTS() {
  return require("../domain/publication").RESOURCES;
}
module.exports.summary = summary;
async function sourceRecord(resource, id) {
  const config = resourceConfig(resource);
  const model =
    resource === "actividades" && id.startsWith("source_")
      ? "essentialItem"
      : config.model;
  const record = await prisma[model].findUnique({
    where: {
      id:
        model === "essentialItem" && id.startsWith("source_")
          ? id.slice(7)
          : id,
    },
    ...(model === "experience"
      ? { include: { essentialItem: true } }
      : model === "essentialItem"
        ? { include: { group: true } }
        : {}),
  });
  if (!record) fail("Ficha no encontrada", 404);
  if (model === "experience")
    return require("../domain/municipalityCatalog").catalogRecord(record);
  if (model === "essentialItem")
    return require("../domain/municipalityCatalog").catalogRecord({
      id,
      essentialItem: record,
      category: record.group.title,
      address: "",
      price: "",
      phone: "",
      bookingUrl: "",
      isPublished: record.preparationComplete && record.showOnWebsite,
    });
  return record;
}
module.exports.sourceRecord = sourceRecord;
