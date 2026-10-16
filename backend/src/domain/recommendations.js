const {
  parseSingle,
  parseTags,
  PRESUPUESTO_ORDER,
  MASIFICACION_ORDER,
} = require("../constants/scales");

function tourismTags(destination) {
  return parseTags(destination.tipoTurismoPrincipal);
}

function displayDestination(destination) {
  return {
    id: destination.id,
    translations: destination.translations,
    nombre: destination.nombre,
    imagen: destination.imagen,
    presupuesto: destination.presupuesto,
    masificacion: destination.masificacion,
    ubicacion: destination.ubicacion,
    tipoTurismoPrincipal: destination.tipoTurismoPrincipal,
  };
}

function averageScaleIndex(values, order) {
  const indices = values
    .map((value) => order.indexOf(parseSingle(value)))
    .filter((index) => index >= 0);
  if (!indices.length) return -1;
  return Math.round(
    indices.reduce((total, index) => total + index, 0) / indices.length,
  );
}

function rankRecommendations(
  candidates,
  liked,
  preferences,
  {
    limit = 8,
    hasSavedDestinations = liked.length > 0,
    random = Math.random,
  } = {},
) {
  const travel = (preferences && preferences.travel) || {};
  const preferredTourismTypes = Array.isArray(travel.tipos) ? travel.tipos : [];
  const preferredBudget =
    typeof travel.presupuesto === "string" ? travel.presupuesto : null;
  const avoidCrowds = travel.evitarMasificacion === true;

  const hasSignal =
    hasSavedDestinations ||
    preferredTourismTypes.length > 0 ||
    !!preferredBudget ||
    avoidCrowds;

  // Build a weighted profile of tourism tags.
  const tagWeights = new Map();
  liked.forEach((destination) =>
    tourismTags(destination).forEach((tag) =>
      tagWeights.set(tag, (tagWeights.get(tag) || 0) + 1),
    ),
  );
  preferredTourismTypes.forEach((tag) =>
    tagWeights.set(tag, (tagWeights.get(tag) || 0) + 2),
  );

  let preferredBudgetIndex = preferredBudget
    ? PRESUPUESTO_ORDER.indexOf(preferredBudget)
    : -1;
  if (preferredBudgetIndex < 0 && liked.length) {
    preferredBudgetIndex = averageScaleIndex(
      liked.map((destination) => destination.presupuesto),
      PRESUPUESTO_ORDER,
    );
  }
  const preferredCrowdingIndex = liked.length
    ? averageScaleIndex(
        liked.map((destination) => destination.masificacion),
        MASIFICACION_ORDER,
      )
    : -1;

  // No signals at all: surface a random popular selection.
  if (!hasSignal) {
    return [...candidates]
      .sort(() => random() - 0.5)
      .slice(0, limit)
      .map((destination) => ({
        destino: displayDestination(destination),
        reason: "Popular entre viajeros",
        score: 0,
      }));
  }

  const maxTagWeight = Math.max(1, ...tagWeights.values());

  const scored = candidates.map((destination) => {
    const tags = tourismTags(destination);
    const overlap = tags.filter((tag) => tagWeights.has(tag));
    const totalTagWeight = overlap.reduce(
      (total, tag) => total + (tagWeights.get(tag) || 0),
      0,
    );
    const tagScore = Math.min(1, totalTagWeight / (maxTagWeight * 2));

    const candidateBudgetIndex = PRESUPUESTO_ORDER.indexOf(
      parseSingle(destination.presupuesto),
    );
    const budgetScore =
      preferredBudgetIndex >= 0 && candidateBudgetIndex >= 0
        ? 1 - Math.abs(candidateBudgetIndex - preferredBudgetIndex) / 4
        : 0.5;

    const candidateCrowdingIndex = MASIFICACION_ORDER.indexOf(
      parseSingle(destination.masificacion),
    );
    let crowdingScore = 0.5;
    if (avoidCrowds && candidateCrowdingIndex >= 0)
      crowdingScore = (4 - candidateCrowdingIndex) / 4;
    else if (preferredCrowdingIndex >= 0 && candidateCrowdingIndex >= 0)
      crowdingScore =
        1 - Math.abs(candidateCrowdingIndex - preferredCrowdingIndex) / 4;

    const score = 0.6 * tagScore + 0.25 * budgetScore + 0.15 * crowdingScore;

    let reason;
    if (overlap.length) {
      const top = [...new Set(overlap)]
        .sort((a, b) => (tagWeights.get(b) || 0) - (tagWeights.get(a) || 0))
        .slice(0, 2);
      reason = `Porque te gusta el turismo ${top.join(" y ")}`;
    } else if (
      preferredBudget &&
      candidateBudgetIndex === preferredBudgetIndex
    ) {
      reason = `Encaja con tu presupuesto ${preferredBudget}`;
    } else if (
      avoidCrowds &&
      candidateCrowdingIndex >= 0 &&
      candidateCrowdingIndex <= 1
    ) {
      reason = "Tranquilo, sin aglomeraciones";
    } else {
      reason = "Podría encajar contigo";
    }

    return { destino: displayDestination(destination), reason, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { rankRecommendations };
