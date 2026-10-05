# Readability and maintainability review

Reviewed 2026-09-05 against the local checkout. This is a source-code and automated-check review, not a production performance or security audit.

## Assessment

Targeted refactoring is justified. The repository already separates frontend features and backend routes, controllers, services, and pure domain logic. Preserve that structure. The biggest readability problems are responsibilities accumulating in page components and services, duplicated response mapping, and incomplete contributor documentation.

The initial checks passed: 73 backend tests, frontend ESLint, and the TypeScript/Vite production build. Passing lint is useful but limited: `front/eslint.config.js` explicitly disables effect-dependency checking and the ban on `any`.

## Changes implemented

| Area | Finding | Change |
| --- | --- | --- |
| Destination page | Review loading, form submission, author formatting, and review markup lived inside a 928-line route component. | Moved review state and requests into `useDestinationReviews`, and review markup into `DestinationReviews`. The route retains access to review statistics for its cover. The page is now 639 lines. |
| Admin service | Request normalization and validation were mixed with persistence and relation synchronization in a 613-line service. | Extracted pure destination, municipality, and place payload functions into `backend/src/domain/adminPayload.js`. The service is now 455 lines. |
| Destination responses | Public and admin services repeated relation flattening, locale sorting, and municipality text cleaning. The admin mapper's name mentioned only municipalities despite mapping three relations. | Added `destinationMapping.js` and the explicit `mapAdminDestination` adapter. Reused the shared mapper in search and destination detail responses. |
| Verification | Frontend utility tests existed without an npm test script, and the root had no unified check command. | Added frontend `npm test`, root `npm test`, and root `npm run check`. Added eight backend regression tests. |
| Documentation | Root documentation linked to missing frontend READMEs and described Tailwind despite the current CSS-based frontend. | Added a frontend contributor guide and corrected the root frontend documentation links and stack description. |

## Behavior preserved

- Public mapping serializes only the selected catalog relations. It does not restore legacy tags when those relations are absent.
- Admin mapping preserves legacy tags when catalog links are absent, and replaces them when links exist.
- Municipality text cleaning, Spanish locale sorting, relation IDs, and API field names remain intact. Mapping does not mutate input records.
- Validation messages, HTTP error statuses, coordinate conversion, and defaults remain unchanged.
- Review GET requests still cancel on destination change/unmount. Retry and three-at-a-time expansion remain available. Review submission still trims comments, requires at least 20 characters, and displays moderation confirmation without updating the published score.
- No schema, database, authentication, deployment, or visual styling changes were made.

## Remaining priorities

1. **Admin page ownership.** `front/src/pages/admin/AdminPage.tsx` is 879 lines and owns loading, filtering, saving, and modal state for several resources. Split by resource workflow when working on admin behavior, with coverage for saving, editorial transitions, and failures. A generic CRUD framework would obscure the resource-specific rules.
2. **Async lifecycle coverage.** Review effect dependencies and stale-response handling across admin, collection, and destination actions. Enable `react-hooks/exhaustive-deps` incrementally after correcting each feature. Simply enabling the rule globally would create noise without establishing correct behavior.
3. **Trip planning boundaries.** `CollectionPage.tsx` (581 lines) and `ItineraryBuilder.tsx` (569 lines) remain substantial. Separate itinerary editing from sharing/settings and routing calculations, backed by permission and reorder tests.
4. **Recommendation naming.** `recommendationService.js` uses abbreviations such as `candPresIdx`, `masScore`, and `prefTipos` inside scoring logic. Extract and name the profile/scoring calculations when adding ranking characterization tests. Avoid changing weights or fallback ordering as part of a naming cleanup.
5. **Broader integration coverage.** Most existing tests cover pure domain functions. Add service-level database fixtures and browser coverage for authenticated admin and trip workflows before broader restructuring.

These are follow-up opportunities, not evidence that the application needs a rewrite. This change deliberately targets separable responsibilities with existing or added validation; it does not claim every large component is now fully decomposed.

## Verification

- 81 backend tests and 5 frontend utility tests passed.
- Frontend ESLint and TypeScript/Vite production build passed after extraction.
- `git diff --check` passed.
- Chromium smoke check with isolated mock API responses passed: three initial reviews, expansion to four, submission of a trimmed comment, moderation confirmation, form reset, and no immediate addition to published reviews. This checks frontend behavior, not database persistence or the live API.

Run `npm run check` from the repository root for tests, lint, and build. Use a Node version with native TypeScript stripping for frontend utility tests (Node 22.18+ or a newer supported release); this review used Node 25.8.1.
