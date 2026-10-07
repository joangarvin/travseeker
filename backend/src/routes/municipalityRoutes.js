const { Router } = require("express");
const { prisma } = require("../config/database");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  publicGuideInclude,
  flattenGuide,
} = require("../domain/municipalityCatalog");
const router = Router();
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.municipio.findFirst({
      where: { id: req.params.id, editorialStatus: "published" },
      include: {
        ...publicGuideInclude,
        destinoLinks: {
          where: { destino: { editorialStatus: "published" } },
          include: {
            destino: {
              select: { id: true, nombre: true, imagen: true, ubicacion: true },
            },
          },
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Municipio no encontrado" });
    const guide = flattenGuide(row);
    // Public responses expose editorial content, never the internal author/reviewer IDs.
    for (const key of [
      "createdById",
      "reviewedById",
      "destinoLinks",
      "actividadesIds",
      "hotelesIds",
      "restaurantesIds",
    ])
      delete guide[key];
    guide.destinos = row.destinoLinks.map((link) => link.destino);
    res.json(guide);
  }),
);
module.exports = router;
