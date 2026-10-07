const { translationData } = require("./localization");
const {
  parseTags,
  serializeTags,
  isTourismType,
  normalizeActivity,
} = require("../constants/scales");
const { plainHtml, serializeEssentialGroups } = require("./essentials");
const { stripHtmlToText } = require("../utils/sanitizeContent");

function clean(value, max) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function normalizeDestinationPayload(data, essentialGroups = null) {
  const secondaryValues = parseTags(data.tipoTurismoSecundario);
  const primaryTypes = [
    ...new Set([
      ...parseTags(data.tipoTurismoPrincipal),
      ...secondaryValues.filter(isTourismType),
    ]),
  ];
  const secondaryTypes = [
    ...new Set(
      secondaryValues
        .filter((value) => !isTourismType(value))
        .map(normalizeActivity),
    ),
  ];
  return {
    ...translationData(data, "destination"),
    nombre: String(data.nombre || "").trim(),
    tipoTurismoPrincipal: serializeTags(primaryTypes),
    tipoTurismoSecundario: serializeTags(secondaryTypes),
    presupuesto: String(data.presupuesto || "").trim(),
    masificacion: String(data.masificacion || "").trim(),
    mesesJulioAgosto: Number(data.mesesJulioAgosto || 0),
    mesesMayJunSeptOct: Number(data.mesesMayJunSeptOct || 0),
    mesesNovAbril: Number(data.mesesNovAbril || 0),
    destinosItem: data.destinosItem ? String(data.destinosItem).trim() : null,
    ubicacion: String(data.ubicacion || "").trim(),
    descripcion: String(data.descripcion || "").trim(),
    imprescindibles:
      essentialGroups?.length > 0
        ? serializeEssentialGroups(essentialGroups)
        : String(data.imprescindibles || "").trim(),
    imagen: String(data.imagen || "").trim(),
    latitud:
      data.latitud === "" || data.latitud == null ? null : Number(data.latitud),
    longitud:
      data.longitud === "" || data.longitud == null
        ? null
        : Number(data.longitud),
  };
}

function validateDestino(data, essentialGroups = null) {
  if (!parseTags(data.tipoTurismoPrincipal).length) {
    const err = new Error("Falta completar: Tipo de turismo principal");
    err.status = 400;
    throw err;
  }
  const labels = {
    nombre: "Nombre del destino",
    presupuesto: "Presupuesto",
    masificacion: "Masificación",
    ubicacion: "Zona o región",
    descripcion: "Descripción",
    imagen: "Imagen de portada",
  };
  for (const [key, label] of Object.entries(labels)) {
    if (!data[key]) {
      const err = new Error(`Falta completar: ${label}`);
      err.status = 400;
      throw err;
    }
  }
  if (!plainHtml(data.imprescindibles) && !essentialGroups?.length) {
    const error = new Error("Añade al menos un imprescindible");
    error.status = 400;
    throw error;
  }
}

function normalizeMunicipioPayload(payload) {
  const nombre = stripHtmlToText(payload.nombre);
  if (!nombre) {
    const err = new Error("El nombre del municipio es obligatorio");
    err.status = 400;
    throw err;
  }
  const latitud =
    payload.latitud === "" || payload.latitud == null
      ? null
      : Number(payload.latitud);
  const longitud =
    payload.longitud === "" || payload.longitud == null
      ? null
      : Number(payload.longitud);
  if (
    (latitud === null) !== (longitud === null) ||
    (latitud !== null &&
      (!Number.isFinite(latitud) || Math.abs(latitud) > 90)) ||
    (longitud !== null &&
      (!Number.isFinite(longitud) || Math.abs(longitud) > 180))
  ) {
    const err = new Error("Las coordenadas del municipio no son válidas");
    err.status = 400;
    throw err;
  }
  return {
    ...translationData(payload, "municipality"),
    ...require("./municipalityCatalog").guideFields(payload),
    nombre,
    precios: stripHtmlToText(payload.precios),
    conexiones: stripHtmlToText(payload.conexiones),
    tipoTurismo: stripHtmlToText(payload.tipoTurismo),
    latitud,
    longitud,
  };
}

function normalizePlace(payload) {
  const nombre = clean(payload.nombre, 100);
  const categoria = clean(payload.categoria, 40);
  const latitud = Number(payload.latitud);
  const longitud = Number(payload.longitud);
  if (
    !nombre ||
    !categoria ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    Math.abs(latitud) > 90 ||
    Math.abs(longitud) > 180
  ) {
    const error = new Error(
      "Nombre, categoría y coordenadas válidas son obligatorios",
    );
    error.status = 400;
    throw error;
  }
  return {
    ...translationData(payload, "place"),
    nombre,
    categoria,
    latitud,
    longitud,
    descripcion: clean(payload.descripcion, 500),
    website: clean(payload.website, 300),
    sortOrder: Number.isInteger(Number(payload.sortOrder))
      ? Number(payload.sortOrder)
      : 0,
    isActive: payload.isActive !== false,
  };
}

module.exports = {
  normalizeDestinationPayload,
  validateDestino,
  normalizeMunicipioPayload,
  normalizePlace,
};
