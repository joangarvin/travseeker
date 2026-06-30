// Ordered scales for budget and crowding, plus season metadata.
// Used by recommendations, the comparator and the "best season" logic.
const PRESUPUESTO_ORDER = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];
const MASIFICACION_ORDER = ['Nulo', 'Leve', 'Medio', 'Alto', 'Muy Alto'];

const SEASONS = [
  { key: 'verano', field: 'mesesJulioAgosto', label: 'Verano', months: 'Julio y Agosto' },
  { key: 'media', field: 'mesesMayJunSeptOct', label: 'Primavera y otoño', months: 'May, Jun, Sep, Oct' },
  { key: 'invierno', field: 'mesesNovAbril', label: 'Temporada baja', months: 'Noviembre a Abril' },
];

// Parses fields stored as JSON arrays (e.g. '["Medio"]') or plain strings.
function parseTags(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === 'string') return [parsed];
  } catch {
    return value ? [value] : [];
  }
  return [];
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
  SEASONS,
  parseTags,
  parseSingle,
  presupuestoIndex,
  masificacionIndex,
};
