// Process-local, demand-filled cache: no timers or database keep-alive queries.
// Clone results because localization and service consumers may modify objects.
function createPublicCache({
  ttlMs = 900_000,
  maxEntries = 256,
  maxBytes = 32 * 1024 * 1024,
  now = Date.now,
} = {}) {
  const entries = new Map();
  const pending = new Map();
  let bytes = 0;
  let generation = 0;
  function remove(key) {
    const entry = entries.get(key);
    if (entry) bytes -= entry.bytes;
    entries.delete(key);
  }
  function clear() {
    generation += 1;
    entries.clear();
    pending.clear();
    bytes = 0;
  }
  async function read(key, load) {
    const hit = entries.get(key);
    if (hit && hit.expires > now()) {
      entries.delete(key);
      entries.set(key, hit);
      return structuredClone(hit.value);
    }
    remove(key);
    if (pending.has(key)) return structuredClone(await pending.get(key));
    const started = generation;
    const request = Promise.resolve()
      .then(load)
      .then((value) => {
        if (value == null || started !== generation || ttlMs <= 0) return value;
        const size = Buffer.byteLength(JSON.stringify(value));
        if (size > maxBytes) return value;
        // Purge expired entries before evicting the least recently used data.
        for (const [entryKey, entry] of entries)
          if (entry.expires <= now()) remove(entryKey);
        while (entries.size >= maxEntries || bytes + size > maxBytes)
          remove(entries.keys().next().value);
        entries.set(key, {
          value: structuredClone(value),
          expires: now() + ttlMs,
          bytes: size,
        });
        bytes += size;
        return value;
      });
    pending.set(key, request);
    try {
      return structuredClone(await request);
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  }
  return { read, clear };
}

const configuredTtl = Number(process.env.PUBLIC_CACHE_TTL_SECONDS ?? 900);
const publicCache = createPublicCache({
  ttlMs:
    Number.isFinite(configuredTtl) && configuredTtl >= 0
      ? configuredTtl * 1000
      : 900_000,
});

function stableKey(value) {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
}
function cachedPublic(name, load) {
  return (...args) =>
    publicCache.read(`${name}:${stableKey(args)}`, () => load(...args));
}
module.exports = { createPublicCache, publicCache, cachedPublic, stableKey };
