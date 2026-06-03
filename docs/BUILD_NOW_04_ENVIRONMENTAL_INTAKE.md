# Build Now 04 - Environmental Intake

Implemented: 2026-06-02

Status: Complete as a governed borrower-facing vertical surface. Review-bound and not production-live.

## What Was Built

- Shared environmental intake runtime at `src/lib/environmental/intakeRuntime.ts` with deterministic routing across NEPA screening, Phase I ESA, state environmental review, and exemption pathway scenarios.
- Borrower environmental intake page at `/portal/borrower/environmental-intake` with readiness, missing-item review signals, routed assessment posture, trigger signals, exemption candidates, blocked claims, disclosures, and governance evidence posture.
- Governed API route at `/api/environmental/intake` with runtime guard, version lineage, RESTRICTED classification (input + output), explainability, observability, replay verification, and evidence persistence.
- Intake routes the borrower to the Module 21 environmental compliance review surface for human review; no provider engagement is performed and no provider fee is authorized.
- Borrower onboarding environmental handoff now points to `/portal/borrower/environmental-intake` instead of the internal Module 21 surface.
- Readiness assessment environmental section nextRoute now points to `/portal/borrower/environmental-intake`.
- Borrower environmental intake is registered as a portable borrower/public surface.
- Module registry, event contract registry, and handoff map now include `borrower.environmental.intake.submitted`, the upstream `borrower.onboarding.submitted` consumer wiring, and the downstream environmental compliance, applications, documents, readiness, and data-rights consumer wiring.
- Lightweight smoke coverage added through `npm run smoke:environmental-intake`.

## Master Volume Traceability

- Vol I: keeps environmental intake subordinate to the Environmental Engineering Spoke's constitutional authority and Banker Spoke isolation.
- Vol II: blocks intake from becoming an environmental determination, clearance, permit, lender commitment, official notice, or regulatory or legal reliance.
- Vol III: provides deterministic, replay-safe routing across NEPA, Phase I ESA, state environmental review, and exemption pathway scenarios.
- Vol III-B: supplies runtime guard, RESTRICTED classification, version lineage, explainability, observability, and replay verification.
- Vol IV: routes operator and borrower handoffs to Module 21 environmental review, documents, applications, readiness, and data rights.
- Vol V-VII: preserves claims controls, source authority, provider-license posture, fee-disclosure posture, and disclosure boundaries on the borrower-readable environmental surface.

## Safety Boundary

The environmental intake does not create:

- environmental clearance,
- environmental permit,
- environmental determination,
- official environmental report,
- external provider engagement,
- provider fee authorization,
- lender commitment,
- official borrower notice,
- official report publication,
- legal or regulatory reliance,
- payment capture,
- live external action.

It is operational intake and review routing only.

## Verification

Required verification for this item:

- `npm run smoke:environmental-intake`
- `npm run smoke:readiness-assessment`
- `npm run smoke:financing-pathway-engine`
- `npm run smoke:borrower-onboarding-core`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npx tsc --noEmit`
- `npm run build`

## Next Sequence

Next Build Now item: Opportunity Discovery.
