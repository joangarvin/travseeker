const { normalizeTranslations } = require("./localization");
const config = require("../../../shared/localization.json");

const translationModels = {
  destination: "Destino",
  municipality: "Municipio",
  place: "Place",
  activity: "Activity",
  tourismType: "TourismType",
  essentialGroup: "EssentialGroup",
  essentialItem: "EssentialItem",
};

// Never overwrite an editor's translation or apply a translation to changed text.
function missingTranslationPatch(resource, record, entry) {
  const allowed = config.fields[resource];
  if (!allowed || entry.id !== record.id)
    throw new Error("Invalid translation entry");
  const english = normalizeTranslations({ en: entry.english }, resource).en;
  const patch = {};
  const stale = [];
  for (const [field, text] of Object.entries(english)) {
    if (record.translations?.en?.[field]?.trim()) continue;
    if (
      !Object.hasOwn(entry.source, field) ||
      record[field] !== entry.source[field]
    ) {
      stale.push(field);
      continue;
    }
    if (String(record[field] || "").trim()) patch[field] = text;
  }
  return { patch, stale };
}

module.exports = { translationModels, missingTranslationPatch };
