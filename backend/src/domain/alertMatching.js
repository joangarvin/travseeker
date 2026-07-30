const { crowdForMonth } = require('./season');
const { parseSingle, parseTags } = require('../constants/scales');

function averageCrowd(destino) {
  return (destino.mesesJulioAgosto + destino.mesesMayJunSeptOct + destino.mesesNovAbril) / 3;
}

function matchesAlert(alert, destino) {
  if (alert.presupuesto && parseSingle(destino.presupuesto) !== alert.presupuesto) return false;
  const wanted = Array.isArray(alert.tipos) ? alert.tipos : [];
  if (wanted.length) {
    const tags = [...parseTags(destino.tipoTurismoPrincipal), ...parseTags(destino.tipoTurismoSecundario)];
    if (!wanted.some((tag) => tags.includes(tag))) return false;
  }
  const crowd = alert.month ? crowdForMonth(destino, alert.month) : averageCrowd(destino);
  return !alert.avoidCrowds || crowd <= 50;
}

module.exports = { averageCrowd, matchesAlert };
