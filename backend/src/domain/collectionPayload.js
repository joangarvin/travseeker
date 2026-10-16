function cleanCollectionText(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function optionalDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(`${field} debe tener formato AAAA-MM-DD`);
    error.status = 400;
    throw error;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    const error = new Error(`${field} no es válida`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

function optionalTravelerCount(value) {
  if (value === undefined) return undefined;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    const error = new Error("El número de viajeros debe estar entre 1 y 50");
    error.status = 400;
    throw error;
  }
  return count;
}

function validateTripRange(startDate, endDate) {
  if (!startDate || !endDate) return;
  if (endDate < startDate) {
    const error = new Error("La fecha de fin no puede ser anterior al inicio");
    error.status = 400;
    throw error;
  }
  const days =
    Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  if (days > 366) {
    const error = new Error("El viaje no puede superar 366 días");
    error.status = 400;
    throw error;
  }
}

function normalizeCollectionItem(payload) {
  const data = {};
  if (payload.notas !== undefined)
    data.notas = cleanCollectionText(payload.notas, 500);
  if (payload.dayIndex !== undefined) {
    const day =
      payload.dayIndex === null || payload.dayIndex === ""
        ? null
        : Number(payload.dayIndex);
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 365)) {
      const error = new Error("El día debe estar entre 1 y 365");
      error.status = 400;
      throw error;
    }
    data.dayIndex = day;
  }
  if (payload.status !== undefined) {
    if (!["idea", "confirmed", "booked"].includes(payload.status)) {
      const error = new Error("Estado no válido");
      error.status = 400;
      throw error;
    }
    data.status = payload.status;
  }
  if (payload.sortOrder !== undefined) {
    const order = Number(payload.sortOrder);
    if (!Number.isInteger(order) || order < 0 || order > 9999) {
      const error = new Error("Posición no válida");
      error.status = 400;
      throw error;
    }
    data.sortOrder = order;
  }
  return data;
}

module.exports = {
  cleanCollectionText,
  optionalDate,
  optionalTravelerCount,
  validateTripRange,
  normalizeCollectionItem,
};
