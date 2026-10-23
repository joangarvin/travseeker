const { createHash } = require("node:crypto");
const zlib = require("node:zlib");

// Key actual serialized bytes, never URLs or authentication. Only public JSON
// opts into reuse. Changed/publication-filtered content cannot hit old bytes.
function createCompressedJsonCache({
  maxBytes = 8 * 1024 * 1024,
  maxEntries = 128,
  ttlMs = 60000,
  now = Date.now,
  compress = (body, done) =>
    zlib.gzip(body, { level: zlib.constants.Z_BEST_SPEED }, done),
} = {}) {
  const values = new Map(),
    pending = new Map();
  let bytes = 0;
  function remove(key) {
    const entry = values.get(key);
    if (entry) bytes -= entry.value.length;
    values.delete(key);
  }
  function run(body) {
    return new Promise((resolve, reject) =>
      compress(body, (error, value) =>
        error ? reject(error) : resolve(value),
      ),
    );
  }
  async function read(body, reuse) {
    if (!reuse) return run(body);
    const key = createHash("sha256").update(body).digest("hex");
    const hit = values.get(key);
    if (hit && hit.expires > now()) {
      values.delete(key);
      values.set(key, hit);
      return hit.value;
    }
    remove(key);
    if (pending.has(key)) return pending.get(key);
    const work = run(body).then((value) => {
      if (value.length > maxBytes) return value;
      for (const [k, v] of values) if (v.expires <= now()) remove(k);
      while (values.size >= maxEntries || bytes + value.length > maxBytes)
        remove(values.keys().next().value);
      values.set(key, { value, expires: now() + ttlMs });
      bytes += value.length;
      return value;
    });
    pending.set(key, work);
    try {
      return await work;
    } finally {
      if (pending.get(key) === work) pending.delete(key);
    }
  }
  return { read };
}
module.exports = {
  createCompressedJsonCache,
  compressedJson: createCompressedJsonCache(),
};
