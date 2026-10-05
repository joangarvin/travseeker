# Privacy implementation and publication checklist

Reviewed on 5 October 2026. This is a technical audit and implementation record, not a legal certification.

## Implemented

- Spanish and English cookie policy (`/cookies`), privacy notice (`/privacidad`) and legal notice (`/aviso-legal`). Operator details live in `shared/legal.json`.
- Equally prominent accept, reject and customize controls. Optional categories start disabled; closing settings does not give consent. Preferences can be reopened on every page.
- Separate permission for performance measurement and external maps/routes. No advertising category because no advertising tracker was found.
- Decisions last 180 days, include the policy version and synchronize across tabs. Invalid, outdated and expired records do not authorize optional processing. No consent identifier or extra database request is introduced.
- Performance reports only run after permission, omit authentication cookies and use coarse page names instead of full paths that could contain account tokens or identifiers.
- CARTO/OpenStreetMap maps and OSRM route requests are gated. Without permission, destination lists and manually entered coordinates remain usable; itinerary distances use a local straight-line estimate. Withdrawal clears route caches and aborts active routing requests. It cannot undo data already received by a provider.
- Fonts are served locally, with their licenses, instead of contacting Google Fonts. Theme and comparison preferences are no longer written merely by visiting a page.

## Storage inventory

| Storage | Purpose | Lifetime / deletion |
| --- | --- | --- |
| `trav_session` cookie | API authentication; HttpOnly, Secure in production | One hour; cleared on logout |
| `trav_privacy_choices` local storage | Consent choices, dates and policy version | 180-day validity; renewed choice on expiry/version change |
| `trav_locale`, `trav_theme`, `travseeker-temperature-unit` | Requested preferences | Until changed or browser data cleared |
| `trav_compare`, `travseeker:saved-essentials` | Requested comparisons and saved essentials | Until removed or browser data cleared |
| `trav_editor_language` | Requested editor language | Until changed or browser data cleared |
| `trav_editor_draft:*` session storage | Administrator drafts | Until saved/discarded or the tab session ends |
| `trav_email_verification_banner_dismissed:v2:*` session storage | Dismissed verification reminder | Tab session |
| `travseeker:route:*` local storage | Optional OSRM route cache | 24-hour freshness checked on read; cleared on withdrawal |

Persistent functional preferences have no automatic expiry. Clearing site data removes them. Cookie rejection does not log the user out or delete explicitly saved functional preferences.

## External services

Cloudinary delivers images and receives network information such as IP addresses; its documentation says asset delivery does not set cookies. A read-only audit of destination, essential and avatar URLs found 80 Cloudinary URLs and no other image hosts in those fields. The editor can accept external image URLs, so new providers require review. Ordinary image delivery is disclosed separately from optional tracking.

CARTO/OpenStreetMap receive IP addresses and requested map areas after map permission. OSRM receives route coordinates and IP addresses. Neon stores application data. Open-Meteo climate requests are made server-to-server with destination coordinates. Hosting and SMTP providers, actual processing regions, contracts, logs and backup retention must be confirmed by the operators. No Google Analytics, advertising pixel or behavioural advertising integration was found in the reviewed code.

## Required before treating the notices as final

1. Supply a valid operator/business contact address in `shared/legal.json`. Do not invent an address. Confirm which tax or registration disclosures apply and complete `taxDetails` where applicable.
2. Confirm how the two named operators share controller responsibilities and document the appropriate arrangement.
3. Identify the actual hosting and email providers, processing locations, processor contracts and any international-transfer safeguards. Update both languages of the privacy notice accordingly.
4. Decide and implement retention periods for accounts, user content, logs, verification/recovery data and backups. Replace the pending retention language with verified arrangements; do not promise deletion that the system cannot carry out.
5. Establish a process for rights requests at `travseeker@gmail.com`, including proportionate identity verification, access/correction/deletion and response deadlines. Account deletion is currently a manual request, not an implemented self-service feature.
6. Check the deployed domain in a clean browser, including hosting/CDN additions, actual cookie domains/attributes, network traffic before consent and after rejection, and any services added outside this repository. Local mocked browser checks cannot verify production infrastructure.
7. Have the final operator disclosures and actual processing arrangements reviewed by a qualified Spain/EU privacy professional. A banner alone cannot guarantee compliance or prevent claims.

## Maintenance and verification

Update the bilingual copy in `front/src/pages/legal/LegalPage.tsx` when processing changes, update `shared/legal.json`'s date, and increment `CONSENT_VERSION` in `front/src/features/privacy/consent.ts` when a new consent decision is required. New optional integrations must check the relevant consent category before making requests or accessing optional storage.

`npm run check` passed with 131 tests, frontend lint and production build. Browser checks with mocked application data confirmed default denial, unchecked categories, persistent rejection, preserved session cookies, analytics-only permission with no authentication cookie, maps-only permission, withdrawal, acceptance, no Google Fonts requests and no mobile horizontal overflow. Consent unit tests cover invalid/expired records, category independence, cache cleanup and unavailable browser storage. These are technical checks, not legal certification.

## Primary references

- [AEPD cookie guidance](https://www.aepd.es/guias/guia-cookies.pdf)
- [Spanish LSSI, including operator information and cookies](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758)
- [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)
- [AEPD: exercising data-protection rights](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos)
- [Cloudinary asset-delivery cookie documentation](https://cloudinary.com/documentation/ts_does_cloudinary_store_any_cookies)
- [OpenStreetMap tile-user privacy FAQ](https://osmfoundation.org/wiki/Services_and_tile_users_privacy_FAQ)
- [CARTO basemap terms](https://www.carto.com/legal/basemap-terms/)

## Guided tutorial (5 October 2026)

The tutorial waits until the visitor has made a cookie choice and does not appear over privacy settings. `trav_tour_v1:offered` remembers that the invitation appeared during this tab session. `trav_tour_v1` records only `dismissed` or `completed`: session storage after rejection, and local storage as well when at least one optional category has been accepted. Withdrawing all optional permissions removes the persistent result while preserving the tab's dismissal. There are no tutorial analytics, database calls or additional providers. The bilingual cookie inventory includes both keys. Visitors can restart from the footer's “Repeat tutorial” control.
