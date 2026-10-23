const { compressedJson } = require("../cache/compressedJson");
const { isPublicDataPath } = require("./publicCache");
const { env } = require("../config/env");

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)",
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  res.setHeader("Cache-Control", "no-store");
  next();
}

function createRateLimiter({ windowMs, max, message }) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

function csrfProtection(req, res, next) {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.headers.authorization
  ) {
    return next();
  }

  const requestOrigin = req.headers.origin;
  if (!requestOrigin) return next();

  try {
    if (env.frontendOrigins.includes(requestOrigin)) return next();
  } catch {
    // A malformed configured origin is handled by CORS; reject the request here too.
  }

  return res
    .status(403)
    .json({ error: "Origen no permitido para esta operación" });
}

function gzipJson(req, res, next) {
  // Intercept the serialized response, not the global write/end stream contract.
  const send = res.send.bind(res);
  res.send = (value) => {
    const contentType = String(res.getHeader("Content-Type") || "");
    if (
      !contentType.includes("application/json") ||
      res.headersSent ||
      req.method === "HEAD" ||
      [204, 304].includes(res.statusCode) ||
      res.getHeader("Content-Encoding") ||
      !(typeof value === "string" || Buffer.isBuffer(value))
    )
      return send(value);
    res.vary("Accept-Encoding");
    const body = Buffer.isBuffer(value) ? value : Buffer.from(value);
    if (
      body.length < 1024 ||
      !req.headers["accept-encoding"] ||
      req.acceptsEncodings("gzip", "identity") !== "gzip"
    )
      return send(value);
    // Small JSON stays uncompressed. Large responses use the worker pool with
    // low-cost compression rather than blocking Node's event loop per visitor.
    compressedJson
      .read(body, res.statusCode === 200 && isPublicDataPath(req.path))
      .then(
        (compressed) => {
          if (res.destroyed || res.writableEnded) return;
          res.setHeader("Content-Encoding", "gzip");
          res.removeHeader("Content-Length");
          send(compressed);
        },
        () => {
          if (!res.destroyed && !res.writableEnded) send(value);
        },
      );
    return res;
  };
  next();
}

const authWriteRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message:
    "Demasiadas solicitudes de acceso. Espera unos minutos e inténtalo de nuevo.",
});

function authRateLimit(req, res, next) {
  // Reading the current session must not consume attempts reserved for signing in.
  if (req.method === "GET" && req.path === "/me") return next();
  return authWriteRateLimit(req, res, next);
}

const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Demasiadas subidas. Espera unos minutos e inténtalo de nuevo.",
});

const metricsRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Demasiadas métricas. Espera unos minutos e inténtalo de nuevo.",
});

const climateRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 90,
  message:
    "Demasiadas consultas climáticas. Espera unos minutos e inténtalo de nuevo.",
});

module.exports = {
  securityHeaders,
  csrfProtection,
  gzipJson,
  authRateLimit,
  uploadRateLimit,
  metricsRateLimit,
  climateRateLimit,
};
