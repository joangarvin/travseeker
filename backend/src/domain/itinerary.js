function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function validDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid('La fecha de un día debe tener formato AAAA-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    invalid('La fecha de un día no es válida');
  }
  return value;
}

function normalizeItinerary(value, { destinationIds = new Set(), municipalityIdsByDestination = new Map() } = {}) {
  if (!Array.isArray(value)) invalid('El itinerario debe ser una lista de días');
  if (value.length > 366) invalid('El itinerario no puede superar 366 días');

  return value.map((day, index) => {
    if (!day || typeof day !== 'object' || Array.isArray(day)) invalid('Cada día del itinerario debe ser un objeto');
    const destinationId = String(day.destinationId || '').trim();
    if (!destinationIds.has(destinationId)) invalid('El itinerario contiene un destino que no pertenece al viaje');

    const normalized = { dayNumber: index + 1, destinationId };
    const date = validDate(day.date);
    if (date) normalized.date = date;

    const baseMunicipioId = String(day.baseMunicipioId || '').trim();
    if (baseMunicipioId) {
      const available = municipalityIdsByDestination.get(destinationId) || new Set();
      if (!available.has(baseMunicipioId)) invalid('El municipio base no pertenece al destino seleccionado');
      normalized.baseMunicipioId = baseMunicipioId;
    }

    const notes = typeof day.notes === 'string' ? day.notes.trim().slice(0, 1200) : '';
    if (notes) normalized.notes = notes;

    if (day.plannedActivities !== undefined) {
      if (!Array.isArray(day.plannedActivities)) invalid('Las actividades planificadas deben ser una lista');
      if (day.plannedActivities.some((activity) => typeof activity !== 'string')) {
        invalid('Cada actividad planificada debe ser texto');
      }
      normalized.plannedActivities = [...new Set(day.plannedActivities
        .map((activity) => String(activity || '').trim().slice(0, 100))
        .filter(Boolean))].slice(0, 24);
    }

    return normalized;
  });
}

module.exports = { normalizeItinerary };
