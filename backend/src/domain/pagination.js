function pagination(query = {}, defaultLimit = 40) {
  const number = (value, fallback, max) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed)
      ? Math.max(0, Math.min(parsed, max))
      : fallback;
  };
  return {
    take: Math.max(1, number(query.limit, defaultLimit, 100)),
    skip: number(query.offset, 0, 100000),
  };
}
function catalogWhere(query, fields) {
  const search = String(query.q || "")
    .trim()
    .slice(0, 120);
  const status = ["draft", "pending", "published", "archived"].includes(
    query.status,
  )
    ? query.status
    : null;
  return {
    ...(status ? { editorialStatus: status } : {}),
    ...(search
      ? {
          OR: fields.map((field) => ({
            [field]: { contains: search, mode: "insensitive" },
          })),
        }
      : {}),
  };
}
function encodeEditorialCursor(item) {
  return Buffer.from(
    JSON.stringify({
      date: new Date(item.submittedAt).toISOString(),
      id: item.id,
      resource: item.resource,
    }),
  ).toString("base64url");
}
function editorialCursorWhere(cursor, resource) {
  if (!cursor) return {};
  let value;
  try {
    value = JSON.parse(Buffer.from(String(cursor), "base64url").toString());
  } catch {
    /* validated below */
  }
  if (
    !value ||
    !Number.isFinite(Date.parse(value.date)) ||
    typeof value.id !== "string" ||
    value.id.length > 100 ||
    ![
      "destinos",
      "municipios",
      "activities",
      "tourism-types",
      "places",
    ].includes(value.resource)
  ) {
    const error = new Error("La página solicitada no es válida");
    error.status = 400;
    throw error;
  }
  const date = new Date(value.date);
  return {
    OR: [
      { submittedAt: { lt: date } },
      { submittedAt: date, id: { lt: value.id } },
      ...(resource > value.resource
        ? [{ submittedAt: date, id: value.id }]
        : []),
    ],
  };
}
module.exports = {
  pagination,
  catalogWhere,
  encodeEditorialCursor,
  editorialCursorWhere,
};
