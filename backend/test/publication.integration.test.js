const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const url = process.env.EXPANSION_TEST_DATABASE_URL;
test(
  "country publication: migration, real queries, nested visibility and admin permissions",
  { skip: !url },
  async (t) => {
    // This test is forbidden against a configured/shared database.
    assert.match(url, /^postgresql:\/\/[^@]+@127\.0\.0\.1:55439\/postgres$/);
    process.env.DATABASE_URL = url;
    const { prisma, pool } = require("../src/config/database");
    const publication = require("../src/services/publicationService");
    const destinations = require("../src/services/destinoService");
    const { publicCache } = require("../src/cache/publicData");
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        "../prisma/migrations/20261021000000_country_publication/migration.sql",
      ),
      "utf8",
    );
    let server;
    try {
      await prisma.$transaction((tx) => tx.$executeRawUnsafe(sql));
      const base = {
        tipoTurismoPrincipal: "Cultural",
        tipoTurismoSecundario: "",
        presupuesto: "Medio",
        masificacion: "Medio",
        mesesJulioAgosto: 50,
        mesesNovAbril: 20,
        mesesMayJunSeptOct: 30,
        ubicacion: "Portugal",
        descripcion:
          "Una descripción suficientemente completa para las pruebas.",
        imprescindibles: "",
        imagen: "",
      };
      await prisma.destino.deleteMany({
        where: { id: { startsWith: "publication-test-" } },
      });
      await prisma.country.update({
        where: { code: "PT" },
        data: { preparationComplete: true, showOnWebsite: false },
      });
      await prisma.destino.create({
        data: {
          ...base,
          id: "publication-test-legacy",
          nombre: "Legacy",
          editorialStatus: "published",
          preparationComplete: true,
          showOnWebsite: true,
        },
      });
      await t.test(
        "migration preserves existing public records and does not re-enable hidden ones",
        async () => {
          await prisma.$executeRawUnsafe(
            'ALTER TABLE "Destino" DROP COLUMN "preparationComplete", DROP COLUMN "showOnWebsite"',
          );
          await prisma.$transaction((tx) => tx.$executeRawUnsafe(sql));
          assert.equal(
            (
              await prisma.destino.findUnique({
                where: { id: "publication-test-legacy" },
              })
            ).showOnWebsite,
            true,
          );
          await prisma.destino.update({
            where: { id: "publication-test-legacy" },
            data: { showOnWebsite: false },
          });
          await prisma.$transaction((tx) => tx.$executeRawUnsafe(sql));
          assert.equal(
            (
              await prisma.destino.findUnique({
                where: { id: "publication-test-legacy" },
              })
            ).showOnWebsite,
            false,
          );
        },
      );
      const destination = await prisma.destino.create({
        data: {
          ...base,
          id: "publication-test-porto",
          nombre: "Oporto prueba",
          countryCode: "PT",
          region: "Norte",
          editorialStatus: "published",
          preparationComplete: true,
          showOnWebsite: true,
        },
      });
      await t.test(
        "country gate blocks ID, list, map, compare and recommendations candidates",
        async () => {
          assert.equal(await destinations.getDestinoById(destination.id), null);
          assert.ok(
            !(
              await destinations.compareDestinos([
                destination.id,
                "publication-test-legacy",
              ])
            ).length,
          );
          assert.ok(
            !(await destinations.getMapaDestinos({})).some(
              (d) => d.id === destination.id,
            ),
          );
          const list = await publication.list({
            resource: "destinos",
            country: "PT",
            region: "Norte",
          });
          assert.equal(
            list.items.find((d) => d.id === destination.id).state,
            "blocked",
          );
        },
      );
      await t.test(
        "finished hidden, published and upcoming states stay independent",
        async () => {
          await publication.updateCountry("PT", {
            preparationComplete: true,
            showOnWebsite: true,
          });
          assert.ok(await destinations.getDestinoById(destination.id));
          await publication.update("destinos", destination.id, {
            preparationComplete: true,
            showOnWebsite: false,
            countryCode: "PT",
            region: "Norte",
          });
          assert.equal(await destinations.getDestinoById(destination.id), null);
          assert.equal(
            (
              await publication.list({
                resource: "destinos",
                country: "PT",
                state: "ready",
              })
            ).total,
            1,
          );
          await publication.update("destinos", destination.id, {
            preparationComplete: false,
            showOnWebsite: true,
            countryCode: "PT",
            region: "Norte",
          });
          assert.equal(await destinations.getDestinoById(destination.id), null);
          assert.equal(
            (await publication.preview("PT")).items.find(
              (d) => d.id === destination.id,
            ).state,
            "upcoming",
          );
          await publication.update("destinos", destination.id, {
            preparationComplete: true,
            showOnWebsite: true,
            countryCode: "PT",
            region: "Norte",
          });
        },
      );
      await t.test(
        "nested places, essential activities and municipality catalogue obey visibility",
        async () => {
          const town = await prisma.municipio.create({
            data: {
              nombre: "Villa de prueba",
              precios: "80",
              conexiones: "Bus",
              countryCode: "PT",
              region: "Norte",
              editorialStatus: "published",
              preparationComplete: true,
              showOnWebsite: true,
              guideEnabled: true,
              descripcion: "Descripción de la villa suficientemente completa.",
            },
          });
          await prisma.destinoMunicipio.create({
            data: { destinoId: destination.id, municipioId: town.id },
          });
          const group = await prisma.essentialGroup.create({
            data: { destinoId: destination.id, title: "Ideas" },
          });
          const essential = await prisma.essentialItem.create({
            data: {
              groupId: group.id,
              title: "Paseo de prueba",
              description:
                "Una experiencia de prueba con descripción suficiente.",
              countryCode: "PT",
              preparationComplete: true,
              showOnWebsite: false,
            },
          });
          const hotel = await prisma.hotel.create({
            data: {
              nombre: "Hotel de prueba",
              descripcion: "Descripción de hotel suficientemente completa.",
              countryCode: "PT",
              preparationComplete: true,
              showOnWebsite: false,
              isPublished: true,
            },
          });
          await prisma.municipioHotel.create({
            data: { municipioId: town.id, recordId: hotel.id },
          });
          const view = await destinations.getDestinoById(destination.id);
          assert.equal(view.essentialGroups[0].items.length, 0);
          const source = await publication.list({
            resource: "actividades",
            country: "PT",
          });
          assert.ok(
            source.items.some((e) => e.id === `source_${essential.id}`),
          );
          await publication.update("actividades", `source_${essential.id}`, {
            preparationComplete: true,
            showOnWebsite: true,
            countryCode: "PT",
            region: "Norte",
          });
          publicCache.clear();
          assert.equal(
            (await destinations.getDestinoById(destination.id))
              .essentialGroups[0].items.length,
            1,
          );
          const {
            publicGuideInclude,
            flattenGuide,
          } = require("../src/domain/municipalityCatalog");
          let guide = await prisma.municipio.findUnique({
            where: { id: town.id },
            include: publicGuideInclude,
          });
          assert.equal(flattenGuide(guide).hoteles.length, 0);
          await publication.update("hoteles", hotel.id, {
            preparationComplete: true,
            showOnWebsite: true,
            countryCode: "PT",
            region: "Norte",
          });
          guide = await prisma.municipio.findUnique({
            where: { id: town.id },
            include: publicGuideInclude,
          });
          assert.equal(flattenGuide(guide).hoteles.length, 1);
          // A normal destination edit must not hide or re-publish its essential records.
          await prisma.tourismType.upsert({
            where: { slug: "publication-test-cultural" },
            create: {
              name: "Publication Test Cultural",
              slug: "publication-test-cultural",
              isActive: false,
              editorialStatus: "draft",
            },
            update: {},
          });
          const admin = require("../src/services/adminService");
          const full = await admin.getDestino(destination.id);
          await admin.updateDestino(destination.id, {
            ...full,
            tipoTurismoPrincipal: "Publication Test Cultural",
            imagen: "https://example.test/cover.jpg",
          });
          assert.equal(
            (
              await prisma.essentialItem.findUnique({
                where: { id: essential.id },
              })
            ).showOnWebsite,
            true,
          );
          await prisma.municipio.delete({ where: { id: town.id } });
          await prisma.hotel.delete({ where: { id: hotel.id } });
        },
      );
      await t.test(
        "global taxonomies ignore geographic filters and invalid input is rejected",
        async () => {
          await assert.rejects(
            publication.update("destinos", destination.id, {
              preparationComplete: "yes",
              showOnWebsite: false,
              countryCode: "PT",
              region: "Norte",
            }),
            (e) => e.status === 400,
          );
          await assert.rejects(
            publication.list({ resource: "user" }),
            (e) => e.status === 400,
          );
          await publication.list({
            resource: "tipos-actividad",
            country: "PT",
          });
          await publication.summary({ country: "PT", region: "Norte" });
          await publication.countries();
        },
      );
      await t.test(
        "country pages enforce country and destination visibility, pagination and teaser projections",
        async () => {
          const countries = require("../src/services/countryService");
          await prisma.country.upsert({
            where: { code: "ZZ" },
            create: { code: "ZZ", name: "Test country" },
            update: { preparationComplete: false, showOnWebsite: false },
          });
          await prisma.destino.createMany({
            data: Array.from({ length: 27 }, (_, i) => ({
              ...base,
              id: "publication-test-country-" + i,
              nombre: "Country destination " + String(i).padStart(2, "0"),
              presupuesto: i === 0 ? "Alto" : "Medio",
              ubicacion: i === 0 ? "Costa" : "Interior",
              countryCode: "ZZ",
              region: i < 10 ? "North" : "South",
              editorialStatus: "published",
              preparationComplete: true,
              showOnWebsite: true,
            })),
          });
          assert.equal(
            (await countries.list()).some((c) => c.code === "ZZ"),
            false,
          );
          await assert.rejects(countries.page("ZZ"), (e) => e.status === 404);
          publicCache.clear();
          assert.equal(
            (await destinations.searchDestinosPage({ countryCode: "ZZ" }))
              .total,
            0,
          );
          assert.ok(
            !(await destinations.getFilterOptions()).countries.some(
              (c) => c.code === "ZZ",
            ),
          );
          await prisma.country.update({
            where: { code: "ZZ" },
            data: { preparationComplete: true, showOnWebsite: true },
          });
          publicCache.clear();
          assert.ok(
            (await destinations.getFilterOptions()).countries.some(
              (c) => c.code === "ZZ",
            ),
          );
          const countryResults = await destinations.searchDestinosPage({
            countryCode: "zz",
            limit: "24",
          });
          assert.equal(countryResults.total, 27);
          assert.ok(
            countryResults.items.every((d) =>
              d.id.startsWith("publication-test-country-"),
            ),
          );
          assert.equal(
            (
              await destinations.searchDestinosPage({
                countryCode: "ZZ",
                presupuesto: "Alto",
              })
            ).total,
            1,
          );
          assert.equal(
            (await destinations.searchDestinosPage({ countryCode: "XX" }))
              .total,
            0,
          );
          const first = await countries.page("zz");
          assert.equal(first.total, 27);
          assert.equal(first.items.length, 24);
          assert.equal(first.hasMore, true);
          assert.equal(
            (await countries.page("ZZ", { offset: 24 })).items.length,
            3,
          );
          assert.equal(
            (await countries.page("ZZ", { region: "North" })).total,
            10,
          );
          assert.equal(
            (await countries.page("ZZ", { presupuesto: "Alto" })).total,
            1,
          );
          assert.equal(
            (await countries.page("ZZ", { ubicacion: "Costa" })).total,
            1,
          );
          assert.equal(
            (
              await countries.page("ZZ", {
                presupuesto: "Alto",
                ubicacion: "Interior",
              })
            ).total,
            0,
          );
          assert.equal(
            (await countries.page("ZZ", { tipoTurismo: "Naturaleza" })).total,
            0,
          );
          const scoped = await countries.page("ZZ", {
            q: "Country destination",
            countryCode: "ES",
            month: "8",
            avoidCrowds: "true",
          });
          assert.equal(scoped.total, 27);
          assert.ok(
            scoped.items.every((d) =>
              d.id.startsWith("publication-test-country-"),
            ),
          );
          assert.deepEqual(first.filterOptions.locations, [
            "Costa",
            "Interior",
          ]);
          await prisma.destino.update({
            where: { id: "publication-test-country-0" },
            data: { showOnWebsite: false },
          });
          publicCache.clear();
          assert.equal((await countries.page("ZZ")).total, 26);
          await prisma.country.update({
            where: { code: "ZZ" },
            data: { preparationComplete: false, showOnWebsite: true },
          });
          assert.deepEqual(await countries.page("ZZ"), {
            code: "ZZ",
            name: "Test country",
            status: "upcoming",
          });
          publicCache.clear();
          assert.ok(
            !(await destinations.getFilterOptions()).countries.some(
              (c) => c.code === "ZZ",
            ),
          );
          assert.equal(
            (await destinations.searchDestinosPage({ countryCode: "ZZ" }))
              .total,
            0,
          );
          const teaser = (await countries.list()).find((c) => c.code === "ZZ");
          assert.deepEqual(teaser, {
            code: "ZZ",
            name: "Test country",
            status: "upcoming",
          });
          await prisma.country.update({
            where: { code: "ZZ" },
            data: { showOnWebsite: false },
          });
          await assert.rejects(countries.page("ZZ"), (e) => e.status === 404);
        },
      );
      await t.test(
        "HTTP routes reject anonymous and non-admin users",
        async () => {
          const app = require("../src/app");
          server = app.listen(0, "127.0.0.1");
          await new Promise((resolve) => server.once("listening", resolve));
          const baseUrl = `http://127.0.0.1:${server.address().port}`;
          const response = await fetch(
            `${baseUrl}/api/admin/publication/countries`,
          );
          assert.equal(response.status, 401);
          assert.equal(
            (
              await fetch(`${baseUrl}/api/admin/publication/countries/PT`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  preparationComplete: true,
                  showOnWebsite: true,
                }),
              })
            ).status,
            401,
          );
          const viewer = await prisma.user.create({
            data: {
              email: `publication-test-${Date.now()}@example.test`,
              passwordHash: "test-only",
              role: "user",
            },
          });
          const token = require("../src/utils/jwt").signToken(viewer.id);
          assert.equal(
            (
              await fetch(`${baseUrl}/api/admin/publication/countries`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            ).status,
            403,
          );
          await prisma.user.delete({ where: { id: viewer.id } });
        },
      );
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      await prisma.destino.deleteMany({
        where: { id: { startsWith: "publication-test-" } },
      });
      await prisma.country.deleteMany({ where: { code: "ZZ" } });
      await prisma.$disconnect();
      await pool.end();
    }
  },
);
