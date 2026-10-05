# Editorial English translations

`english-translations.json` contains the English content prepared for the existing catalogue on 3 October 2026. Each entry identifies a record and pairs its original Spanish field values with English translations. Proper place names and numeric price ranges can intentionally match the original.

Destination descriptions retain their HTML structure. Legacy essentials text reuses the translations of structured groups and items, so the two representations agree. Catalogue names retain their Spanish storage values; English labels are stored in their translation fields.

From the repository root, preview with `npm run db:translate-english`, then apply with `npm run db:translate-english -- --apply`. The script skips existing English text and changed Spanish sources, backs up previous translation values, and commits the updates together. `npm run db:audit-translations` checks the current database for missing fields.

Maintain subsequent content edits through the admin editor. This file is a one-time backfill, not a replacement for current database content.
