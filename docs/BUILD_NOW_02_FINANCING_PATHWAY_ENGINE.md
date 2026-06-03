# Build Now 02 - Financing Pathway Engine

Implemented: 2026-06-02

Status: Complete as a governed borrower-facing vertical surface. Review-bound and not production-live.

## What Was Built

- Shared financing pathway runtime at `src/lib/financing/pathwayEngine.ts`.
- Borrower financing pathway page at `/financing-pathways` with readiness, missing items, pathway candidates, disclosures, and governance evidence posture.
- Governed API route at `/api/financing/pathways` with runtime guard, version lineage, classification, explainability, observability, replay verification, and evidence persistence.
- Program pathway candidates are derived from the existing revenue/source-intelligence program graph instead of a separate financing source list.
- Borrower onboarding now hands financing interest to `/financing-pathways`.
- Borrower financing pathways are registered as a portable borrower/public surface.
- Module registry, event contract registry, and handoff map now include `financing.pathway.evaluated`.
- Lightweight smoke coverage added through `npm run smoke:financing-pathway-engine`.

## Safety Boundary

The financing pathway engine does not create:

- approval,
- preapproval,
- eligibility determination,
- underwriting decision,
- lender commitment,
- financing guarantee,
- official borrower notice,
- legal or regulatory reliance,
- public verification,
- payment capture,
- live external action.

## Verification

Required verification for this item:

- `npm run smoke:financing-pathway-engine`
- `npm run smoke:borrower-onboarding-core`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npx tsc --noEmit`
- `npm run build`

## Next Sequence

Next Build Now item: Readiness Assessment.
