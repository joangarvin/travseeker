import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestCache, withAbort, isPublicDataPath } from '../src/services/publicRequestCache.ts';
import { responsiveImageUrl, IMAGE_WIDTHS } from '../src/utils/media.ts';

test('duplicate requests share one fetch and independent values; locale keys stay separate', async () => {
  const cache = createRequestCache();
  let calls = 0;
  const load = async () => { calls++; return { name: 'Spain' }; };
  const [a, b] = await Promise.all([cache.read('en/destinos', load), cache.read('en/destinos', load)]);
  a.name = 'changed';
  assert.equal(b.name, 'Spain');
  await cache.read('en/destinos', load);
  assert.equal(calls, 1);
  await cache.read('es/destinos', load);
  assert.equal(calls, 2);
});

test('one aborted subscriber does not cancel the shared fetch', async () => {
  const cache = createRequestCache();
  let resolve;
  const request = cache.read('key', () => new Promise((done) => { resolve = done; }));
  const controller = new AbortController();
  const subscriber = withAbort(request, controller.signal);
  controller.abort();
  await assert.rejects(subscriber, { name: 'AbortError' });
  resolve('ok');
  assert.equal(await withAbort(request), 'ok');
});

test('expiration, mutation invalidation and failed requests do not keep stale data', async () => {
  let time = 0;
  const cache = createRequestCache(10, () => time);
  await cache.read('key', async () => 'old');
  time = 11;
  assert.equal(await cache.read('key', async () => 'fresh'), 'fresh');
  cache.clear();
  assert.equal(await cache.read('key', async () => 'edited'), 'edited');
  await assert.rejects(cache.read('error', async () => { throw new Error(); }));
  assert.equal(await cache.read('error', async () => 'retry'), 'retry');
});

test('pending reads cannot refill the cache after a save', async () => {
  const cache = createRequestCache();
  let resolve;
  const request = cache.read('key', () => new Promise((done) => { resolve = done; }));
  await Promise.resolve();
  cache.clear();
  resolve('old');
  await request;
  assert.equal(await cache.read('key', async () => 'new'), 'new');
});

test('private endpoints are never eligible for shared request caching', () => {
  for (const path of ['/auth/me', '/colecciones', '/favoritos', '/admin/destinos', '/destinos/123/reviews']) assert.equal(isPublicDataPath(path), false);
  assert.equal(isPublicDataPath('/destinos?lang=en'), true);
});

test('Cloudinary URLs use bounded reusable widths, auto format/quality and preserve versions', () => {
  const original = 'https://res.cloudinary.com/example/image/upload/v123/travseeker/photo.jpg';
  const optimized = responsiveImageUrl(original, 500);
  assert.match(optimized, /f_auto,q_auto,c_limit,w_640\/v123\/travseeker\/photo.jpg$/);
  assert.equal(responsiveImageUrl(optimized, 500), optimized);
  assert.match(responsiveImageUrl(original, 9999), /w_1600\//);
  assert.equal(IMAGE_WIDTHS.length, 5);
  for (const url of ['/local.jpg', 'https://res.cloudinary.com.evil.test/image/upload/photo.jpg', 'https://res.cloudinary.com/example/image/upload/s--signed--/photo.jpg']) assert.equal(responsiveImageUrl(url, 500), url);
});
