const test = require('node:test');
const assert = require('node:assert/strict');
const { createPublicCache, stableKey } = require('../src/cache/publicData');
const { publicDataCache, isPublicDataPath } = require('../src/middleware/publicCache');
const { EventEmitter } = require('node:events');

test('concurrent public reads and repeat visits execute one load; callers cannot mutate cached data', async () => {
  const cache = createPublicCache();
  let queries = 0;
  const load = async () => { queries++; return { title: 'Spain', translations: { en: 'Spain' } }; };
  const results = await Promise.all(Array.from({ length: 100 }, () => cache.read('destination', load)));
  results[0].title = 'changed';
  assert.equal((await cache.read('destination', load)).title, 'Spain');
  assert.equal(queries, 1);
});

test('expiration, invalidation and failures cause fresh loads', async () => {
  let time = 0, calls = 0;
  const cache = createPublicCache({ ttlMs: 10, now: () => time });
  const load = async () => ++calls;
  assert.equal(await cache.read('key', load), 1);
  time = 11;
  assert.equal(await cache.read('key', load), 2);
  cache.clear();
  assert.equal(await cache.read('key', load), 3);
  await assert.rejects(cache.read('error', () => { throw new Error('offline'); }));
  assert.equal(await cache.read('error', load), 4);
});

test('save during an in-flight read cannot repopulate cache with old data', async () => {
  const cache = createPublicCache();
  let resolve;
  const old = cache.read('key', () => new Promise((done) => { resolve = done; }));
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.read('key', async () => 'new'), 'new');
  resolve('old');
  await old;
  assert.equal(await cache.read('key', async () => 'wrong'), 'new');
});

test('cache has entry and byte limits', async () => {
  const cache = createPublicCache({ maxEntries: 1, maxBytes: 20 });
  await cache.read('a', async () => 'a');
  await cache.read('b', async () => 'b');
  assert.equal(await cache.read('a', async () => 'fresh'), 'fresh');
  await cache.read('large', async () => 'x'.repeat(100));
  assert.equal(await cache.read('large', async () => 'uncached'), 'uncached');
});

test('public route allowlist excludes private data and reviews', () => {
  for (const path of ['/api/destinos', '/api/destinos/abc', '/api/destinos/abc/climate', '/api/stats']) assert.equal(isPublicDataPath(path), true);
  for (const path of ['/api/auth/me', '/api/admin/destinos', '/api/colecciones', '/api/destinos/abc/reviews']) assert.equal(isPublicDataPath(path), false);
  assert.equal(stableKey({ b: 1, a: 2 }), stableKey({ a: 2, b: 1 }));
  assert.notEqual(stableKey({ lang: 'es' }), stableKey({ lang: 'en' }));
});

test('only successful public responses receive browser caching', () => {
  for (const statusCode of [200, 404, 500]) {
    const res = Object.assign(new EventEmitter(), { statusCode, set(key, value) { this[key] = value; }, json(body) { return body; } });
    publicDataCache({ method: 'GET', path: '/api/destinos' }, res, () => {});
    res.json([]);
    assert.equal(res['Cache-Control'], statusCode === 200 ? 'private, max-age=60' : undefined);
  }
});

test('successful editorial writes invalidate server data, failed writes do not', async () => {
  const { publicCache } = require('../src/cache/publicData');
  publicCache.clear();
  await publicCache.read('invalidation-test', async () => 'old');
  for (const statusCode of [403, 200]) {
    const res = Object.assign(new EventEmitter(), { statusCode });
    publicDataCache({ method: 'PUT', path: '/api/admin/destinos/123' }, res, () => {});
    res.emit('finish');
    assert.equal(await publicCache.read('invalidation-test', async () => 'new'), statusCode === 403 ? 'old' : 'new');
  }
});

test('compressed responses preserve language and origin cache variants', () => {
  const { gzipJson } = require('../src/middleware/security');
  const headers = { 'content-type': 'application/json', vary: 'Origin, Accept-Language' };
  const res = {
    statusCode: 200,
    write() {}, end() {},
    getHeader(key) { return headers[key.toLowerCase()]; },
    setHeader(key, value) { headers[key.toLowerCase()] = value; },
    removeHeader(key) { delete headers[key.toLowerCase()]; },
    vary(value) { headers.vary += `, ${value}`; },
  };
  gzipJson({ method: 'GET', headers: { 'accept-encoding': 'gzip' } }, res, () => {});
  res.end(JSON.stringify({ nombre: 'Costa' }));
  assert.equal(headers.vary, 'Origin, Accept-Language, Accept-Encoding');
});

test('public payloads omit translation dictionaries only after applying language', () => {
  const { withoutTranslations } = require('../src/middleware/localization');
  const { localizeContent } = require('../src/domain/localization');
  const source = { nombre: 'Costa', translations: { en: { nombre: 'Coast', imprescindibles: 'x'.repeat(2000) } }, items: [{ title: 'Faro', translations: { en: { title: 'Lighthouse' } } }] };
  assert.deepEqual(withoutTranslations(localizeContent(source, 'en')), { nombre: 'Coast', items: [{ title: 'Lighthouse' }] });
  assert.deepEqual(withoutTranslations(localizeContent(source, 'es')), { nombre: 'Costa', items: [{ title: 'Faro' }] });
  assert.ok(source.translations.en);
});
