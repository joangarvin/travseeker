const { PRESUPUESTO_ORDER, MASIFICACION_ORDER } = require("../constants/scales");

const WEIGHTS = { types: 0.45, budget: 0.2, crowd: 0.15, distance: 0.2 };
// Beyond this distance proximity stops adding to the affinity.
const DISTANCE_HORIZON_KM = 800;

function scaleIndex(order, value) {
  const normalized = String(value || "").trim().toLocaleLowerCase("es");
  const index = order.findIndex((step) => step.toLocaleLowerCase("es") === normalized);
  return index === -1 ? null : index;
}

function distanceKm(from, to) {
  const coordinates = [from.latitud, from.longitud, to.latitud, to.longitud];
  if (coordinates.some((value) => value == null || !Number.isFinite(Number(value)))) return null;
  const [lat1, lon1, lat2, lon2] = coordinates.map((value) => (Number(value) * Math.PI) / 180);
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

function typeIds(destination) {
  return new Set((destination.tourismTypes || []).map((type) => type.id));
}

function stepCloseness(first, second, steps) {
  if (first == null || second == null) return 0.5;
  return 1 - Math.abs(first - second) / (steps - 1);
}

/** Scores every candidate against the source destination and keeps the best `limit`. */
function rankRelated(source, candidates, limit = 3) {
  const sourceTypes = typeIds(source);
  const sourceBudget = scaleIndex(PRESUPUESTO_ORDER, source.presupuesto);
  const sourceCrowd = scaleIndex(MASIFICACION_ORDER, source.masificacion);

  const scored = candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => {
      const types = typeIds(candidate);
      const sharedTypeIds = [...types].filter((id) => sourceTypes.has(id));
      const union = new Set([...types, ...sourceTypes]).size;
      const budget = scaleIndex(PRESUPUESTO_ORDER, candidate.presupuesto);
      const crowd = scaleIndex(MASIFICACION_ORDER, candidate.masificacion);
      const km = distanceKm(source, candidate);
      const score =
        WEIGHTS.types * (union ? sharedTypeIds.length / union : 0) +
        WEIGHTS.budget * stepCloseness(sourceBudget, budget, PRESUPUESTO_ORDER.length) +
        WEIGHTS.crowd * stepCloseness(sourceCrowd, crowd, MASIFICACION_ORDER.length) +
        WEIGHTS.distance * (km == null ? 0 : Math.max(0, 1 - km / DISTANCE_HORIZON_KM));
      return {
        candidate,
        match: {
          affinity: Math.round(score * 100),
          sharedTypeIds,
          budgetDelta: budget == null || sourceBudget == null ? null : budget - sourceBudget,
          crowdDelta: crowd == null || sourceCrowd == null ? null : crowd - sourceCrowd,
          distanceKm: km,
        },
      };
    })
    .sort(
      (first, second) =>
        Number(second.match.sharedTypeIds.length > 0) -
          Number(first.match.sharedTypeIds.length > 0) ||
        second.match.affinity - first.match.affinity ||
        first.candidate.nombre.localeCompare(second.candidate.nombre, "es"),
    );

  return scored.slice(0, limit).map(({ candidate, match }) => {
    const { latitud, longitud, ...destination } = candidate;
    return { ...destination, match };
  });
}

module.exports = { rankRelated, distanceKm };
