# Build Now 07 - Basic Lender Workflow

Implemented: 2026-06-02

Status: Complete as a governed lender-facing vertical surface. Review-bound and not production-live.

## What Was Built

- Shared lender workflow coordination runtime at `src/lib/lender/workflowRuntime.ts` with deterministic aggregation across application intake, overlay review, evidence preparation, borrower packet readiness, and partner workflow state.
- Unified lender workflow coordination page at `/lender/workflow` with coordination summary totals, five queue sections (packet ready for review, evidence pending, overlay review pending, intake in progress, on hold), per-application review signals, blocked claims, governed handoffs, disclosures, and governance evidence posture.
- Governed API route at `/api/lender/workflow` with runtime guard, version lineage, CONFIDENTIAL classification (input + output), explainability, observability, replay verification, and evidence persistence.
- Borrower identifiers are masked on the lender surface to preserve borrower portability and disclosure controls. Application status flows through deterministic derivation across documents, overlays, evidence, packet readiness, and partner workflow state.
- Lender workflow is registered as a portable lender surface with the `lender-coordination` claims profile.
- Module registry, event contract registry, and handoff map now include `lender.workflow.viewed`, the downstream lender dashboard, applications, overlays, evidence, property opportunities, revenue opportunities, and partner workflow consumer wiring, and seven governed handoffs from the workflow surface to those modules.
- Lightweight smoke coverage added through `npm run smoke:lender-workflow`.

## Master Volume Traceability

- Vol I: keeps lender coordination subordinate to constitutional authority; the lender role is coordination, not credit, underwriting, or eligibility authority.
- Vol II: blocks coordination from becoming approval, preapproval, underwriting decision, eligibility determination, credit decision, lender commitment, official credit communication, or regulatory reliance.
- Vol III: provides deterministic, replay-safe aggregation of application, overlay, evidence, packet, and partner-workflow coordination posture across borrower submissions.
- Vol III-B: supplies runtime guard, CONFIDENTIAL classification, version lineage, explainability, observability, and replay verification.
- Vol IV: routes lender handoffs to lender applications, overlays, evidence, property opportunities, revenue opportunities, partner workflows, and the lender dashboard.
- Vol V-VII: preserves canonical claims governance, controlled disclosure, replay, source authority, and conformance boundaries on lender-readable coordination output.

## Safety Boundary

The lender workflow coordination does not create:

- approval,
- preapproval,
- underwriting decision,
- eligibility determination,
- credit decision,
- lender commitment,
- official credit communication,
- borrower notice send,
- payment capture,
- official report publication,
- legal or regulatory reliance,
- live external action.

It is operational coordination only.

## Verification

Required verification for this item:

- `npm run smoke:lender-workflow`
- `npm run smoke:public-trust`
- `npm run smoke:opportunity-discovery`
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

This completes the seven Build Now items in `docs/BUILD_PHASE_ROADMAP.md`. The next sequence is Build Next item 08 (Governance evidence engine), beginning the institutional-readiness deepening phase.
