const PUBLIC_FLAGS = Object.freeze({
  preparationComplete: true,
  showOnWebsite: true,
});
const PUBLIC_COUNTRY = Object.freeze({ is: PUBLIC_FLAGS });
function publicGeography(extra = {}) {
  return { ...extra, ...PUBLIC_FLAGS, country: PUBLIC_COUNTRY };
}
function publicGlobal(extra = {}) {
  return { ...extra, ...PUBLIC_FLAGS };
}
const RESOURCES = Object.freeze({
  destinos: {
    model: "destino",
    name: "nombre",
    description: "descripcion",
    tab: "destinos",
    teaser: true,
    editorial: true,
  },
  municipios: {
    model: "municipio",
    name: "nombre",
    description: "descripcion",
    tab: "municipios",
    teaser: true,
    editorial: true,
  },
  actividades: {
    model: "experience",
    name: "nombre",
    description: "descripcion",
    tab: "catalogo-actividades",
    legacy: true,
  },
  hoteles: {
    model: "hotel",
    name: "nombre",
    description: "descripcion",
    tab: "hoteles",
    legacy: true,
  },
  restaurantes: {
    model: "restaurant",
    name: "nombre",
    description: "descripcion",
    tab: "restaurantes",
    legacy: true,
  },
  places: {
    model: "place",
    name: "nombre",
    description: "descripcion",
    tab: "places",
    editorial: true,
  },
  imprescindibles: {
    model: "essentialItem",
    name: "title",
    description: "description",
    tab: "destinos",
  },
  "tipos-actividad": {
    model: "activity",
    name: "name",
    tab: "actividades",
    global: true,
    editorial: true,
  },
  "tipos-viaje": {
    model: "tourismType",
    name: "name",
    description: "description",
    tab: "tipos-viaje",
    global: true,
    editorial: true,
  },
});
function result(record, country, teaser = false) {
  if (!record.showOnWebsite)
    return record.preparationComplete ? "ready" : "draft";
  if (country && (!country.preparationComplete || !country.showOnWebsite))
    return "blocked";
  return record.preparationComplete ? "public" : teaser ? "upcoming" : "draft";
}
function resourceConfig(key) {
  if (!Object.hasOwn(RESOURCES, key))
    throw Object.assign(new Error("Catálogo no válido"), { status: 400 });
  return RESOURCES[key];
}
function bool(value, label) {
  if (typeof value !== "boolean")
    throw Object.assign(new Error(`${label} debe ser Sí o No`), {
      status: 400,
    });
  return value;
}
function publicationInput(body, { teaser = false, global = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw Object.assign(new Error("Datos de publicación no válidos"), {
      status: 400,
    });
  const preparationComplete = bool(body.preparationComplete, "Preparación");
  const showOnWebsite = bool(body.showOnWebsite, "Mostrar");
  if (showOnWebsite && !preparationComplete && !teaser)
    throw Object.assign(
      new Error("Este catálogo debe estar acabado antes de mostrarse"),
      { status: 400 },
    );
  const data = { preparationComplete, showOnWebsite };
  if (!global) {
    if (
      typeof body.countryCode !== "string" ||
      !/^[A-Z]{2}$/.test(body.countryCode)
    )
      throw Object.assign(new Error("Selecciona un país válido"), {
        status: 400,
      });
    if (typeof body.region !== "string" || body.region.trim().length > 160)
      throw Object.assign(new Error("Región no válida"), { status: 400 });
    Object.assign(data, {
      countryCode: body.countryCode,
      region: body.region.trim(),
    });
  }
  return data;
}
module.exports = {
  PUBLIC_FLAGS,
  publicGeography,
  publicGlobal,
  RESOURCES,
  result,
  resourceConfig,
  publicationInput,
};
function publicExperience(extra = {}) {
  return publicGeography({
    ...extra,
    isPublished: true,
    OR: [
      { essentialItemId: null },
      {
        essentialItem: publicGeography({
          group: { destino: publicGeography({ editorialStatus: "published" }) },
        }),
      },
    ],
  });
}
module.exports.publicExperience = publicExperience;
function geographyInput(body) {
  if (!Object.hasOwn(body, "countryCode") && !Object.hasOwn(body, "region"))
    return {};
  const data = {};
  if (Object.hasOwn(body, "countryCode")) {
    if (
      typeof body.countryCode !== "string" ||
      !/^[A-Z]{2}$/.test(body.countryCode)
    )
      throw Object.assign(new Error("País no válido"), { status: 400 });
    data.countryCode = body.countryCode;
  }
  if (Object.hasOwn(body, "region")) {
    if (typeof body.region !== "string" || body.region.trim().length > 160)
      throw Object.assign(new Error("Región no válida"), { status: 400 });
    data.region = body.region.trim();
  }
  return data;
}
module.exports.geographyInput = geographyInput;
