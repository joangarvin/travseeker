const { prisma } = require('../config/database');
const { parseSingle, parseTags, PRESUPUESTO_ORDER, MASIFICACION_ORDER } = require('../constants/scales');

const DISPLAY_SELECT = {
  id: true,
  nombre: true,
  imagen: true,
  presupuesto: true,
  masificacion: true,
  ubicacion: true,
  tipoTurismoPrincipal: true,
  tipoTurismoSecundario: true,
};

function tagsOf(d) {
  return [...parseTags(d.tipoTurismoPrincipal), ...parseTags(d.tipoTurismoSecundario)];
}

function toDisplay(d) {
  return {
    id: d.id,
    nombre: d.nombre,
    imagen: d.imagen,
    presupuesto: d.presupuesto,
    masificacion: d.masificacion,
    ubicacion: d.ubicacion,
    tipoTurismoPrincipal: d.tipoTurismoPrincipal,
  };
}

function avgIndex(values, order) {
  const idxs = values.map((v) => order.indexOf(parseSingle(v))).filter((i) => i >= 0);
  if (!idxs.length) return -1;
  return Math.round(idxs.reduce((a, b) => a + b, 0) / idxs.length);
}

async function getRecommendations(userId, limit = 8) {
  const [favs, colItems, user] = await Promise.all([
    prisma.favorito.findMany({ where: { userId }, select: { destinoId: true } }),
    prisma.collectionItem.findMany({ where: { collection: { userId } }, select: { destinoId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
  ]);

  const likedIds = [...new Set([...favs.map((f) => f.destinoId), ...colItems.map((c) => c.destinoId)])];

  const travel = (user?.preferences && user.preferences.travel) || {};
  const prefTipos = Array.isArray(travel.tipos) ? travel.tipos : [];
  const prefPresupuesto = typeof travel.presupuesto === 'string' ? travel.presupuesto : null;
  const avoidCrowds = travel.evitarMasificacion === true;

  const hasSignal = likedIds.length > 0 || prefTipos.length > 0 || !!prefPresupuesto || avoidCrowds;

  const liked = likedIds.length
    ? await prisma.destino.findMany({ where: { id: { in: likedIds } }, select: DISPLAY_SELECT })
    : [];

  // Build a weighted profile of tourism tags.
  const tagWeights = new Map();
  liked.forEach((d) => tagsOf(d).forEach((t) => tagWeights.set(t, (tagWeights.get(t) || 0) + 1)));
  prefTipos.forEach((t) => tagWeights.set(t, (tagWeights.get(t) || 0) + 2));

  let preferredPresupuestoIdx = prefPresupuesto ? PRESUPUESTO_ORDER.indexOf(prefPresupuesto) : -1;
  if (preferredPresupuestoIdx < 0 && liked.length) {
    preferredPresupuestoIdx = avgIndex(liked.map((d) => d.presupuesto), PRESUPUESTO_ORDER);
  }
  const preferredMasIdx = liked.length ? avgIndex(liked.map((d) => d.masificacion), MASIFICACION_ORDER) : -1;

  const candidates = await prisma.destino.findMany({
    where: likedIds.length ? { id: { notIn: likedIds } } : {},
    select: DISPLAY_SELECT,
  });

  // No signals at all: surface a random popular selection.
  if (!hasSignal) {
    return candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((d) => ({ destino: toDisplay(d), reason: 'Popular entre viajeros', score: 0 }));
  }

  const maxTagWeight = Math.max(1, ...tagWeights.values());

  const scored = candidates.map((d) => {
    const tags = tagsOf(d);
    const overlap = tags.filter((t) => tagWeights.has(t));
    const tagScoreRaw = overlap.reduce((s, t) => s + (tagWeights.get(t) || 0), 0);
    const tagScore = Math.min(1, tagScoreRaw / (maxTagWeight * 2));

    const candPresIdx = PRESUPUESTO_ORDER.indexOf(parseSingle(d.presupuesto));
    const presScore =
      preferredPresupuestoIdx >= 0 && candPresIdx >= 0
        ? 1 - Math.abs(candPresIdx - preferredPresupuestoIdx) / 4
        : 0.5;

    const candMasIdx = MASIFICACION_ORDER.indexOf(parseSingle(d.masificacion));
    let masScore = 0.5;
    if (avoidCrowds && candMasIdx >= 0) masScore = (4 - candMasIdx) / 4;
    else if (preferredMasIdx >= 0 && candMasIdx >= 0) masScore = 1 - Math.abs(candMasIdx - preferredMasIdx) / 4;

    const score = 0.6 * tagScore + 0.25 * presScore + 0.15 * masScore;

    let reason;
    if (overlap.length) {
      const top = [...new Set(overlap)]
        .sort((a, b) => (tagWeights.get(b) || 0) - (tagWeights.get(a) || 0))
        .slice(0, 2);
      reason = `Porque te gusta el turismo ${top.join(' y ')}`;
    } else if (prefPresupuesto && candPresIdx === preferredPresupuestoIdx) {
      reason = `Encaja con tu presupuesto ${prefPresupuesto}`;
    } else if (avoidCrowds && candMasIdx >= 0 && candMasIdx <= 1) {
      reason = 'Tranquilo, sin aglomeraciones';
    } else {
      reason = 'Podría encajar contigo';
    }

    return { destino: toDisplay(d), reason, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { getRecommendations };
