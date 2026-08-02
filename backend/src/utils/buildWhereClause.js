const { parseTags, activitySearchTerms } = require("../constants/scales");

function tourismConditions(values, fields) {
  return parseTags(values).flatMap((value) =>
    fields.map((field) => ({
      [field]: { contains: value, mode: "insensitive" },
    })),
  );
}

function activityConditions(values) {
  return parseTags(values).flatMap((value) =>
    activitySearchTerms(value).map((searchTerm) => ({
      tipoTurismoSecundario: { contains: searchTerm, mode: "insensitive" },
    })),
  );
}

function buildWhereClause(query) {
  const { q, presupuesto, masificacion, ubicacion, tipoTurismo, actividades } =
    query;
  const where = {};

  if (q) {
    where.nombre = { contains: q, mode: "insensitive" };
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
    where.OR = tourismConditions(tipoTurismo, ["tipoTurismoPrincipal"]);
  }
  if (actividades) {
    const wantedActivities = activityConditions(actividades);
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: wantedActivities }];
      delete where.OR;
    } else where.OR = wantedActivities;
  }

  return where;
}

module.exports = { buildWhereClause };
