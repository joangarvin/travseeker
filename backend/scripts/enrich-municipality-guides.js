// Default is read-only. --apply explicitly publishes the reviewed batch.
// Existing content is preserved; only empty fields and missing associations are filled.
const fs = require("node:fs");
const path = require("node:path");
const { prisma, pool } = require("../src/config/database");
const {
  saveCatalogRecord,
} = require("../src/services/municipalityCatalogService");
const {
  catalogRecord,
  guideFields,
} = require("../src/domain/municipalityCatalog");
const apply = process.argv.includes("--apply");
const file =
  process.argv.find((arg) => arg.endsWith(".json")) ||
  path.join(__dirname, "../data/municipality-guides/2026-10-07-priority.json");
const batch = JSON.parse(fs.readFileSync(file, "utf8"));
const report = {
  mode: apply ? "apply" : "dry-run",
  checkedAt: batch.checkedAt,
  municipalities: [],
};
function fillEmpty(current, supplied) {
  return Object.fromEntries(
    Object.entries(supplied).filter(
      ([key, value]) =>
        !["sources", "essentialItemId"].includes(key) &&
        value != null &&
        value !== "" &&
        (current[key] == null ||
          current[key] === "" ||
          (key === "imageAttribution" &&
            Object.keys(current[key]).length === 0)),
    ),
  );
}
async function run() {
  for (const entry of batch.municipalities) {
    await prisma.$transaction(
      async (tx) => {
        const municipality = await tx.municipio.findUniqueOrThrow({
          where: { id: entry.id },
        });
        if (
          municipality.nombre.toLocaleLowerCase("es") !==
          entry.nombre.toLocaleLowerCase("es")
        )
          throw new Error("Municipio incorrecto: " + entry.nombre);
        const fields = guideFields(entry.fields);
        // Credits must describe the stored image, never a replacement we skipped.
        if (municipality.imagen && municipality.imagen !== fields.imagen) {
          delete fields.imageAttribution;
          delete fields.imagenAlt;
        }
        const fieldPatch = fillEmpty(municipality, fields);
        const item = {
          id: entry.id,
          nombre: entry.nombre,
          fields: Object.keys(fieldPatch),
          records: [],
        };
        if (apply && item.fields.length)
          await tx.municipio.update({
            where: { id: entry.id },
            data: fieldPatch,
          });
        for (const kind of ["actividades", "hoteles", "restaurantes"]) {
          const model =
            kind === "actividades"
              ? "experience"
              : kind === "hoteles"
                ? "hotel"
                : "restaurant";
          const link =
            kind === "actividades"
              ? "municipioExperience"
              : kind === "hoteles"
                ? "municipioHotel"
                : "municipioRestaurant";
          for (const supplied of entry[kind] || []) {
            let record;
            if (supplied.essentialItemId) {
              const source = await tx.essentialItem.findUniqueOrThrow({
                where: { id: supplied.essentialItemId },
              });
              record = await tx.experience.findUnique({
                where: { essentialItemId: source.id },
                include: { essentialItem: true },
              });
              if (apply) {
                const sourcePatch = {};
                if (!source.description && supplied.descripcion)
                  sourcePatch.description = supplied.descripcion;
                if (!source.officialUrl && supplied.website)
                  sourcePatch.officialUrl = supplied.website;
                if (Object.keys(sourcePatch).length)
                  await tx.essentialItem.update({
                    where: { id: source.id },
                    data: sourcePatch,
                  });
                record = await saveCatalogRecord(tx, kind, {
                  essentialItemId: source.id,
                });
              }
              item.records.push({
                kind,
                nombre: source.title,
                action: record ? "reuse" : "reuse-existing-essential",
              });
            } else {
              record = await tx[model].findFirst({
                where: {
                  nombre: { equals: supplied.nombre, mode: "insensitive" },
                  address: {
                    equals: supplied.address || "",
                    mode: "insensitive",
                  },
                },
              });
              item.records.push({
                kind,
                nombre: supplied.nombre,
                action: record ? "reuse" : "create",
              });
              if (apply && !record)
                record = await saveCatalogRecord(tx, kind, {
                  ...supplied,
                  isPublished: true,
                });
            }
            if (!apply) continue;
            const current = catalogRecord(record);
            const patch = fillEmpty(current, supplied);
            if (Object.keys(patch).length)
              record = await saveCatalogRecord(
                tx,
                kind,
                { ...current, ...patch, isPublished: current.isPublished },
                current.id,
              );
            const existing = await tx[link].findUnique({
              where: {
                municipioId_recordId: {
                  municipioId: entry.id,
                  recordId: record.id,
                },
              },
            });
            if (!existing) {
              const order = await tx[link].aggregate({
                where: { municipioId: entry.id },
                _max: { sortOrder: true },
              });
              await tx[link].create({
                data: {
                  municipioId: entry.id,
                  recordId: record.id,
                  sortOrder: (order._max.sortOrder ?? -1) + 1,
                },
              });
            }
          }
        }
        report.municipalities.push(item);
      },
      { timeout: 60000 },
    );
  }
  const output = path.join(
    __dirname,
    "../../front/output/municipality-enrichment-report.json",
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}
run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
