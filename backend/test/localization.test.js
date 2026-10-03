const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveLocale,
  normalizeTranslations,
  translationData,
  localizeContent,
} = require("../src/domain/localization");
const { localization } = require("../src/middleware/localization");
const {
  normalizeDestinationPayload,
  normalizeMunicipioPayload,
  normalizePlace,
} = require("../src/domain/adminPayload");
const { normalizeEssentialGroups } = require("../src/domain/essentials");
const { rankDestinationSearch } = require("../src/domain/search");
const config = require("../../shared/localization.json");

test("locale negotiation supports regional English and falls back to Spanish", () => {
  assert.equal(resolveLocale("en-GB,en;q=0.9"), "en");
  assert.equal(resolveLocale("es-ES"), "es");
  assert.equal(resolveLocale("fr"), "es");
  assert.equal(resolveLocale(undefined), "es");
});

test("translation validation rejects unknown languages, fields, shapes and oversized values", () => {
  for (const value of [
    null,
    [],
    { fr: {} },
    { es: {} },
    { en: [] },
    { en: { role: "admin" } },
    { en: { nombre: 42 } },
    { en: { nombre: "x".repeat(201) } },
  ]) {
    assert.throws(() => normalizeTranslations(value, "destination"), {
      status: 400,
    });
  }
  assert.throws(
    () =>
      normalizeTranslations(
        JSON.parse('{"en":{"__proto__":"unsafe"}}'),
        "destination",
      ),
    { status: 400 },
  );
  assert.equal(normalizeTranslations(undefined, "destination"), undefined);
  assert.deepEqual(translationData({}, "destination"), {});
  assert.deepEqual(
    normalizeTranslations(
      { en: { nombre: " Coast ", descripcion: "  " } },
      "destination",
    ),
    { en: { nombre: "Coast" } },
  );
  assert.deepEqual(normalizeTranslations({}, "destination"), {});
});

test("all editorial resources accept every configured field in every additional language", () => {
  for (const [resource, fields] of Object.entries(config.fields)) {
    const translations = Object.fromEntries(
      config.languages
        .filter(({ code }) => code !== config.defaultLocale)
        .map(({ code }) => [
          code,
          Object.fromEntries(
            Object.keys(fields).map((field) => [field, `Translated ${field}`]),
          ),
        ]),
    );
    assert.deepEqual(
      normalizeTranslations(translations, resource),
      translations,
    );
  }
});

test("public localization falls back per field, translates nested essentials, and preserves Spanish and user content", () => {
  const original = {
    nombre: "Costa",
    descripcion: "Texto español",
    presupuesto: "Bajo",
    translations: { en: { nombre: "Coast", descripcion: "" } },
    municipios: [
      {
        nombre: "Pueblo",
        conexiones: "Tren",
        translations: { en: { conexiones: "Train" } },
      },
    ],
    essentialGroups: [
      {
        title: "Visitas",
        translations: { en: { title: "Visits" } },
        items: [
          {
            title: "Faro",
            imageAlt: "Faro al amanecer",
            translations: {
              en: { title: "Lighthouse", imageAlt: "Lighthouse at dawn" },
            },
          },
        ],
      },
    ],
    reviews: [{ comment: "Mi opinión", user: { nombre: "Mar" } }],
  };
  const snapshot = structuredClone(original);
  const english = localizeContent(original, "en");
  assert.equal(english.nombre, "Coast");
  assert.equal(english.descripcion, "Texto español");
  assert.equal(english.presupuesto, "Bajo");
  assert.equal(english.municipios[0].conexiones, "Train");
  assert.equal(
    english.essentialGroups[0].items[0].imageAlt,
    "Lighthouse at dawn",
  );
  assert.deepEqual(english.reviews, original.reviews);
  assert.deepEqual(original, snapshot);
  assert.deepEqual(localizeContent(original, "es"), snapshot);
});

test("catalog translations never change names, slugs, IDs or canonical filter values", () => {
  const type = {
    id: "nature",
    name: "Naturaleza",
    slug: "naturaleza",
    translations: { en: { name: "Outdoors" } },
  };
  assert.equal(localizeContent(type, "en").displayName, "Outdoors");
  assert.equal(localizeContent(type, "en").name, "Naturaleza");
  assert.equal(
    localizeContent({ ...type, translations: {} }, "en").displayName,
    "Nature",
  );
});

test("admin responses stay canonical even when the interface requests English", () => {
  const body = { nombre: "Costa", translations: { en: { nombre: "Coast" } } };
  for (const [path, name, language] of [
    ["/api/admin/destinos/1", "Costa", "es"],
    ["/api/destinos/1", "Coast", "en"],
  ]) {
    let sent;
    const headers = {};
    const req = { path, query: {}, get: () => "en" };
    const res = {
      vary: () => {},
      set: (key, value) => {
        headers[key] = value;
      },
      json: (value) => {
        sent = value;
      },
    };
    localization(req, res, () => {});
    res.json(body);
    assert.equal(req.locale, "en");
    assert.equal(sent.nombre, name);
    assert.equal(headers["Content-Language"], language);
    assert.deepEqual(sent.translations, body.translations);
  }
});

test("English search finds translated titles, related content and default catalog labels", () => {
  const destination = {
    id: "coast",
    nombre: "Costa",
    translations: {
      en: { nombre: "Silver coast", descripcion: "A peaceful escape" },
    },
    descripcion: "Escapada tranquila",
    activityLinks: [{ activity: { name: "Senderismo", slug: "senderismo" } }],
    essentialGroups: [
      {
        title: "Lugares",
        items: [
          {
            title: "Faro",
            translations: { en: { title: "Historic lighthouse" } },
          },
        ],
      },
    ],
  };
  for (const query of [
    "Silver coast",
    "Historic lighthouse",
    "Hiking",
    "Costa",
  ]) {
    assert.equal(
      rankDestinationSearch([destination], query, "en")[0]?.id,
      "coast",
      query,
    );
  }
  assert.equal(
    rankDestinationSearch([destination], "Historic lighthouse", "es").length,
    0,
  );
});

test("payload normalization retains translations without replacing base fields", () => {
  const destination = normalizeDestinationPayload({
    nombre: "Costa",
    translations: { en: { nombre: "Coast" } },
  });
  assert.equal(destination.nombre, "Costa");
  assert.equal(destination.translations.en.nombre, "Coast");
  const town = normalizeMunicipioPayload({
    nombre: "Pueblo",
    translations: { en: { conexiones: "Train" } },
  });
  assert.equal(town.translations.en.conexiones, "Train");
  const place = normalizePlace({
    nombre: "Faro",
    categoria: "Mirador",
    latitud: 40,
    longitud: -3,
    translations: { en: { nombre: "Lighthouse" } },
  });
  assert.equal(place.translations.en.nombre, "Lighthouse");
  const groups = normalizeEssentialGroups([
    {
      title: "Visitas",
      translations: { en: { title: "Visits" } },
      items: [
        {
          title: "Faro",
          translations: {
            en: {
              title: "Lighthouse",
              duration: "One hour",
              bestTime: "Sunset",
              imageAlt: "Coast",
            },
          },
        },
      ],
    },
  ]);
  assert.equal(groups[0].translations.en.title, "Visits");
  assert.equal(groups[0].items[0].translations.en.bestTime, "Sunset");
});

test("extended activity catalogue has English display labels without altering filter values", () => {
  for (const [name, english] of [
    ["Patrimonio Románico", "Romanesque heritage"],
    ["Patrimonio Modernista", "Modernist heritage"],
    ["Submarinismo", "Scuba diving"],
    ["Ecoturismos", "Ecotourism"],
    ["Familiar", "Family-friendly"],
  ]) {
    const record = { name, slug: "activity", translations: {} };
    const result = localizeContent(record, "en");
    assert.equal(result.displayName, english);
    assert.equal(result.name, name);
  }
});
