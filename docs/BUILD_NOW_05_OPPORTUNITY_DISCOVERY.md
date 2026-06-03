# Build Now 05 - Opportunity Discovery

Implemented: 2026-06-02

Status: Complete as a governed borrower-facing vertical surface. Review-bound and not production-live.

## What Was Built

- Shared opportunity discovery runtime at `src/lib/opportunity/discoveryRuntime.ts` with deterministic composition across eight advisory sections: grants and programs, revenue opportunities, equipment and marketplace, market context, geo suitability, sellable catalog, property discovery, and operating costs.
- Borrower opportunity discovery page at `/portal/borrower/opportunities` with section summary, card-level translation-layer summaries, fit reasons, blocked claims, recommended next routes, disclosures, and governance evidence posture.
- Governed API route at `/api/opportunities` with runtime guard, version lineage, CONFIDENTIAL classification (input + output), explainability, observability, replay verification, and evidence persistence.
- Discovery composes the existing program graph, marketplace items, market signals, operating costs, geo suitability profiles, revenue opportunity registry, sellable catalog, and property discovery source stack without performing a live external fetch.
- Borrower onboarding opportunity handoff now routes to `/portal/borrower/opportunities` (previously routed to the individual `/portal/property-discovery` surface).
- Readiness assessment opportunity discovery section nextRoute now routes to `/portal/borrower/opportunities`.
- Financing pathway evaluation now lists `/portal/borrower/opportunities` as a recommended next route.
- Borrower opportunity discovery is registered as a portable borrower/public surface.
- Module registry, event contract registry, and handoff map now include `borrower.opportunity.discovery.viewed`, the upstream `borrower.onboarding.submitted` and `borrower.readiness.assessed` consumer wiring, and the downstream revenue opportunities, property discovery, readiness, and data-rights consumer wiring.
- Lightweight smoke coverage added through `npm run smoke:opportunity-discovery`.

## Master Volume Traceability

- Vol I: keeps opportunity discovery subordinate to constitutional authority and accountable human review.
- Vol II: blocks discovery from becoming approval, eligibility, guaranteed revenue, program approval, legal permission, lender commitment, official report publication, or regulatory or legal reliance.
- Vol III: provides deterministic, replay-safe composition across the program graph, marketplace, market signals, operating costs, geo suitability profiles, revenue opportunity registry, sellable catalog, and property discovery source stack.
- Vol III-B: supplies runtime guard, CONFIDENTIAL classification, version lineage, explainability, observability, and replay verification.
- Vol IV: routes operator and borrower handoffs to revenue opportunities, property discovery, financing pathways, readiness, applications, documents, and data rights.
- Vol V-VII: preserves claims controls, source authority, conformance, and disclosure boundaries on the borrower-readable opportunity discovery surface.

## Safety Boundary

The opportunity discovery does not create:

- guaranteed revenue,
- program approval,
- legal permission,
- lender commitment,
- underwriting reliance,
- official property certification,
- source certainty claim,
- live external fetch result,
- official borrower notice,
- official report publication,
- legal or regulatory reliance,
- payment capture,
- live external action.

It is discovery intelligence only and remains review-bound.

## Verification

Required verification for this item:

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

Next Build Now item: Public Trust Pages.
