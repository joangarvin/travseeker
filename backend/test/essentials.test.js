const test = require("node:test");
const assert = require("node:assert/strict");
const {
  inferEssentialIcon,
  normalizeEssentialGroups,
  parseLegacyEssentials,
  serializeEssentialGroups,
  splitEmbeddedHeadings,
} = require("../src/domain/essentials");

test("converts legacy headings and list items into ordered groups", () => {
  const groups = parseLegacyEssentials(
    "<h3>Costa y mar</h3><ul><li>Visitar el faro.</li><li>Recorrer la cala.</li></ul><h3>Interior</h3><ul><li>Subir al castillo.</li></ul>",
  );
  assert.equal(groups.length, 2);
  assert.equal(groups[0].title, "Costa y mar");
  assert.deepEqual(
    groups[0].items.map((item) => item.title),
    ["Visitar el faro.", "Recorrer la cala."],
  );
  assert.equal(groups[1].items[0].sortOrder, 0);
});

test("keeps plain legacy content through a fallback group", () => {
  const groups = parseLegacyEssentials("Un paseo sin etiquetas HTML");
  assert.equal(groups[0].title, "Selección esencial");
  assert.equal(groups[0].items[0].title, "Un paseo sin etiquetas HTML");
});

test("normalizes, validates and safely serializes editor data", () => {
  const groups = normalizeEssentialGroups([
    {
      title: " Patrimonio ",
      items: [{ title: "Casa <Batlló>", description: "Reserva & acceso" }],
    },
  ]);
  assert.equal(groups[0].title, "Patrimonio");
  assert.equal(groups[0].icon, "Landmark");
  assert.match(serializeEssentialGroups(groups), /Casa &lt;Batlló&gt;/);
  assert.match(serializeEssentialGroups(groups), /Reserva &amp; acceso/);
});

test("normalizes practical details, image and reservation state", () => {
  const [group] = normalizeEssentialGroups([
    {
      title: "Costa",
      icon: "Waves",
      items: [
        {
          title: "Visitar el faro",
          icon: "Landmark",
          imageUrl: "https://res.cloudinary.com/demo/image/upload/faro.jpg",
          imageAlt: "Faro sobre el acantilado",
          duration: "45 min",
          bestTime: "Al final de la tarde",
          reservationRequired: false,
          officialUrl: "https://example.com/faro",
        },
      ],
    },
  ]);
  assert.equal(group.icon, "Waves");
  assert.equal(group.items[0].duration, "45 min");
  assert.equal(group.items[0].reservationRequired, false);
});

test("requires alternative text for essential images", () => {
  assert.throws(
    () =>
      normalizeEssentialGroups([
        {
          title: "Costa",
          items: [{ title: "Faro", imageUrl: "https://example.com/faro.jpg" }],
        },
      ]),
    /Describe la imagen/,
  );
});

test("infers useful icons without changing the title", () => {
  assert.equal(inferEssentialIcon("Historia y patrimonio"), "Landmark");
  assert.equal(inferEssentialIcon("Playas y costa"), "Waves");
  assert.equal(inferEssentialIcon("Sabores locales"), "Utensils");
});

test("turns category names imported as list items into groups", () => {
  const groups = parseLegacyEssentials(
    "<ul><li>Patrimonio histórico</li><li>Visitar la catedral.</li><li>Subir a la torre.</li><li>Playas y sol</li><li>Bañarse en la cala.</li></ul>",
  );
  assert.deepEqual(
    groups.map((group) => [group.title, group.items.map((item) => item.title)]),
    [
      ["Patrimonio histórico", ["Visitar la catedral.", "Subir a la torre."]],
      ["Playas y sol", ["Bañarse en la cala."]],
    ],
  );
  assert.equal(groups[1].sortOrder, 1);
  assert.equal(groups[1].items[0].sortOrder, 0);
});

test("keeps named places and enriched items as experiences", () => {
  const { groups, headings } = splitEmbeddedHeadings([
    {
      title: "Costa",
      items: [
        { title: "Praia das Catedrais", placeId: "p1" },
        { title: "Faro de Punta Atalaia", description: "Mirador." },
        { title: "Caminar por el acantilado." },
        { title: "Ver el atardecer." },
      ],
    },
    {
      title: "Lista de nombres",
      items: [{ title: "Castillo" }, { title: "Iglesia mayor." }],
    },
  ]);
  assert.equal(headings.length, 0);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].items.length, 4);
});

test("carries the heading translation over to the new group", () => {
  const { groups, headings } = splitEmbeddedHeadings([
    {
      title: "Selección esencial",
      items: [
        { title: "Comer bien.", translations: {} },
        {
          title: "Pueblos con encanto",
          translations: { en: { title: "Charming villages" } },
        },
        { title: "Pasear por Vejer." },
        { title: "Visitar Conil." },
      ],
    },
  ]);
  assert.equal(headings.length, 1);
  assert.equal(groups[0].title, "Selección esencial");
  assert.equal(groups[1].title, "Pueblos con encanto");
  assert.deepEqual(groups[1].translations, {
    en: { title: "Charming villages" },
  });
  assert.equal(groups[1].source, null);
  assert.equal(groups[1].items.length, 2);
});

test("rejects empty groups with an actionable message", () => {
  assert.throws(
    () => normalizeEssentialGroups([{ title: "Naturaleza", items: [] }]),
    /Añade al menos un lugar o plan/,
  );
});
