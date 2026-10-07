const { publicCache } = require("../cache/publicData");

// Only these routes return the same public information to every visitor.
function isPublicDataPath(path) {
  return (
    /^\/api\/municipios\/[^/]+\/?$/.test(path) ||
    /^\/api\/(?:destacados|stats|mapa|activities|tourism-types)\/?$/.test(
      path,
    ) ||
    /^\/api\/destinos(?:\/[^/]+(?:\/(?:relacionados|climate))?)?\/?$/.test(path)
  );
}
function publicDataCache(req, res, next) {
  if (req.method === "GET" && isPublicDataPath(req.path)) {
    const json = res.json.bind(res);
    res.json = (body) => {
      // Browser reuse is short; private avoids accidentally caching CORS headers
      // at a shared proxy. Server-side caching provides the main database savings.
      if (res.statusCode === 200)
        res.set("Cache-Control", "private, max-age=60");
      return json(body);
    };
  }
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (/^\/api\/(?:admin|upload)(?:\/|$)/.test(req.path) ||
      /\/reviews(?:\/|$)/.test(req.path))
  ) {
    res.once("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) publicCache.clear();
    });
  }
  next();
}
module.exports = { publicDataCache, isPublicDataPath };
