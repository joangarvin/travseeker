// Mounted behind admin authentication. Models are selected exclusively by the allowlist.
const { Router } = require("express");
const { prisma } = require("../config/database");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  catalogConfig,
  catalogRecord,
} = require("../domain/municipalityCatalog");
const router = Router();
router.get(
  "/actividades/imprescindibles",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 200);
    const rows = await prisma.essentialItem.findMany({
      where: q ? { title: { contains: q, mode: "insensitive" } } : {},
      include: {
        group: {
          select: { title: true, destino: { select: { id: true, nombre: true } } },
        },
      },
      orderBy: [{ title: "asc" }, { id: "asc" }],
      take: 100,
      skip: Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0)),
    });
    res.json(
      rows.map((row) => ({
        id: row.id,
        nombre: row.title,
        destino: row.group.destino.nombre,
        destinoId: row.group.destino.id,
        grupo: row.group.title,
      })),
    );
  }),
);
router.get(
  "/:kind",
  asyncHandler(async (req, res) => {
    const { model } = catalogConfig(req.params.kind);
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 200);
    if (model === "experience" && req.query.unified === "1") {
      return res.json(await require("../services/unifiedActivityService").listUnifiedActivities(prisma, { q, offset: Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0)) }));
    }
    const rows = await prisma[model].findMany({
      include: model === "experience" ? { essentialItem: true } : undefined,
      where: q
        ? {
            OR: [
              ...["nombre", "address"].map((field) => ({
                [field]: { contains: q, mode: "insensitive" },
              })),
              ...(model === "experience"
                ? [
                    {
                      essentialItem: {
                        title: { contains: q, mode: "insensitive" },
                      },
                    },
                  ]
                : []),
            ],
          }
        : {},
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
      take: 100,
      skip: Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0)),
    });
    res.json(rows.map(catalogRecord));
  }),
);
router.post(
  "/:kind",
  asyncHandler(async (req, res) => {
    const result = await prisma.$transaction((tx) =>
      require("../services/municipalityCatalogService").saveCatalogRecord(
        tx,
        req.params.kind,
        req.body,
      ),
    );
    res.status(201).json(result);
  }),
);
router.put(
  "/:kind/:id",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.$transaction((tx) =>
        require("../services/municipalityCatalogService").saveCatalogRecord(
          tx,
          req.params.kind,
          req.body,
          req.params.id,
        ),
      ),
    );
  }),
);
module.exports = router;
