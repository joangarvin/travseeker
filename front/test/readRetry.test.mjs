import test from 'node:test';
import assert from 'node:assert/strict';
import { withReadRetry } from '../src/services/readRetry.ts';
import { createRequestCache, isPublicDataPath } from '../src/services/publicRequestCache.ts';
test('one transient read failure retries with bounded backoff, and concurrent consumers share the retry', async () => {
  const cache = createRequestCache();
  let calls = 0,
    pauses = 0;
  const read = () =>
    withReadRetry(
      async () => {
        if (++calls === 1) throw new TypeError('Failed to fetch');
        return { ok: true };
      },
      'GET',
      undefined,
      async (ms) => {
        assert.ok(ms >= 200 && ms < 400);
        pauses++;
      },
    );
  const results = await Promise.all(Array.from({ length: 50 }, () => cache.read('map', read)));
  assert.equal(calls, 2);
  assert.equal(pauses, 1);
  assert.ok(results.every((r) => r.ok));
});
test('persistent network failures retry once, HTTP failures and writes never retry', async () => {
  for (const [method, error, expected] of [
    ['GET', new TypeError('network'), 2],
    ['POST', new TypeError('network'), 1],
    ['DELETE', new TypeError('network'), 1],
    ['GET', Object.assign(new Error('unavailable'), { status: 503 }), 1],
    ['GET', new SyntaxError('invalid JSON'), 1],
  ]) {
    let calls = 0;
    await assert.rejects(
      withReadRetry(
        async () => {
          calls++;
          throw error;
        },
        method,
        undefined,
        async () => {},
      ),
    );
    assert.equal(calls, expected);
  }
});
test('abort before request and during retry delay stops the operation', async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = withReadRetry(
    async () => {
      calls++;
      throw new TypeError('network');
    },
    'GET',
    controller.signal,
  );
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 1);
  await assert.rejects(
    withReadRetry(
      async () => {
        calls++;
      },
      'GET',
      controller.signal,
    ),
    { name: 'AbortError' },
  );
  assert.equal(calls, 1);
});
test('countries are public-cache candidates but admin and private trips remain excluded', () => {
  for (const path of ['/paises', '/paises/ES?lang=en']) assert.ok(isPublicDataPath(path));
  for (const path of ['/paises/admin', '/admin/paises', '/colecciones', '/auth/me'])
    assert.equal(isPublicDataPath(path), false);
});
