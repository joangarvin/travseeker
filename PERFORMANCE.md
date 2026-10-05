# Database and image usage

## Implemented

- Public destination lists, details, comparisons, related destinations, map data, filters, statistics, activities, tourism types and climate use a process-local cache. The default lifetime is 15 minutes, with 256 entries and a 32 MiB serialized-data budget. Results are cloned; errors and missing records are not stored. Concurrent identical loads share the same work.
- English searches reuse their underlying search candidates across different search terms with the same filters. Empty English results no longer trigger an identical second database query.
- Successful admin, upload and review HTTP writes invalidate the public server cache. In-flight older reads cannot refill it after invalidation. Reads started before a save may still finish with the previous result.
- The frontend merges concurrent public requests and reuses results for 60 seconds, with a bounded memory cache. Cancelling one component's subscription does not cancel another's shared request. Successful writes clear the client cache and bypass browser caching for 60 seconds.
- Public HTTP responses permit 60 seconds of private browser caching. Language, compression and CORS origin variants are preserved. Account, admin, favorites, reviews and trip responses remain uncached by this mechanism.
- Public editorial responses omit translation dictionaries after applying the requested language, avoiding duplicate descriptions and essentials in list/map responses. Admin still receives all translations.
- GET requests no longer send an unnecessary JSON Content-Type header, avoiding a CORS preflight for ordinary public reads when the API is on another origin.
- Cloudinary delivery uses automatic format/quality and five reusable widths (96, 320, 640, 960, 1600). The browser chooses one candidate, not all five. Below-fold images load lazily; the main destination image keeps eager/high-priority loading. Avatars use small thumbnails. Failed images clear their srcset before showing a local fallback.
- New uploaded originals are limited to 1600 × 1600 (512 × 512 for avatars), preserving aspect ratio and avoiding upscaling. No eager batch of derived images is created. Existing assets are not modified. Avatar replacement no longer deletes the newly overwritten asset when only its version changes.
- The database pool allows up to five connections and releases idle connections after 30 seconds. Pool size limits concurrency; it does not by itself reduce compute-hours.

## Deployment and settings

Deploy/restart both frontend and backend to activate these changes. No schema migration or extra paid cache service is needed.

`PUBLIC_CACHE_TTL_SECONDS` controls the backend cache (default `900`; `0` disables stored server results). Read it from the backend environment. Browser cache remains up to 60 seconds. If you change content using database scripts or SQL, restart the API or wait for expiration.

The server cache is per process and is lost on restart. This works best with one persistent backend instance. With multiple instances or short-lived serverless functions, cache hits are lower and a save only invalidates the instance that handled it; other instances can retain old data until the configured lifetime expires. Use a shared cache/invalidation mechanism before relying on immediate publication across multiple instances. Do not add a paid cache service merely for a small, single-instance deployment.

Other visitors can retain browser content for up to roughly two minutes (the short HTTP and application caches can overlap). The editing browser clears its application cache on save. Already-rendered pages update on their next load, not through live push updates.

## Keep Neon usage low

1. Keep scale-to-zero enabled. Avoid scheduled database pings or frequent background jobs that keep compute awake. Monitor `/api/health`, which does not query the database.
2. Use the pooled connection URL from Neon's connection dialog for the deployed API (the hostname contains `-pooler`). Keep credentials in the deployment's environment variables.
3. Check actual compute-hours, storage and transfer in the Neon dashboard after deployment. Fewer queries do not guarantee the free plan: continuous traffic across many unique queries, authenticated activity, database size and runtime architecture still matter.
4. Schedule any existing alert-processing job at the frequency users actually need; do not run it every minute just to keep the API alive.

Official references: [Neon compute management and scale-to-zero](https://neon.com/docs/manage/endpoints/), [connection pooling](https://neon.com/docs/connect/connection-pooling).

## Keep Cloudinary usage low

1. Reuse stored versioned delivery URLs. Do not add timestamps or random query parameters when rendering images.
2. Avoid generating eager transformations for every possible size. Standardize on the widths in `media.ts`; changing widths creates new derived variants when first requested.
3. Review bandwidth, storage and transformations in the Cloudinary dashboard. Automatic format can produce multiple format variants for different browsers; a CDN hit still delivers bandwidth and is not free usage in every quota category.
4. Audit unreferenced temporary uploads/old assets before deleting them. Do not bulk-delete existing media or derived assets blindly; regeneration costs transformations and referenced images can break. No remote deletion or account-setting changes were performed for this optimization.
5. Existing originals retain their current storage footprint. The upload dimension limit applies only to new uploads; keep original photography outside Cloudinary if you need archival resolution.

Official references: [image optimization](https://cloudinary.com/documentation/image_optimization), [responsive images](https://cloudinary.com/documentation/responsive_images), [incoming and eager transformations](https://cloudinary.com/documentation/eager_and_incoming_transformations).

## Validation

The regression tests cover duplicate-load coalescing, expiry, bounded caches, concurrent saves, error retries, separate language keys, private endpoint exclusion, translation payload trimming, compression Vary headers, image URL sizing and safe avatar replacement. A synthetic test issues 100 concurrent identical cache reads and verifies one underlying load; this demonstrates cache behavior, not a measured production billing reduction.

A local browser check with mocked API/image responses also verified that 30 concurrent identical public requests plus a repeated read issue one network call, a successful save forces the next read to make a new call, and a failed Cloudinary image makes one failed request before switching to the local fallback. No live Cloudinary uploads/deletions or Neon queries were needed for these checks.
