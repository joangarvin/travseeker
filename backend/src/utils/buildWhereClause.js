function buildWhereClause(query) {
  const { q, presupuesto, masificacion, ubicacion, tipoTurismo, actividades } = query;
  const where = {};

  if (q) {
    where.nombre = { contains: q, mode: 'insensitive' };
  }
  if (presupuesto) {
    where.presupuesto = { contains: presupuesto };
  }
  if (masificacion) {
    where.masificacion = { contains: masificacion };
  }
  if (ubicacion) {
    where.ubicacion = { contains: ubicacion };
  }
  if (tipoTurismo) {
    where.OR = [
      { tipoTurismoPrincipal: { contains: tipoTurismo } },
      { tipoTurismoSecundario: { contains: tipoTurismo } },
    ];
  }
  if (actividades) {
    where.tipoTurismoSecundario = { contains: actividades };
  }

  return where;
}

module.exports = { buildWhereClause };
