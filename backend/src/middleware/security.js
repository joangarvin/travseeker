const zlib = require('node:zlib');
const { env } = require('../config/env');

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function createRateLimiter({ windowMs, max, message }) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.headers.authorization) {
    return next();
  }

  const requestOrigin = req.headers.origin;
  if (!requestOrigin) return next();

  try {
    const expectedOrigin = new URL(env.frontendUrl).origin;
    if (requestOrigin === expectedOrigin) return next();
  } catch {
    // A malformed configured origin is handled by CORS; reject the request here too.
  }

  return res.status(403).json({ error: 'Origen no permitido para esta operación' });
}

function gzipJson(req, res, next) {
  const acceptsGzip = String(req.headers['accept-encoding'] || '').includes('gzip');
  if (!acceptsGzip || req.method === 'HEAD') return next();

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const chunks = [];

  res.write = (chunk, encoding, callback) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    if (typeof callback === 'function') callback();
    return true;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    const body = Buffer.concat(chunks);
    const contentType = String(res.getHeader('Content-Type') || '');
    if (!body.length || res.statusCode === 204 || !contentType.includes('application/json') || res.getHeader('Content-Encoding')) {
      return originalEnd(body.length ? body : chunk, undefined, callback);
    }
    const compressed = zlib.gzipSync(body);
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', compressed.length);
    return originalEnd(compressed, undefined, callback);
  };
  return next();
}

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: 'Demasiadas solicitudes de acceso. Espera unos minutos e inténtalo de nuevo.',
});

const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiadas subidas. Espera unos minutos e inténtalo de nuevo.',
});

const metricsRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Demasiadas métricas. Espera unos minutos e inténtalo de nuevo.',
});

const climateRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 90,
  message: 'Demasiadas consultas climáticas. Espera unos minutos e inténtalo de nuevo.',
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
