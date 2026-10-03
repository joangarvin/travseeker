const { resolveLocale, localizeContent } = require("../domain/localization");

function localization(req, res, next) {
  req.locale = resolveLocale(req.query.lang || req.get("Accept-Language"));
  res.vary("Accept-Language");
  // Admin always receives canonical content plus all translations for editing.
  const locale = req.path.startsWith("/api/admin") ? "es" : req.locale;
  res.set("Content-Language", locale);
  const json = res.json.bind(res);
  res.json = (body) => json(localizeContent(body, locale));
  next();
}

module.exports = { localization };
