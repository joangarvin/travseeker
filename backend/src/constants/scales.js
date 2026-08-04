// Ordered scales for budget and crowding, plus season metadata.
// Used by recommendations, the comparator and the "best season" logic.
const PRESUPUESTO_ORDER = ["Bajo", "Medio-Bajo", "Medio", "Medio-Alto", "Alto"];
const MASIFICACION_ORDER = ["Nulo", "Leve", "Medio", "Alto", "Muy Alto"];
const TOURISM_TYPES = [
  "Cultural",
  "Naturaleza",
  "Sol y playa",
  "Rural",
  "Montaña",
  "Patrimonial",
];
const ACTIVITY_TYPES = [
  "Aventura",
  "Observación de fauna",
  "Observación astronómica",
  "Deportes acuáticos",
  "Gastronomía",
  "Senderismo",
  "Ocio",
  "Relax y bienestar",
];
const ACTIVITY_ICONS = [
  "Compass",
  "Binoculars",
  "Telescope",
  "Waves",
  "Utensils",
  "Footprints",
  "PartyPopper",
  "HeartPulse",
  "Bike",
  "Camera",
  "Sailboat",
  "MountainSnow",
  "Trees",
  "Bird",
  "Fish",
  "Dumbbell",
  "Music",
  "Landmark",
  "TentTree",
  "Snowflake",
  "Sun",
  "Wine",
  "ShipWheel",
  "Route",
];

const SEASONS = [
  {
    key: "verano",
    field: "mesesJulioAgosto",
    label: "Verano",
    months: "Julio y Agosto",
  },
  {
    key: "media",
    field: "mesesMayJunSeptOct",
    label: "Primavera y otoño",
    months: "May, Jun, Sep, Oct",
  },
  {
    key: "invierno",
    field: "mesesNovAbril",
    label: "Temporada baja",
    months: "Noviembre a Abril",
  },
];

// Parses fields stored as JSON arrays (e.g. '["Medio"]') or plain strings.
function parseTags(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === "string") return [parsed];
  } catch {
    return value
      ? [
          ...new Set(
            value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ]
      : [];
  }
  return [];
}

function serializeTags(value) {
  return JSON.stringify([
    ...new Set(
      parseTags(value)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]);
}

function normalizedTagKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

const ACTIVITY_ALIASES = new Map([
  ["animales", "Observación de fauna"],
  ["astronomico", "Observación astronómica"],
  ["astronomia", "Observación astronómica"],
  ["deportes aquaticos", "Deportes acuáticos"],
  ["gastronomico", "Gastronomía"],
  ["relax", "Relax y bienestar"],
]);
const ACTIVITY_SEARCH_ALIASES = {
  "Observación de fauna": ["Animales"],
  "Observación astronómica": ["Astronómico", "Astronomia"],
  "Deportes acuáticos": ["Deportes Aquáticos"],
  Gastronomía: ["Gastronómico"],
  "Relax y bienestar": ["Relax"],
};

function isTourismType(value) {
  const key = normalizedTagKey(value);
  return TOURISM_TYPES.some((type) => normalizedTagKey(type) === key);
}

function normalizeActivity(value) {
  const cleanValue = String(value || "").trim();
  const key = normalizedTagKey(cleanValue);
  return (
    ACTIVITY_ALIASES.get(key) ||
    ACTIVITY_TYPES.find((activity) => normalizedTagKey(activity) === key) ||
    cleanValue
  );
}

function activitySearchTerms(value) {
  const normalizedActivity = normalizeActivity(value);
  return [
    ...new Set([
      normalizedActivity,
      ...(ACTIVITY_SEARCH_ALIASES[normalizedActivity] || []),
    ]),
  ];
}

function parseSingle(value) {
  return parseTags(value)[0] || null;
}

function presupuestoIndex(value) {
  return PRESUPUESTO_ORDER.indexOf(parseSingle(value));
}

function masificacionIndex(value) {
  return MASIFICACION_ORDER.indexOf(parseSingle(value));
}

module.exports = {
  PRESUPUESTO_ORDER,
  MASIFICACION_ORDER,
  TOURISM_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_ICONS,
  SEASONS,
  parseTags,
  serializeTags,
  normalizedTagKey,
  isTourismType,
  normalizeActivity,
  activitySearchTerms,
  parseSingle,
  presupuestoIndex,
  masificacionIndex,
};
