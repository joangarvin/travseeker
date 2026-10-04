# TravSeeker UI/UX review — 4 October 2026

Method: two independent assessments (A: public_ux_review; B: ui_evidence), plus a browser review of admin by the primary agent. Assessment A finished before the detector findings were used in synthesis.

The visual identity is coherent and worth keeping. The most urgent work is reliable task completion: preserve edits, make failures visible, fix shared comparisons and make administrative browsing complete. A full visual redesign would not address those problems.

## Scope and evidence

Source review covered discovery, destination details, map, comparison, authentication, saved destinations, trips, profile, and admin. Browser checks covered desktop/mobile discovery and authentication, mobile map, comparison URL restoration, and admin forms on desktop/mobile plus dark mode. Admin writes were intercepted and simulated; no production records were changed. Authenticated trip/profile flows and several failure races were source-reviewed, not exercised against live accounts. Destination browser rendering in Assessment A was limited by incomplete mock response shapes; no resulting fixture error is counted as a product defect. Homepage full-page screenshot gaps were not counted: unscrolled reveal effects and a single featured fixture explain them.

The source detector returned zero findings. That is a limited automated scan, not an accessibility certification. No production load test, Lighthouse trace, screen-reader run or 200% text-zoom audit was performed.

## Priority backlog

P1 = major task reliability issue; P2 = usability/scaling improvement; P3 = polish. No site-wide P0 blocker was established. Seven P1 findings are listed below.

### 1. P1 — Unsaved admin edits disappear without a warning

**Browser verified.** Change the destination name, press Escape, reopen: the original name returns, with no save/discard decision. The same direct close callback is attached to the backdrop and close buttons. Global interface language switching reloads the document, creating another draft-loss path when available.

**Change:** track dirty state, offer Keep editing / Discard / Save, preserve recoverable drafts, and block accidental closure during saving. Apply a consistent policy to every editor.

Evidence: [AdminModal.tsx:31](/Volumes/BD/TravSeeker/front/src/components/admin/AdminModal.tsx:31), [AdminModal.tsx:72](/Volumes/BD/TravSeeker/front/src/components/admin/AdminModal.tsx:72), [DestinationEditor.tsx:89](/Volumes/BD/TravSeeker/front/src/features/admin/components/DestinationEditor.tsx:89), [i18n/index.ts:46](/Volumes/BD/TravSeeker/front/src/i18n/index.ts:46).

### 2. P1 — Escape closes both nested admin dialogs

**Browser verified.** Destination editor → Create trip type shows two dialogs; one Escape leaves zero. The parent editor can disappear with its unsaved work. Shared AccessibilityEffects already handles overlays, while every AdminModal also installs a document Escape listener.

**Change:** one dialog manager should own focus, Escape, stacking and scroll locks. Only the topmost dialog should close; return focus to its trigger inside the parent.

Evidence: [AdminModal.tsx:31](/Volumes/BD/TravSeeker/front/src/components/admin/AdminModal.tsx:31), [AccessibilityEffects.tsx:58](/Volumes/BD/TravSeeker/front/src/app/AccessibilityEffects.tsx:58), [DestinationEditor.tsx:456](/Volumes/BD/TravSeeker/front/src/features/admin/components/DestinationEditor.tsx:456).

### 3. P1 — Some save errors appear behind the modal

**Browser verified for municipality editing using a simulated 422 response.** The editor remains open but the error is rendered outside the dialog, on the obscured page. Other parent-managed editor saves use the same feedback mechanism.

**Change:** put errors and retry inside the active editor, retain entered values, and associate validation errors with fields. Avoid clearing success feedback immediately through a full data reload.

Evidence: [AdminPage.tsx:234](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:234), [AdminPage.tsx:290](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:290), [AdminPage.tsx:707](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:707).

### 4. P1 — Shared comparison URLs do not restore the full selection

**Browser verified.** A fresh `/comparar?ids=one,two` restored only `two`. Restoring by repeatedly calling a toggle that captures the old state overwrites earlier IDs.

**Change:** validate/deduplicate the URL IDs, restore the entire set atomically, and define whether the shared URL or saved local selection takes precedence.

Evidence: [ComparePage.tsx:42](/Volumes/BD/TravSeeker/front/src/pages/compare/ComparePage.tsx:42), [CompareContext.tsx:38](/Volumes/BD/TravSeeker/front/src/contexts/CompareContext.tsx:38).

### 5. P1 — One failed admin request blocks all initial datasets

**Source verified; not fault-injected.** The initial six-resource Promise.all must succeed before any state is applied. A reviews failure can therefore leave destination and municipality tabs empty even if those requests succeeded.

**Change:** load the active resource independently, preserve successful data, show panel-specific failure/retry, and obtain navigation counts separately.

Evidence: [AdminPage.tsx:101](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:101).

### 6. P1 — Place results can belong to the previous destination

**Source-verified race; not reproduced under throttling.** Changing destination changes the selector immediately, but loadPlaces leaves the old list visible and accepts any eventual response. Slower earlier requests can replace a later destination's list.

**Change:** key results by destination, cancel or ignore outdated requests, and clearly mark or hide old rows during loading.

Evidence: [AdminPage.tsx:127](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:127), [PlacesPanel.tsx:53](/Volumes/BD/TravSeeker/front/src/features/admin/components/PlacesPanel.tsx:53).

### 7. P1 — Editorial review can hide older pending content

**Source verified; depends on catalog size/order.** Admin requests `status=all`; the server returns at most 250 records per resource. Pending/Published/Archived tabs and counts then filter that subset in the browser. Older pending content can be inaccessible from this queue even though it exists.

**Change:** filter status/type on the server before pagination, return true totals and cursors, and let every matching record be reached.

Evidence: [AdminPage.tsx:107](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:107), [editorialService.js:73](/Volumes/BD/TravSeeker/backend/src/services/editorialService.js:73), [EditorialReviewPanel.tsx:109](/Volumes/BD/TravSeeker/front/src/features/admin/components/EditorialReviewPanel.tsx:109).

## Next improvements

| Priority | Area | Problem and concrete change |
|---|---|---|
| P2 | Content editing | Description editing exposes raw HTML despite promising paragraphs/lists/bold. Use a small rich-text toolbar, sanitized output and preview. [DestinationEditorSections.tsx:134](/Volumes/BD/TravSeeker/front/src/features/admin/components/DestinationEditorSections.tsx:134). |
| P2 | Save behavior | Destination fields wait for Save, but town links, new taxonomy entries and places are written immediately. Make those boundaries explicit or stage changes together; otherwise Close has inconsistent consequences. [DestinationEditor.tsx:154](/Volumes/BD/TravSeeker/front/src/features/admin/components/DestinationEditor.tsx:154). |
| P2 | Translations | Field-level ES/EN controls work, but each defaults to Spanish and resets on section remount. Add a persistent editor language preference while retaining per-field overrides, missing/outdated translation indicators, and a language preview. These are workflow gaps, not a claim that existing translations are missing. [LocalizedField.tsx:32](/Volumes/BD/TravSeeker/front/src/features/admin/components/LocalizedField.tsx:32). |
| P2 | Publishing | The editorial queue offers Approve/Draft/Archive but no content preview/edit entry point in each row. Let a reviewer inspect the complete record and language coverage before approving it. [EditorialReviewPanel.tsx:299](/Volumes/BD/TravSeeker/front/src/features/admin/components/EditorialReviewPanel.tsx:299). |
| P2 | Admin scale | Most datasets load regardless of active tab; municipality saves reload all six. Use lazy panel loading, server search/pagination and targeted updates. Town browsing stops at 100 with no next page. [AdminPage.tsx:233](/Volumes/BD/TravSeeker/front/src/pages/admin/AdminPage.tsx:233), [MunicipalitiesPanel.tsx:18](/Volumes/BD/TravSeeker/front/src/features/admin/components/MunicipalitiesPanel.tsx:18). |
| P2 | Comparison picker | Only the first 100 destinations are searched locally. Initial errors can be hidden by the “choose two” empty state; selecting a fifth destination from a card fails silently. Use server suggestions, visible empty/error states and immediate limit feedback. [ComparePage.tsx:34](/Volumes/BD/TravSeeker/front/src/pages/compare/ComparePage.tsx:34), [DestinationCard.tsx:53](/Volumes/BD/TravSeeker/front/src/features/destinations/components/DestinationCard.tsx:53). |
| P2 | Decision clarity | Card/map facts such as “Medio · Medio” lack explicit budget/crowd labels; seasonal percentages need a definition. Label these facts and explain budget ranges and crowd methodology without inventing precision. [DestinationCard.tsx:45](/Volumes/BD/TravSeeker/front/src/features/destinations/components/DestinationCard.tsx:45), [ComparePage.tsx:204](/Volumes/BD/TravSeeker/front/src/pages/compare/ComparePage.tsx:204). |
| P2 | Mobile login | At 390×844, the promotional blue panel takes roughly 256px and pushes email to around y640; submit/recovery fall below the initial viewport. Compact the promotional block so the form and main action take priority. [auth.css:6](/Volumes/BD/TravSeeker/front/src/styles/auth.css:6), [responsive.css:364](/Volumes/BD/TravSeeker/front/src/styles/responsive.css:364). |
| P2 | Failure/empty states | Map errors live inside the optional list, initially closed on mobile. Favorites uses a similar empty message for no saved content and no search matches. Show map failures independently with Retry, and give contextual Clear filters / Explore actions. [MapPage.tsx:251](/Volumes/BD/TravSeeker/front/src/pages/map/MapPage.tsx:251), [FavoritesPage.tsx:87](/Volumes/BD/TravSeeker/front/src/pages/library/FavoritesPage.tsx:87). |
| P2 | Accessible card links | Empty-alt photo links are named only “01”, “02”, etc., separate from descriptive title links. Give photo links destination names or merge photo/title into one navigation target. Browser DOM confirmed this pattern. [DestinationCard.tsx:26](/Volumes/BD/TravSeeker/front/src/features/destinations/components/DestinationCard.tsx:26). |
| P3 | Perceived speed | Keep existing search results visible with a pending state instead of clearing them immediately. Restore lazy loading on the three below-fold related-destination images. [HomePage.tsx:81](/Volumes/BD/TravSeeker/front/src/pages/home/HomePage.tsx:81), [DestinationPage.tsx:623](/Volumes/BD/TravSeeker/front/src/pages/destination/DestinationPage.tsx:623). |
| P3 | Motion consistency | A global 0.01ms reduced-motion override conflicts with later targeted feedback timing. Consolidate into one intentional policy; this is not a claim that reduced-motion support is absent. [responsive.css:591](/Volumes/BD/TravSeeker/front/src/styles/responsive.css:591), [motion.css:324](/Volumes/BD/TravSeeker/front/src/styles/motion.css:324). |

## Aesthetic direction

Keep the cobalt/yellow palette, distinctive typography and destination photography. Give practical information more prominence relative to slogans. In admin, reduce the tall introductory area and repeated headings; use denser, consistently aligned rows with status, translation completeness and actions. Keep the improved Essentials theme cards and sticky Save footer. Consider a dedicated full-page destination editor for long sessions and shareable edit URLs; small activity/type editors can remain dialogs. A global “editing language” should never remove the field-level Spanish/English controls the product already supports.

The admin dark-theme check showed readable hierarchy and a dark-text/pale-brand Save button; no blanket contrast defect is claimed. Mobile home/auth/map showed no document-level horizontal overflow at 390px. The Essentials mobile editor kept Save visible, although its long horizontal section navigation needs a clearer scroll affordance or section picker.

## Strengths to preserve

- Recognizable editorial identity and consistent semantic theme tokens.
- Useful destination hierarchy: practical signals, planning tools and detailed guides.
- Improved Essentials grouping, collapsible items, icon picker and fixed save controls.
- Shared focus management, skip link, named form controls, keyboard comboboxes and live feedback.
- Lazy route loading, responsive image delivery, public-data caching and paginated discovery.
- Trip creation supports unknown dates and a manageable two-step flow.

## Heuristic scores

Scores are expert-review judgments, not measured conversion rates. The following 24/40 score applies to the public experience; admin's additional P1 defects are listed separately rather than hidden in an average.

| Public UX heuristic | /4 | Main limitation |
|---|---:|---|
| System status | 3 | Hidden map errors and silent comparison limit |
| Real-world match | 2 | Budget/crowd signals need explanation |
| Control and freedom | 2 | Comparison restoration fails |
| Consistency | 3 | Recovery behavior varies |
| Error prevention | 3 | Good input constraints, some action gaps |
| Recognition over recall | 2 | Ambiguous facts and incomplete searches |
| Efficiency | 2 | Comparison catalog limit |
| Aesthetic/minimalism | 3 | Mobile auth gives promotion too much space |
| Error recovery | 2 | Missing or hidden retry paths |
| Contextual help | 2 | Signal methodology unclear |
| **Total** | **24/40** | **Meaningful improvements needed** |

Technical review: accessibility 2/4, performance 3/4, responsiveness 3/4, theming 3/4, implementation integrity 2/4: **13/20**. These scores are scoped observations, not WCAG conformance or load-test results.

## Cognitive load and user journeys

For first-time travelers, the main problem is interpreting destination signals and understanding an empty comparison search. For distracted mobile users, login prioritizes promotion over the task and a map failure can be hidden. For editors, the largest risk is losing work or not understanding which edits already saved. The expanded discovery filter offers six dimensions plus crowd avoidance; group these around Where / When / How you travel. The number of choices alone is not considered a defect.

The aspirational opening is effective. The emotional low points appear when users move into comparison/account tasks or an editor encounters a failure. Reliability and clearer next actions will improve this more than extra animation or decoration.

## Recommended order

1. Harden draft preservation, modal stacking, in-dialog errors, comparison restoration, admin loading and place-request identity.
2. Fix editorial pagination/counts and add preview before approval.
3. Improve rich-text and translation workflows; clarify immediate versus staged saves.
4. Adapt mobile authentication and clarify public decision signals and empty states.
5. Optimize active-panel loading and catalog search, then polish density, motion and consistency.

Relevant workflows: `$impeccable harden`, `$impeccable optimize`, `$impeccable clarify`, `$impeccable adapt`, `$impeccable layout`, and finally `$impeccable polish`.

Questions skipped: this request asks for findings, not a new design direction or implementation approval.

## Implementation follow-up — 4 October 2026

Implemented the main reliability, editing, and performance fixes from this review:

- Shared admin draft protection for close, backdrop, Escape, and reload; recovery within the same browser tab/session; drafts clear after successful saves. Nested dialogs now close and restore focus independently.
- Save errors appear inside the active editor. Descriptions use a sanitized formatted-text editor with preview, and a persistent editing-language preference works alongside individual field language buttons. Missing English and changed-source hints help editors review translations.
- Destination and town lists use server search/status filtering and 40-row pages. Editorial review uses a cursor across all resource types, accurate filtered totals, and a Review and edit action. Admin loads the selected section independently; stale place requests are cancelled. Tab and destination/town search state are reflected in the URL.
- Comparison links restore their entire selection. Search queries the catalog instead of a fixed first 100 records. Retry, empty-search, and selection-limit feedback are explicit.
- Public cards label budget/crowd values; comparison explains their meaning. Map errors are visible outside the optional list. Favorites distinguish no saved items from no search matches. Mobile login puts the form first. Search keeps existing results during refresh; related images load lazily; password submission prevents duplicate requests.
- Editor spacing, mobile form density, sticky save controls, and reduced-motion overrides were refined. Immediate catalog/town-link saves are described in the editor.

Validation: 125 automated tests passed, frontend lint passed, and production build passed. New tests cover comparison ID restoration, pagination bounds/cursor ties, and traversal past the former 250-record editorial cap. Isolated browser checks used fixture data and simulated save failures/successes; they covered draft recovery, desktop/mobile save visibility, nested Escape behavior, in-dialog errors, draft cleanup, comparison restoration, and paginated admin loading. No production data was changed. The UI detector reported no findings.

The follow-up also implements the full-screen destination editor with reloadable destination/section links, discovery filters grouped by where/when/how people travel, and a read-only bilingual editorial preview for every resource type, including structured destination essentials. Editor close removes its URL state; direct-link loading errors can be retried. Browser checks confirmed section restoration after reload, English essential previews, visible mobile save controls, and no horizontal document overflow at 390px. This work does not constitute a production concurrency/load test.
