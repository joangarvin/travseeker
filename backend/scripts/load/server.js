// Instrumented disposable API, never accepts a shared/remote database.
const fs = require("node:fs");
const { monitorEventLoopDelay } = require("node:perf_hooks");
if (
  !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/load_test$/.test(
    process.env.DATABASE_URL || "",
  )
)
  throw new Error("Refusing a non-test database");
const { pool, prisma } = require("../../src/config/database");
const app = require("../../src/app");
const lag = monitorEventLoopDelay({ resolution: 10 });
lag.enable();
let queries = 0,
  requests = 0,
  active = 0;
pool.on("connect", (client) => {
  const query = client.query;
  client.query = function (...args) {
    queries++;
    return query.apply(this, args);
  };
});
// Instrument around the existing app without modifying its routes or protections.
const http = require("node:http");
const server = http.createServer((req, res) => {
  requests++;
  active++;
  res.once("finish", () => active--);
  app(req, res);
});
const start = performance.now();
let cpu = process.cpuUsage(),
  last = start;
const samples = [];
const timer = setInterval(() => {
  const now = performance.now(),
    used = process.cpuUsage(cpu);
  cpu = process.cpuUsage();
  samples.push({
    second: +((now - start) / 1000).toFixed(1),
    requests,
    queries,
    active,
    poolTotal: pool.totalCount,
    poolWaiting: pool.waitingCount,
    cpuPercent: +((used.user + used.system) / (now - last) / 10).toFixed(1),
    rssMB: +(process.memoryUsage().rss / 1048576).toFixed(1),
    loopP99ms: +(lag.percentile(99) / 1e6).toFixed(2),
    loopMaxms: +(lag.max / 1e6).toFixed(2),
  });
  last = now;
  lag.reset();
  fs.writeFileSync(
    process.env.LOAD_METRICS_FILE || "/tmp/travseeker-load-metrics.json",
    JSON.stringify(samples),
  );
}, 1000);
timer.unref();
server.listen(3003, "127.0.0.1", () =>
  console.log("Isolated load API on 127.0.0.1:3003; pool max=5"),
);
process.once("SIGTERM", () =>
  server.close(async () => {
    clearInterval(timer);
    lag.disable();
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  }),
);
