const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function normalizeMonth(value) {
  const month = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
}

function crowdForMonth(destino, month) {
  if (!month) return null;
  if (month === 7 || month === 8) return destino.mesesJulioAgosto;
  if ([5, 6, 9, 10].includes(month)) return destino.mesesMayJunSeptOct;
  return destino.mesesNovAbril;
}

function seasonReason(destino, month) {
  const crowd = crowdForMonth(destino, month);
  if (crowd == null) return null;
  const label = MONTHS[month - 1];
  if (crowd <= 25) return `${label}: suele estar muy tranquilo (${crowd}% de afluencia estimada)`;
  if (crowd <= 50) return `${label}: afluencia moderada (${crowd}% estimada)`;
  if (crowd <= 75) return `${label}: conviene reservar margen (${crowd}% estimada)`;
  return `${label}: época de máxima afluencia (${crowd}% estimada)`;
}

function rankForSeason(destinos, { month, avoidCrowds }) {
  if (!month) return destinos;

  return destinos
    .map((destino) => {
      const seasonCrowd = crowdForMonth(destino, month);
      return {
        ...destino,
        seasonCrowd,
        matchReason: seasonReason(destino, month),
      };
    })
    .sort((a, b) => {
      if (avoidCrowds && a.seasonCrowd !== b.seasonCrowd) return a.seasonCrowd - b.seasonCrowd;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
}

module.exports = { MONTHS, normalizeMonth, crowdForMonth, seasonReason, rankForSeason };
