# Build 44-B — Furlong Logo and Journey Brand Anchor

**Type:** Brand / UX / navigation integration. No governance, voting, Alpha
status, or human-authority changes. Public Alpha remains PENDING; no founder
votes recorded.

> **Stacked PR.** Base = `build-44-a-stewardship` (PR #41 → which is based on the
> customer homepage #39). The logo is wired into the homepage, the public
> header, and the stewardship pages. Merge order: #39 → #41 → this.

## Principle
The logo is the North Star of the journey — a trust anchor that tells users they
are still inside Furlong, without dominating exploration. It is never a sales
banner, never replaces trust language or disclosures, and never becomes the
journey.

## What was built

| File | Role |
|---|---|
| `public/brand/furlong-logo.svg` | Logo asset (placeholder north-star/compass mark + "Furlong" wordmark; replace with the official logo, same path/viewBox). |
| `src/components/brand/FurlongLogo.tsx` | Reusable inline-SVG logo. Props: `size` ("hero"\|"header"\|"report"\|"compact"), `withWordmark?`, `href?`, `className?`. Accessible (alt "Furlong"; "Furlong home" aria-label when linking to `/`; no duplicate accessible name). |
| `src/components/public/PublicSiteHeader.tsx` | Persistent public header: `FurlongLogo size="header"` linking home + mobile-safe nav (Explore, Trust, Data Rights, Stewardship). |
| `src/components/exploration/ExplorationJourneyShell.tsx` | Journey shell: `FurlongLogo size="compact"` + optional breadcrumb (`Furlong → …`) + content slot + trust/disclosure footer. |
| `src/lib/reports/reportBranding.ts` | Report branding: `logoPath`, `reportTitle` ("Furlong Exploration Report"), `advisoryDisclosure`, `dataRightsDisclosure`, `footerText`, + `buildReportBranding({explorationPath, generatedAt})` (adds generated date + path) and `formatExplorationPath`. |

Edits: `PlatformChrome` now renders `PublicSiteHeader` on public routes (instead
of nothing) and internal chrome on internal routes; the homepage hero shows
`FurlongLogo size="hero"` above the headline (supports, not replaces).

## Placement summary
- **Homepage:** hero logo (supports headline) + persistent header logo.
- **Public pages** (`/`, `/about`, `/trust`, `/data-rights`, `/financing-pathways`, `/readiness`, `/onboarding`, `/portal/borrower`, `/stewardship/*`): consistent header logo top-left, links to `/`.
- **Exploration journeys:** compact logo + breadcrumb via `ExplorationJourneyShell` (ready for journey pages).
- **Stewardship/profile pages:** header logo present; the "Steward of …" domain title remains primary.
- **Reports/PDFs:** `reportBranding` provides cover/header + footer logo + mandatory disclosures.
- **Mobile:** header nav uses `flex-wrap` (no hover dependency); logo sizes are compact; hero is not crowded.

## Design + accessibility rules honored
No sales banner; disclosures never hidden behind branding; no founder photos as
logo substitutes; logo supports (never becomes) the journey. Alt text "Furlong";
home link aria-label "Furlong home"; keyboard-navigable; headings unaffected
(the h1 headline remains primary). Internal pages keep internal chrome — public
branding only on intentionally public routes.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run verify:disclosures` | PASS |
| `npm run verify:customer-journey` | PASS |
| `npm run verify:no-personal-docs` | PASS |
| `npm run smoke:claims-public` | PASS |
| `npm run smoke:stewardship` | PASS |
| `npm run build` | exit 0 |

## Acceptance
- [x] Homepage shows the Furlong logo (hero + header).
- [x] Public pages show a consistent header logo linking to `/`.
- [x] Exploration journey shell shows compact logo + breadcrumb.
- [x] Report/PDF branding helper exists.
- [x] Mobile layout remains usable (wrap nav, compact sizes).
- [x] No internal pages get public branding (PlatformChrome gates by route).
- [x] Public Alpha remains PENDING; no founder votes; no Alpha approval.
