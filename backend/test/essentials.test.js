const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEssentialGroups,
  parseLegacyEssentials,
  serializeEssentialGroups,
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
  assert.match(serializeEssentialGroups(groups), /Casa &lt;Batlló&gt;/);
  assert.match(serializeEssentialGroups(groups), /Reserva &amp; acceso/);
});

test("rejects empty groups with an actionable message", () => {
  assert.throws(
    () => normalizeEssentialGroups([{ title: "Naturaleza", items: [] }]),
    /Añade al menos un lugar o plan/,
  );
});
