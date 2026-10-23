const test = require("node:test"),
  assert = require("node:assert/strict");
const { createCompressedJsonCache } = require("../src/cache/compressedJson");
test("public compression coalesces identical bytes, changed bytes never reuse an old response, private responses are independent", async () => {
  let calls = 0;
  const cache = createCompressedJsonCache({
    compress: (body, done) => {
      calls++;
      setImmediate(() => done(null, Buffer.from(body)));
    },
  });
  const results = await Promise.all(
    Array.from({ length: 100 }, () => cache.read(Buffer.from("public"), true)),
  );
  assert.equal(calls, 1);
  assert.ok(results.every((b) => b.toString() === "public"));
  assert.equal(
    (await cache.read(Buffer.from("published changed"), true)).toString(),
    "published changed",
  );
  assert.equal(calls, 2);
  await cache.read(Buffer.from("private"), false);
  await cache.read(Buffer.from("private"), false);
  assert.equal(calls, 4);
});
test("compressed cache expires, respects memory/entry limits and never stores a compression failure", async () => {
  let calls = 0,
    time = 0;
  const cache = createCompressedJsonCache({
    maxBytes: 10,
    maxEntries: 1,
    ttlMs: 10,
    now: () => time,
    compress: (body, done) => {
      calls++;
      done(null, Buffer.from(body));
    },
  });
  await cache.read(Buffer.from("one"), true);
  await cache.read(Buffer.from("two"), true);
  await cache.read(Buffer.from("one"), true);
  assert.equal(calls, 3);
  time = 11;
  await cache.read(Buffer.from("one"), true);
  assert.equal(calls, 4);
  await cache.read(Buffer.alloc(20), true);
  await cache.read(Buffer.alloc(20), true);
  assert.equal(calls, 6);
  let fails = true;
  const retry = createCompressedJsonCache({
    compress: (_body, done) =>
      fails ? done(new Error("worker failed")) : done(null, Buffer.from("ok")),
  });
  await assert.rejects(retry.read(Buffer.from("failed"), true));
  fails = false;
  assert.equal(
    (await retry.read(Buffer.from("failed"), true)).toString(),
    "ok",
  );
});
