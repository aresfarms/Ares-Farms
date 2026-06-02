# Build Now 01 - Core Borrower Onboarding

Implemented: 2026-06-02

Status: Complete as a governed borrower-facing vertical surface. Review-bound and not production-live.

## What Was Built

- Shared borrower onboarding core runtime at `src/lib/borrower/onboardingCore.ts`.
- Borrower onboarding page at `/onboarding` with readiness, missing-item, handoff, and disclosure state.
- `/api/onboard` now returns borrower workflow evidence with readiness, handoffs, disclosures, production block posture, and human review posture.
- First-time borrower intake without an existing `applicationId` is allowed when `allowMissingApplication` is explicitly set and borrower/tenant/user scope is present.
- Borrower onboarding is registered as a portable borrower surface.
- Module registry, event contract registry, and handoff map now include `borrower.onboarding.submitted`.
- Lightweight smoke coverage added through `npm run smoke:borrower-onboarding-core`.

## Safety Boundary

Core borrower onboarding does not create:

- eligibility,
- approval,
- pre-approval,
- underwriting decision,
- financing commitment,
- official environmental clearance,
- legal or regulatory reliance,
- public verification,
- borrower notice send,
- payment capture,
- live external action.

## Verification

Passed:

- `npm run smoke:borrower-onboarding-core`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npx tsc --noEmit`
- `npm run build`
- Runtime POST check against `/api/onboard`

Current conformance counts after this item:

- Module manifests: 65
- Event contracts: 56
- Cross-module handoffs: 95
- Public surfaces checked: 20
- Static pages generated: 223

## Next Sequence

Next Build Now item: Financing Pathway Engine.
