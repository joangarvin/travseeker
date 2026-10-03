const config = require("../../../shared/localization.json");
const supportedLocales = new Set(config.languages.map(({ code }) => code));
const translatableFields = new Set(
  Object.values(config.fields).flatMap(Object.keys),
);

function resolveLocale(value) {
  const language = String(value || "")
    .trim()
    .toLowerCase()
    .split(/[-_,;]/)[0];
  return supportedLocales.has(language) ? language : config.defaultLocale;
}

// Spanish stays in the original columns. Omitted translations preserve existing
// data on update; an explicit empty object clears the optional translations.
function normalizeTranslations(value, resource) {
  if (value === undefined) return undefined;
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Las traducciones deben ser un objeto");
  const fields = config.fields[resource];
  if (!fields) throw new Error(`Unknown translation resource: ${resource}`);
  const result = {};
  for (const [locale, entries] of Object.entries(value)) {
    if (!supportedLocales.has(locale) || locale === config.defaultLocale)
      fail("Idioma de traducción no válido");
    if (!entries || typeof entries !== "object" || Array.isArray(entries))
      fail("Las traducciones deben ser un objeto");
    const translated = {};
    for (const [field, text] of Object.entries(entries)) {
      if (!Object.hasOwn(fields, field))
        fail(`Campo de traducción no válido: ${field}`);
      if (typeof text !== "string")
        fail(`La traducción de ${field} debe ser texto`);
      if (text.length > fields[field])
        fail(`La traducción de ${field} es demasiado larga`);
      if (text.trim()) translated[field] = text.trim();
    }
    result[locale] = translated;
  }
  return result;
}

function translationData(payload, resource) {
  const translations = normalizeTranslations(payload.translations, resource);
  return translations === undefined ? {} : { translations };
}

// Only editorial records carry translations. User names, reviews, trip notes,
// identifiers and canonical catalog names are deliberately left alone.
function localizeContent(value, locale) {
  if (locale === config.defaultLocale || value == null) return value;
  if (Array.isArray(value))
    return value.map((item) => localizeContent(item, locale));
  if (typeof value !== "object" || value instanceof Date) return value;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = key === "translations" ? item : localizeContent(item, locale);
  }
  if (value.name && value.slug)
    result.displayName =
      config.catalogLabels?.[locale]?.[value.name] || value.name;
  const translated = value.translations?.[locale];
  if (translated && typeof translated === "object") {
    for (const [field, text] of Object.entries(translated)) {
      if (
        !translatableFields.has(field) ||
        !Object.hasOwn(value, field) ||
        typeof text !== "string" ||
        !text.trim()
      )
        continue;
      // Catalog names are also filter values. Supply a separate display label.
      result[field === "name" ? "displayName" : field] = text;
    }
  }
  return result;
}

module.exports = {
  resolveLocale,
  normalizeTranslations,
  translationData,
  localizeContent,
};
