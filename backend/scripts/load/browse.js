// Reproducible anonymous-user HTTP journeys against isolated loopback services only.
const fs = require("node:fs");
const { performance } = require("node:perf_hooks");
const api = "http://127.0.0.1:3003",
  web = "http://127.0.0.1:4178";
const stages = (process.env.LOAD_STAGES || "1,10,25,50,100")
  .split(",")
  .map(Number);
const seconds = Number(process.env.LOAD_SECONDS || 12),
  pause = Number(process.env.LOAD_THINK_MS || 200),
  ramp = Number(process.env.LOAD_RAMP_MS || 0);
if (
  stages.some((n) => !Number.isInteger(n) || n < 1 || n > 200) ||
  !Number.isFinite(seconds) ||
  seconds < 1 ||
  seconds > 60 ||
  !Number.isFinite(pause) ||
  pause < 0 ||
  pause > 5000 ||
  !Number.isFinite(ramp) ||
  ramp < 0 ||
  ramp > 1000
)
  throw new Error("Use 1–200 users, 1–60 seconds per stage");
const report = {
  started: new Date().toISOString(),
  description:
    "Anonymous HTTP journeys; no real browser rendering, writes, external providers or private data",
  stages: [],
};
let current;
let readRetry = (operation) => operation();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function percentile(a, p) {
  return a.length
    ? [...a].sort((x, y) => x - y)[
        Math.min(a.length - 1, Math.ceil(a.length * p) - 1)
      ]
    : 0;
}
async function request(base, path, label, validate) {
  const start = performance.now();
  let status = 0,
    bytes = 0,
    error = "",
    transportFailures = 0,
    wireAttempts = 0;
  try {
    const { r, body } = await readRetry(
      async () => {
        wireAttempts++;
        try {
          const r = await fetch(base + path, {
            headers: {
              "Accept-Encoding": "gzip",
              "Accept-Language": path.includes("lang=en") ? "en" : "es",
            },
            signal: AbortSignal.timeout(10000),
            redirect: "error",
          });
          const body = await r.text();
          return { r, body };
        } catch (error) {
          if (error instanceof TypeError) transportFailures++;
          throw error;
        }
      },
      base === api ? "GET" : "STATIC",
    );
    status = r.status;
    bytes = Number(r.headers.get("content-length")) || Buffer.byteLength(body);
    if (!r.ok) error = `HTTP ${status}: ${body.slice(0, 160)}`;
    else if (validate) {
      const json = JSON.parse(body);
      if (!validate(json)) error = "Unexpected JSON contract";
    }
  } catch (e) {
    error = [e.message, e.cause?.code, e.cause?.message]
      .filter(Boolean)
      .join(" | ");
  }
  const item = {
    transportFailures,
    wireAttempts,
    label,
    ms: performance.now() - start,
    status,
    bytes,
    error,
  };
  if (current) current.samples.push(item);
  return item;
}
function summary(samples) {
  const durations = samples.map((x) => x.ms);
  return {
    requests: samples.length,
    wireRequests: samples.reduce((n, s) => n + s.wireAttempts, 0),
    transportFailures: samples.reduce((n, s) => n + s.transportFailures, 0),
    recoveredReads: samples.filter((s) => !s.error && s.transportFailures > 0)
      .length,
    errors: samples.filter((x) => x.error).length,
    p50ms: +percentile(durations, 0.5).toFixed(1),
    p95ms: +percentile(durations, 0.95).toFixed(1),
    p99ms: +percentile(durations, 0.99).toFixed(1),
    maxms: +Math.max(0, ...durations).toFixed(1),
    bytes: samples.reduce((n, x) => n + x.bytes, 0),
  };
}
(async () => {
  if (process.env.LOAD_READ_RETRY === "1") {
    const { withReadRetry } =
      await import("../../../front/src/services/readRetry.ts");
    readRetry = withReadRetry;
    report.readRetry =
      "same frontend helper; one backoff retry for API GET transport failures only";
  }
  const first = await fetch(api + "/api/mapa");
  if (!first.ok) throw new Error("Isolated API unavailable");
  const ds = await first.json();
  if (!ds.length) throw new Error("Empty fixture");
  const html = await (await fetch(web + "/")).text();
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.(?:js|css))"/g),
  ].map((m) => m[1]);
  for (const users of stages) {
    const start = performance.now(),
      until = start + seconds * 1000 + (users - 1) * ramp;
    current = { users, samples: [], journeys: 0 };
    async function visitor(user) {
      await sleep(user * ramp);
      let turn = 0;
      while (performance.now() < until) {
        const d = ds[(user + turn) % ds.length],
          lang = (user + turn) % 4 === 0 ? "en" : "es",
          tail = `lang=${lang}`;
        await request(web, "/", "html");
        if (turn === 0)
          await Promise.all(assets.map((a) => request(web, a, "asset")));
        await Promise.all(
          [
            [
              "/api/destinos?meta=1&" + tail,
              "discover",
              (x) => Array.isArray(x.items),
            ],
            ["/api/destacados?" + tail, "featured", Array.isArray],
            ["/api/stats?" + tail, "stats", (x) => !!x],
            ["/api/paises?" + tail, "countries", Array.isArray],
            [
              "/api/destinos/filter-options?" + tail,
              "filters",
              (x) => Array.isArray(x.locations),
            ],
            ["/api/activities?" + tail, "activities", Array.isArray],
            ["/api/tourism-types?" + tail, "types", Array.isArray],
          ].map(([p, l, v]) => request(api, p, l, v)),
        );
        await sleep(pause);
        await request(
          api,
          "/api/mapa?" + tail,
          "map",
          (x) => Array.isArray(x) && x.every((d) => d.countryCode),
        );
        const term = [
          "costa",
          "naturaleza",
          "Barcelona",
          "Sierra",
          "playa",
          "senderismo",
        ][(user + turn) % 6];
        await request(
          api,
          `/api/destinos?meta=1&q=${encodeURIComponent(term)}&${tail}`,
          "search",
          (x) => Array.isArray(x.items),
        );
        await sleep(pause);
        await Promise.all([
          request(
            api,
            `/api/destinos/${d.id}?${tail}`,
            "detail",
            (x) => x.id === d.id,
          ),
          request(
            api,
            `/api/destinos/${d.id}/relacionados?${tail}`,
            "related",
            Array.isArray,
          ),
          request(
            api,
            `/api/destinos/${d.id}/reviews?${tail}`,
            "reviews",
            (x) => Array.isArray(x) || typeof x === "object",
          ),
        ]);
        await request(
          api,
          `/api/destinos/compare?ids=${[d.id, ds[(user + turn + 1) % ds.length].id].join(",")}&${tail}`,
          "compare",
          (x) => Array.isArray(x) && x.length === 2,
        );
        await request(
          api,
          "/api/paises/ES?" + tail,
          "country",
          (x) => x.code === "ES" && Array.isArray(x.items),
        );
        current.journeys++;
        turn++;
        await sleep(pause);
      }
    }
    await Promise.all(Array.from({ length: users }, (_, i) => visitor(i)));
    const elapsed = (performance.now() - start) / 1000,
      samples = current.samples;
    const result = {
      users,
      rampMillisecondsPerUser: ramp,
      thinkMilliseconds: pause,
      startedAt: new Date(
        Date.now() - (performance.now() - start),
      ).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: +elapsed.toFixed(2),
      completedJourneys: current.journeys,
      ...summary(samples),
      requestsPerSecond: +(samples.length / elapsed).toFixed(1),
      endpoints: {},
      failureKinds: samples
        .filter((s) => s.error)
        .reduce((counts, s) => {
          counts[s.error] = (counts[s.error] || 0) + 1;
          return counts;
        }, {}),
      failures: samples.filter((s) => s.error).slice(0, 20),
    };
    for (const label of new Set(samples.map((s) => s.label)))
      result.endpoints[label] = summary(
        samples.filter((s) => s.label === label),
      );
    report.stages.push(result);
    fs.writeFileSync(
      process.env.LOAD_REPORT_FILE || "/tmp/travseeker-load-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        users,
        journeys: result.completedJourneys,
        rps: result.requestsPerSecond,
        p95ms: result.p95ms,
        errors: result.errors,
        requests: result.requests,
      }),
    );
    if (result.errors > 20 && result.errors / result.requests > 0.1) {
      report.stopped = "More than 10% errors; load stopped";
      break;
    }
    await sleep(1000);
  }
  fs.writeFileSync(
    process.env.LOAD_REPORT_FILE || "/tmp/travseeker-load-report.json",
    JSON.stringify(report, null, 2),
  );
  if (report.stages.some((stage) => stage.errors)) process.exitCode = 1;
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
