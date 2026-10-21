const { Router } = require("express");
const { prisma } = require("../config/database");
const { asyncHandler } = require("../utils/asyncHandler");
const { PUBLIC_FLAGS } = require("../domain/publication");
const router = Router();
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [countries, destinations, municipalities] = await Promise.all([
      prisma.country.findMany({
        where: { showOnWebsite: true, preparationComplete: false },
        select: { code: true, name: true },
        orderBy: { name: "asc" },
        take: 12,
      }),
      prisma.destino.findMany({
        where: {
          showOnWebsite: true,
          preparationComplete: false,
          country: { is: PUBLIC_FLAGS },
        },
        select: { id: true, nombre: true, countryCode: true },
        orderBy: { nombre: "asc" },
        take: 12,
      }),
      prisma.municipio.findMany({
        where: {
          showOnWebsite: true,
          preparationComplete: false,
          country: { is: PUBLIC_FLAGS },
        },
        select: { id: true, nombre: true, countryCode: true },
        orderBy: { nombre: "asc" },
        take: 12,
      }),
    ]);
    res.set("Cache-Control", "private, no-cache");
    res.json({ countries, destinations, municipalities });
  }),
);
module.exports = router;
