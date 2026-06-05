# Build 47-B — Homepage Discovery Identity Integration

**Date:** 2026-06-05  
**Branch:** build-44-b-logo-brand  
**Extends:** Build 47-A (Historical & Modern Opportunity Map System)  
**Status:** Complete — awaiting Public Alpha gate

---

## What This Build Does

Rewrites the homepage (`src/app/page.tsx`) as a cohesive discovery experience. The page is now exploration-first, not lead-capture-first. Every section is designed to orient visitors toward discovery rather than conversion.

The compass watermark, the Living Opportunity Map, and the featured exploration stories are integrated into a single coherent visual narrative.

---

## Section Architecture

| Section | Purpose |
|---------|---------|
| Hero | Compass watermark + headline + CTA + Living Opportunity Map |
| How would you like to explore? | Two-path choice: full map or focus by topic |
| What would you like to explore today? | 8 exploration category cards |
| Trust Strip | 5 trust statements |
| Furlong Stewardship | StewardshipSection integration |
| What Furlong Is Not | 5 explicit boundary statements + explanatory note |
| Footer | 8 navigation links |

---

## Exact Content — Trust Strip

1. We personalize with you, not to you.
2. You can explore before sharing personal information.
3. We do not sell your data.
4. We show pathways, not promises.
5. You remain in control.

---

## Exact Content — What Furlong Is Not

1. Furlong is not a lender.
2. Furlong does not approve or deny financing.
3. Furlong does not guarantee outcomes.
4. Furlong does not make official determinations.
5. Furlong does not sell your information.

---

## Exact Content — Footer Links (8)

About, Trust, Data Rights, Financing Pathways, Readiness, Onboarding, Borrower Portal, Stewardship

---

## Design Posture

The homepage must feel: educational, trustworthy, exploratory, professional, timeless.

It must not feel: surveillance-oriented, gamified, data-heavy, or marketing-driven.

No geolocation. No layer selector exposed to visitors. No internal module names visible.

---

## Technical Notes

- Root element is `<div>` not `<main>` — PlatformShell already provides a `<main>` wrapper.
- Compass watermarks (`FurlongCompassWatermark`) use hero and subtle variants as absolute-positioned brand elements.
- `FurlongLogo` is not imported — the logo renders automatically via `PublicSiteHeader`.
- All CSS is inline via `<style>` tag with `fl-` prefixed class names.
- CTA button links to `#explore` anchor — exploration-first, not direct onboarding.
- Mobile responsive via `@media (max-width: 640px)`.

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Complete rewrite — 8-section discovery identity homepage |
| `docs/build-records/2026-06-05/customer-journey.json` | Updated journey verification |
| `docs/build-records/2026-06-05/disclosure-audit-gate.json` | Updated disclosure audit |

---

## Verification Results (2026-06-05)

| Check | Result |
|-------|--------|
| `verify:map-assets` | ✓ All checks passed |
| `verify:customer-journey` | ✓ |
| `verify:disclosures` | ✓ |
| `verify:no-personal-docs` | ✓ |
| `npx tsc --noEmit` | ✓ Clean |
| `npm run build` | ✓ Compiled |
| Visual verification | ✓ All 8 sections confirmed in browser |

---

## Privacy Posture

No geolocation. No personalization language ("near you," "your area"). No individual property data. No surveillance aesthetics.

"The map reveals opportunities, not the visitor."

---

## Public Alpha Status

Public Alpha remains **PENDING**. Build 47-B does not authorize Alpha launch.

---

## Governing Doctrine

See `docs/DOCTRINE_MAP_LAYER_GOVERNANCE_V1.md` for map layer governance.

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-05 | Initial — Build 47-B |
