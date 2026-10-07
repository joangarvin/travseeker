const { stripHtmlToText } = require("../utils/sanitizeContent");
const CATALOGS = Object.freeze({
  actividades: {
    model: "experience",
    link: "activityLinks",
    fields: ["duration", "bestTime", "category"],
  },
  hoteles: {
    model: "hotel",
    link: "hotelLinks",
    fields: ["stars", "amenities"],
  },
  restaurantes: {
    model: "restaurant",
    link: "restaurantLinks",
    fields: ["cuisine", "openingHours"],
  },
});
const fail = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
function catalogConfig(kind) {
  const config = Object.hasOwn(CATALOGS, kind) && CATALOGS[kind];
  if (!config) fail("Catálogo no válido");
  return config;
}
function text(value, max = 6000) {
  if (value == null) return "";
  if (typeof value !== "string" || value.length > max)
    fail("Texto no válido o demasiado largo");
  return stripHtmlToText(value).trim();
}
function url(value) {
  const cleaned = text(value, 2000);
  if (!cleaned) return "";
  try {
    const parsed = new URL(cleaned);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      fail("Utiliza una URL http o https válida");
    return parsed.href;
  } catch {
    fail("Utiliza una URL http o https válida");
  }
}
function coordinates(payload) {
  const latitud =
    payload.latitud === "" || payload.latitud == null
      ? null
      : Number(payload.latitud);
  const longitud =
    payload.longitud === "" || payload.longitud == null
      ? null
      : Number(payload.longitud);
  if (
    (latitud == null) !== (longitud == null) ||
    (latitud != null &&
      (!Number.isFinite(latitud) ||
        !Number.isFinite(longitud) ||
        Math.abs(latitud) > 90 ||
        Math.abs(longitud) > 180))
  )
    fail("Indica ambas coordenadas válidas");
  return { latitud, longitud };
}
function normalizeCatalog(payload, kind) {
  const config = catalogConfig(kind);
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    fail("Ficha no válida");
  const data = Object.fromEntries(
    [
      "nombre",
      "descripcion",
      "imagenAlt",
      "address",
      "phone",
      "price",
      ...config.fields,
    ].map((field) => [
      field,
      text(payload[field], field === "descripcion" ? 12000 : 1000),
    ]),
  );
  if (!data.nombre) fail("Indica el nombre de la ficha");
  if (kind === "hoteles" && data.stars && !/^[1-5]$/.test(data.stars))
    fail("Las estrellas deben estar entre 1 y 5");
  if (payload.isPublished != null && typeof payload.isPublished !== "boolean")
    fail("Estado de publicación no válido");
  return {
    ...data,
    ...coordinates(payload),
    imagen: url(payload.imagen),
    website: url(payload.website),
    bookingUrl: url(payload.bookingUrl),
    isPublished: payload.isPublished === true,
  };
}
function guideFields(payload) {
  const data = {};
  for (const field of [
    "descripcion",
    "imagenAlt",
    "ubicacion",
    "mejorEpoca",
    "consejos",
  ]) {
    if (Object.hasOwn(payload, field))
      data[field] = text(
        payload[field],
        field === "descripcion" ? 12000 : 6000,
      );
  }
  for (const field of ["imagen", "website"])
    if (Object.hasOwn(payload, field)) data[field] = url(payload[field]);
  if (Object.hasOwn(payload, "imageAttribution")) {
    const attribution = payload.imageAttribution;
    if (
      attribution == null ||
      typeof attribution !== "object" ||
      Array.isArray(attribution)
    )
      fail("Atribución de imagen no válida");
    const fields = [
      "author",
      "title",
      "sourceUrl",
      "license",
      "licenseUrl",
      "changes",
    ];
    if (Object.keys(attribution).some((key) => !fields.includes(key)))
      fail("Atribución de imagen no válida");
    const normalized = {};
    for (const field of fields) {
      if (!Object.hasOwn(attribution, field)) continue;
      if (typeof attribution[field] !== "string")
        fail("Atribución de imagen no válida");
      normalized[field] =
        field === "sourceUrl" || field === "licenseUrl"
          ? url(attribution[field])
          : text(attribution[field], 1000);
    }
    data.imageAttribution = normalized;
  }
  return data;
}
function associationIds(value) {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    value.some(
      (id) => typeof id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(id),
    )
  )
    fail("Selección de fichas no válida");
  return [...new Set(value)];
}
async function municipalityAssociations(tx, payload) {
  const data = {};
  for (const [kind, config] of Object.entries(CATALOGS)) {
    const key = `${kind}Ids`;
    if (!Object.hasOwn(payload, key)) continue;
    const ids = associationIds(payload[key]);
    const existing = await tx[config.model].count({
      where: { id: { in: ids } },
    });
    if (existing !== ids.length)
      fail(
        "Una de las fichas seleccionadas ya no existe. Actualiza el catálogo.",
      );
    data[config.link] = {
      deleteMany: {},
      create: ids.map((recordId, sortOrder) => ({ recordId, sortOrder })),
    };
  }
  return data;
}
function catalogRecord(record) {
  const { essentialItem, ...result } = record;
  if (!essentialItem) return result;
  const translations = Object.fromEntries(
    Object.entries(essentialItem.translations || {}).map(([locale, fields]) => [
      locale,
      Object.fromEntries(
        [
          ["nombre", fields.title],
          ["descripcion", fields.description],
          ["imagenAlt", fields.imageAlt],
        ].filter(([, value]) => typeof value === "string"),
      ),
    ]),
  );
  return {
    ...result,
    translations,
    nombre: stripHtmlToText(essentialItem.title),
    descripcion: stripHtmlToText(essentialItem.description),
    imagen: essentialItem.imageUrl || "",
    imagenAlt: essentialItem.imageAlt || "",
    duration: essentialItem.duration || "",
    bestTime: essentialItem.bestTime || "",
    website: essentialItem.officialUrl || "",
  };
}
const guideInclude = Object.fromEntries(
  Object.values(CATALOGS).map((c) => [
    c.link,
    {
      include: {
        record:
          c.model === "experience"
            ? { include: { essentialItem: true } }
            : true,
      },
      orderBy: { sortOrder: "asc" },
    },
  ]),
);
const publicGuideInclude = Object.fromEntries(
  Object.keys(guideInclude).map((key) => [
    key,
    {
      ...guideInclude[key],
      where: {
        record: {
          isPublished: true,
          ...(key === "activityLinks"
            ? {
                OR: [
                  { essentialItemId: null },
                  {
                    essentialItem: {
                      group: { destino: { editorialStatus: "published" } },
                    },
                  },
                ],
              }
            : {}),
        },
      },
    },
  ]),
);
function flattenGuide(row) {
  if (!row) return row;
  const result = { ...row };
  for (const [kind, config] of Object.entries(CATALOGS)) {
    result[kind] = (result[config.link] || []).map((link) =>
      catalogRecord(link.record),
    );
    result[`${kind}Ids`] = result[kind].map((record) => record.id);
    delete result[config.link];
  }
  return result;
}
module.exports = {
  publicGuideInclude,
  catalogRecord,
  CATALOGS,
  catalogConfig,
  normalizeCatalog,
  guideFields,
  associationIds,
  municipalityAssociations,
  guideInclude,
  flattenGuide,
};
