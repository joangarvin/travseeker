# Spanish and English

TravSeeker now separates interface messages from editorial content. Spanish remains the original language; English is available from the language selector in the header.

## Update an existing installation

Before starting the updated backend, run this from the repository root using the intended `backend/.env` database:

```bash
npm run db:migrate-translations
npm exec --prefix backend -- prisma generate --schema backend/prisma/schema.prisma
```

The migration adds an empty `translations` JSON column to destinations, towns, places, activities, trip types, essentials groups and essentials items. It is additive and can be run again; it does not translate or overwrite existing Spanish content. The matching SQL migration is also included for installations using Prisma migration history. Use your established migration workflow; the standalone command supports installations previously managed with `db:push`.

Then start the two development servers in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:front
```

Open `http://localhost:5173/?lang=en` or `http://localhost:5173/?lang=es`. Run the database update before deploying the updated backend as well.

## Editing translations

In Administration, each translatable text field has **Español / English** buttons next to its label. Click a language and write in the same input. Each field switches independently, so you can compare the original name while writing an English description. Switching preserves both drafts. Save all changes with the editor's usual save button.

These controls appear directly beside destination names, areas and descriptions; town information; place names, categories and descriptions; activity and trip-type names; and each essentials group's and item's text, including image descriptions, duration and best time to visit. There is no separate translations tab or duplicate form.

Editorial translations are entered manually. Proper names can remain unchanged. Empty English fields fall back to Spanish; the original Spanish text is shown beneath the English input for reference. Prices, coordinates, dates, images, links and other shared values do not need duplicate entries. Budget and crowd-level labels, standard categories and interface messages already have English labels. User-written reviews, profiles and trip notes retain the author's text. Email templates are outside this web translation change.

The field's language buttons only change which version you edit. The **website language** selector reloads the page, so save pending edits before using it.

## Implementation

- `shared/localization.json` defines supported languages, editorial fields and length limits. Both client and server use it.
- `front/src/i18n/en.json` holds English interface messages, keyed by the original Spanish text. `t()` supports interpolated values and falls back to the source message.
- Language URLs use `?lang=es` or `?lang=en`; the browser remembers the selection. Navigation, sharing, document language and metadata preserve it. Dates and numbers use the matching locale.
- API requests include `Accept-Language`. Public responses use field-by-field editorial translations. Admin responses always retain Spanish source data and all translations for safe editing.
- Catalog identifiers and filter values stay canonical; translated display labels are separate. English search matches both original and translated content. Translated text search currently ranks the candidates remaining after structured filters in memory; a database search index would be appropriate if the catalogue grows substantially.
- Additional languages require adding the registry entry, a message catalogue and the frontend locale type/resolver support. Admin content fields are driven by the registry.

## Verification

`npm run check` runs backend and frontend tests, frontend lint and the production build. Localization tests cover validation, fallback, nested records, canonical catalogue values, bilingual search, editing payloads, language URLs and message placeholders. Browser checks use isolated API fixtures to exercise switching languages and saving translations without changing the configured database.

## Filling the existing English content

`backend/data/english-translations.json` contains the English editorial translations prepared for the existing catalogue. Original names are retained where they are proper place names. The translations reproduce the existing editorial information; they do not verify or update factual claims such as timetables or prices.

Preview the database changes from the repository root:

```bash
npm run db:translate-english
```

Apply them to the database configured in `backend/.env`:

```bash
npm run db:translate-english -- --apply
```

The importer fills only missing English fields. It skips fields whose Spanish source has changed and preserves existing English translations, other languages, canonical catalogue names and all unrelated data. It writes a backup of previous translation values to the system temporary directory and applies the update in one transaction. Re-running it is safe. Review the printed counts for stale source fields or records that no longer exist.

After importing, all text remains editable with each field's **Español / English** buttons. New or changed Spanish content still needs its English version maintained in admin.

Check for missing English content at any time with `npm run db:audit-translations`. The report lists the affected records and fields and exits unsuccessfully if any populated Spanish field has no English version. Empty optional fields are ignored.
