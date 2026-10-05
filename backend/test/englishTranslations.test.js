const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../data/english-translations.json");
const config = require("../../shared/localization.json");
const { normalizeTranslations } = require("../src/domain/localization");

test("prepared English content validates and preserves HTML structure", () => {
  assert.equal(manifest.language, "en");
  for (const [resource, entries] of Object.entries(manifest.resources)) {
    assert(config.fields[resource]);
    const ids = new Set();
    for (const entry of entries) {
      assert(!ids.has(entry.id), `Duplicate ${resource} ${entry.id}`);
      ids.add(entry.id);
      assert.deepEqual(
        Object.keys(entry.english).sort(),
        Object.keys(entry.source).sort(),
      );
      const validated = normalizeTranslations(
        { en: entry.english },
        resource,
      ).en;
      assert.deepEqual(validated, entry.english);
      for (const [field, original] of Object.entries(entry.source)) {
        assert(original.trim(), `Empty source ${entry.id}.${field}`);
        assert(
          entry.english[field].trim(),
          `Empty translation ${entry.id}.${field}`,
        );
        assert.deepEqual(
          entry.english[field].match(/<[^>]+>/g),
          original.match(/<[^>]+>/g),
          `HTML changed for ${entry.id}.${field}`,
        );
      }
    }
  }
});

test("all prepared activity labels match the English fallback catalogue", () => {
  for (const entry of manifest.resources.activity) {
    assert.equal(
      config.catalogLabels.en[entry.source.name],
      entry.english.name,
    );
  }
});
