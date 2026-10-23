# Isolated load checks

These scripts are HTTP traffic generators, not browser automation. They exercise the real Express/Prisma application and production frontend build. They do not execute React, fetch images/tiles/weather, send messages or create user accounts. The database pool and server cache use the application's normal settings. Results are local-machine measurements, not production capacity promises.

## Dedicated database

Use a new disposable PostgreSQL instance listening only on `127.0.0.1:55441`, with an empty database named `load_test`. Do not point the running API at Neon or another shared database for the load run.

From `backend/`:

```sh
DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:55441/load_test npx prisma db push
LOAD_TEST_DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:55441/load_test node scripts/load/prepare-fixture.js
DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:55441/load_test node scripts/load/server.js
```

`prepare-fixture.js` reads `DATABASE_URL` from the existing backend environment as its **source**, with a read-only transaction. It copies an explicit list of tourism-content tables into the empty local target. It nulls creator/reviewer IDs and never selects account, token, review, favorite or private-trip tables. The source is never written to. The target must be empty: there is no reset/truncation command. Source snapshot and secrets must not be committed.

The instrumented API refuses any database except `load_test` on loopback port 55441 and listens on loopback port 3003. Samples in `/tmp/travseeker-load-metrics.json` include memory, CPU, event-loop delay, SQL query counts and pool queue length; no request payloads or credentials. Stop the API after the run, then stop your disposable PostgreSQL instance.

## Frontend and traffic

From `front/`, build then serve:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
```

From `backend/`:

```sh
LOAD_STAGES=1,10,25,50,100 LOAD_SECONDS=12 LOAD_RAMP_MS=25 LOAD_REPORT_FILE=/tmp/load-ramped.json node scripts/load/browse.js
```

Only the dedicated loopback API and frontend ports are supported. Each virtual anonymous visitor loads HTML and initial JS/CSS, then home data, map, search, destination details, related destinations, reviews, comparison and country data. Each visit makes 15 requests plus initial assets, with 200 ms pauses between actions. One quarter of visitors use English. No browser cache is simulated for API calls; this deliberately applies more backend traffic than repeat cached navigation. The application's server cache remains enabled and warms across stages.

- `LOAD_STAGES`: 1–200 concurrent visitors per stage.
- `LOAD_SECONDS`: 1–60 seconds of traffic after the ramp; in-flight journeys finish before reporting.
- `LOAD_RAMP_MS`: delay per arriving visitor; `0` is a synchronized arrival spike, `25` spreads 100 arrivals over 2.5 seconds.
- `LOAD_THINK_MS`: 0–5000 ms between actions; default 200 is faster than typical human navigation.
- `LOAD_READ_RETRY`: `1` enables the production frontend read-recovery helper for API calls only. Default `0` measures raw transport failures.
- `LOAD_REPORT_FILE`: JSON result location. `artifacts/` is ignored by Git.

Report percentiles cover end-to-end HTTP latency, decompression and JSON contract checks. Failed requests remain counted. The default run does not retry. `LOAD_READ_RETRY=1` imports the same frontend retry helper for API reads; reports separately count wire attempts, transport failures and recovered reads, so a successful retry does not hide the initial failure. Unexpected statuses/contracts/network failures result in a nonzero exit code. More than 10% errors (at least 21 failures) stops subsequent stages. Always retain the difference between application HTTP errors, timeouts and injector/OS connection failures when interpreting results.

For real production sizing, repeat in authorized staging with equivalent hosting, data volume, proxy/CDN, geographic latency and authenticated workflows. This local experiment does not measure mobile rendering or map gesture frame rates.
