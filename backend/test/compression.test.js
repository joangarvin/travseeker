const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const zlib = require("node:zlib");
const express = require("express");
const { gzipJson } = require("../src/middleware/security");
async function fixture(t) {
  const app = express();
  app.use(gzipJson);
  app.get("/large", (_req, res) => {
    res.vary("Origin");
    res.vary("Accept-Language");
    res.set("Content-Language", "es");
    res.json({ description: "España ".repeat(4000) });
  });
  app.get("/small", (_req, res) => res.json({ ok: true }));
  app.get("/plain", (_req, res) => res.send("hello"));
  app.get("/empty", (_req, res) => res.status(204).end());
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  return server.address().port;
}
function read(port, path, encoding) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        host: "127.0.0.1",
        port,
        path,
        headers: { "Accept-Encoding": encoding },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
  });
}
test("async gzip preserves content, variants, lengths and concurrent health responses", async (t) => {
  const port = await fixture(t);
  const [large, small] = await Promise.all([
    read(port, "/large", "gzip"),
    read(port, "/small", "gzip"),
  ]);
  assert.equal(large.status, 200);
  assert.equal(large.headers["content-encoding"], "gzip");
  assert.equal(Number(large.headers["content-length"]), large.body.length);
  assert.equal(
    JSON.parse(zlib.gunzipSync(large.body)).description,
    "España ".repeat(4000),
  );
  for (const field of ["Origin", "Accept-Language", "Accept-Encoding"])
    assert.ok(large.headers.vary.includes(field));
  assert.equal(large.headers["content-language"], "es");
  assert.equal(small.headers["content-encoding"], undefined);
  assert.deepEqual(JSON.parse(small.body), { ok: true });
});
test("gzip q=0, identity, HEAD, non-JSON and empty responses are not compressed", async (t) => {
  const port = await fixture(t);
  for (const encoding of ["gzip;q=0, identity", "identity", "br"]) {
    const r = await read(port, "/large", encoding);
    assert.equal(r.headers["content-encoding"], undefined);
    assert.equal(JSON.parse(r.body).description, "España ".repeat(4000));
  }
  assert.equal((await read(port, "/plain", "gzip")).body.toString(), "hello");
  assert.equal((await read(port, "/empty", "gzip")).status, 204);
  const head = await fetch(`http://127.0.0.1:${port}/large`, {
    method: "HEAD",
    headers: { "accept-encoding": "gzip" },
  });
  assert.equal(head.headers.get("content-encoding"), null);
  assert.equal(await head.text(), "");
});
test("gzip worker error falls back to valid uncompressed JSON", async (t) => {
  const port = await fixture(t);
  const original = zlib.gzip;
  zlib.gzip = (_body, _options, callback) =>
    setImmediate(() => callback(new Error("compression failed")));
  try {
    const r = await read(port, "/large", "gzip");
    assert.equal(r.status, 200);
    assert.equal(r.headers["content-encoding"], undefined);
    assert.equal(JSON.parse(r.body).description, "España ".repeat(4000));
  } finally {
    zlib.gzip = original;
  }
});
