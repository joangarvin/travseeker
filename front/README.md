# TravSeeker frontend

React and TypeScript application built with Vite. Styling uses the CSS files in `src/styles`; UI components live in `src/components/ui`.

## Run and check

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
```

The development server proxies `/api` to the backend at `http://127.0.0.1:3001`; `VITE_API_URL` can override it in development. Production always uses `/api`, which `vercel.json` proxies to Render before the SPA fallback. This keeps authentication cookies on the website's origin, including in Safari. If the backend moves, update the proxy destination. Frontend utility tests use Node's native TypeScript stripping (Node 22.18+ or a newer supported release).

From the repository root, `npm run check` runs both test suites, frontend lint, and the production build.

## Where code belongs

- `src/app`: routes, providers, and application-wide effects.
- `src/pages`: route composition and coordination between features.
- `src/features`: feature components, hooks, and domain-specific presentation. Destination reviews, for example, use `features/destinations/hooks/useDestinationReviews.ts` for requests/state and `features/destinations/components/DestinationReviews.tsx` for rendering.
- `src/components`: shared UI and layout components.
- `src/contexts`: shared authentication, comparison, and catalog state.
- `src/services`: HTTP, climate, and routing clients. Use `services/api.ts` for API requests so cookie sessions and errors are consistent.
- `src/utils`: reusable calculations and formatting.
- `src/types`: API and application data types.
- `src/styles`: CSS organized by feature and shared layout concerns.
- `test`: utility regression tests.

Keep state near the feature that owns it. Extract a component or hook when it has an independent responsibility; avoid wrappers that only relocate a few lines. Keep API field names consistent with backend contracts. Explain business rules and compatibility exceptions rather than narrating obvious code.

See [the repository review](../REFACTORING_REVIEW.md) for the changes made and remaining maintenance priorities.
