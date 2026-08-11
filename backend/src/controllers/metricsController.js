const { asyncHandler } = require('../utils/asyncHandler');

const ALLOWED_METRICS = new Set(['FCP', 'LCP', 'CLS']);

const report = asyncHandler(async (req, res) => {
  const { name, value, path } = req.body || {};
  if (!ALLOWED_METRICS.has(name) || !Number.isFinite(value)) {
    return res.status(400).json({ error: 'Métrica no válida' });
  }

  console.info(
    JSON.stringify({
      type: 'web-vital',
      name,
      value: Number(value.toFixed(3)),
      path: typeof path === 'string' ? path.slice(0, 160) : '/',
      at: new Date().toISOString(),
    }),
  );
  return res.status(202).json({ accepted: true });
});

module.exports = { report };
