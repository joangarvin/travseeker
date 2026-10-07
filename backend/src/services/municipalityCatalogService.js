const {
  catalogConfig,
  normalizeCatalog,
  catalogRecord,
} = require("../domain/municipalityCatalog");
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
// Transaction is supplied by the caller so creation, source edits and links stay atomic.
async function saveCatalogRecord(tx, kind, payload, id) {
  const { model } = catalogConfig(kind);
  if (id?.startsWith("source_") && model === "experience") {
    const source = await saveCatalogRecord(tx, kind, { essentialItemId: id.slice(7) });
    return saveCatalogRecord(tx, kind, payload, source.id);
  }
  if (!id && model === "experience" && payload.essentialItemId) {
    if (typeof payload.essentialItemId !== "string")
      fail("Actividad no válida");
    const source = await tx.essentialItem.findUnique({
      where: { id: payload.essentialItemId },
      include: { group: { include: { destino: true } } },
    });
    if (!source) fail("Actividad no encontrada", 404);
    if (source.catalogActivityId) return catalogRecord(await tx.experience.findUniqueOrThrow({ where: { id: source.catalogActivityId }, include: { essentialItem: true } }));
    return catalogRecord(
      await tx.experience.upsert({
        where: { essentialItemId: source.id },
        update: {},
        create: {
          essentialItemId: source.id,
          nombre: source.title,
          descripcion: source.description || "",
          imagen: source.imageUrl || "",
          imagenAlt: source.imageAlt || "",
          duration: source.duration || "",
          bestTime: source.bestTime || "",
          website: source.officialUrl || "",
          translations: catalogRecord({ essentialItem: source }).translations,
          category: source.group.title,
          isPublished: source.group.destino.editorialStatus === "published",
        },
        include: { essentialItem: true },
      }),
    );
  }
  const data = normalizeCatalog(payload, kind);
  const duplicate = await tx[model].findFirst({
    where: {
      nombre: { equals: data.nombre, mode: "insensitive" },
      address: { equals: data.address, mode: "insensitive" },
      ...(id ? { id: { not: id } } : {}),
    },
    select: { id: true },
  });
  if (duplicate)
    fail(
      "Ya existe una ficha con este nombre y dirección. Búscala en el catálogo para reutilizarla.",
      409,
    );
  if (!id) return tx[model].create({ data });
  const record = await tx[model].findUnique({ where: { id } });
  if (!record) fail("Ficha no encontrada", 404);
  if (model === "experience" && record.essentialItemId) {
    await tx.essentialItem.update({
      where: { id: record.essentialItemId },
      data: {
        title: data.nombre,
        description: data.descripcion || null,
        imageUrl: data.imagen || null,
        imageAlt: data.imagenAlt || null,
        duration: data.duration || null,
        bestTime: data.bestTime || null,
        officialUrl: data.website || null,
      },
    });
  }
  return catalogRecord(
    await tx[model].update({
      where: { id },
      data,
      include: model === "experience" ? { essentialItem: true } : undefined,
    }),
  );
}
module.exports = { saveCatalogRecord };
