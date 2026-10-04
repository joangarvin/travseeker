const { resolveLocale, localizeContent } = require("../domain/localization");

const { isPublicDataPath } = require('./publicCache');

function withoutTranslations(value) {
  if (Array.isArray(value)) return value.map(withoutTranslations);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'translations')
    .map(([key, child]) => [key, withoutTranslations(child)]));
}

function localization(req, res, next) {
  req.locale = resolveLocale(req.query.lang || req.get("Accept-Language"));
  res.vary("Accept-Language");
  // Admin always receives canonical content plus all translations for editing.
  const locale = req.path.startsWith("/api/admin") ? "es" : req.locale;
  res.set("Content-Language", locale);
  const json = res.json.bind(res);
  res.json = (body) => {
    const localized = localizeContent(body, locale);
    return json(isPublicDataPath(req.path) ? withoutTranslations(localized) : localized);
  };
  next();
}

module.exports = { localization, withoutTranslations };
