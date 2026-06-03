# Build Next 12 - Advanced Intelligence Modules

Implemented: 2026-06-02

Status: Complete as a governed internal vertical surface. Review-bound and not production-live. Internal advisory evidence only — outputs remain advisory, replay-safe, conflict-preserving, and human-review-bound. No approval, eligibility, underwriting, credit decision, lender commitment, public verification, regulatory reliance, environmental clearance, payment authorization, or legal reliance is created.

This completes Build Next (items 08–12) and the full near-term roadmap (Build Now items 01–07 plus Build Next items 08–12).

## What Was Built

- Shared advanced intelligence runtime at `src/lib/intelligence/advancedIntelligenceRuntime.ts` with deterministic composition over five intelligence domains:
  1. **Source intelligence** — grouped by source authority tier with certification-status mix conflict preservation.
  2. **Revenue intelligence** — per-opportunity composition over `REVENUE_OPPORTUNITY_REGISTRY` with program-graph signal linkage.
  3. **Market intelligence** — per-category composition over `MARKET_SIGNALS` with trend-direction conflict preservation and operating-cost signal context.
  4. **Geospatial intelligence** — per-profile composition over `GEO_SUITABILITY_PROFILES` with suitability-spread conflict preservation.
  5. **Pathway intelligence** — per-program composition over `PROGRAM_GRAPH` with stacking-rule and conflict-rule preservation plus marketplace and revenue-opportunity linkage.
- Every composed insight preserves conflicting source signals as first-class evidence; the runtime never collapses conflicts into a single authoritative claim. Each conflict resolves to `REQUIRES_HUMAN_REVIEW` with a specific review route.
- Internal-facing intelligence page at `/governance/advanced-intelligence` with reviewer role, optional state and customer-type scope, summary totals, per-domain insight cards, inline conflict preservation, blocked claims, recommended review routes, disclosures, and governance evidence posture.
- Governed API route at `/api/governance/advanced-intelligence` with runtime guard, version lineage, CONFIDENTIAL classification (input + output), explainability, observability, replay verification, and evidence persistence.
- Advanced Intelligence is registered as a portable internal module with the `advisory-reporting` claims profile.
- Module registry, event contract registry, and handoff map now include `governance.intelligence.composed`, the downstream Revenue Opportunity Workspace, Property Discovery, Customer Revenue Review, Borrower Opportunity Discovery, Registry Framework, Governance Evidence Engine, Internal Certification Engine, Connector Certification, Evidence Packets, Audit Replay, Governance, Reviews, and Module Readiness consumer wiring, and thirteen governed handoffs from the engine to those modules.
- Lightweight smoke coverage added through `npm run smoke:advanced-intelligence`.

## Master Volume Traceability

- Vol I: keeps advanced intelligence subordinate to constitutional authority; composed intelligence describes accountable advisory guidance and never replaces external review, public verification, or regulatory reliance.
- Vol II: blocks the runtime from claiming approval, eligibility, underwriting, credit decision, lender commitment, environmental clearance, payment authorization, official report publication, or legal reliance.
- Vol III: provides deterministic, replay-safe composition over source, revenue, market, geospatial, and pathway intelligence with explicit conflict-preservation.
- Vol III-B: supplies runtime guard, CONFIDENTIAL classification, version lineage, observability, explainability, and replay verification.
- Vol IV: routes intelligence handoffs to the Revenue Opportunity Workspace, Property Discovery, Customer Revenue Review, Borrower Opportunity Discovery, Registry Framework, Governance Evidence Engine, Internal Certification Engine, Connector Certification, Module 16 Evidence Packet Workspace, Audit Replay Console, Governance, Reviews, and Module Readiness Control Tower.
- Vol V: preserves canonical claims governance, controlled disclosure, replay, audit, portability, and source-authority boundaries.
- Vol VI-VII: keeps composed intelligence advisory; no portable external conformance or live execution claim is created.

## Safety Boundary

The advanced intelligence runtime does not create:

- approval,
- eligibility determination,
- underwriting decision,
- credit decision,
- lender commitment,
- guaranteed revenue,
- public verification,
- regulatory reliance,
- environmental clearance,
- payment authorization,
- official report publication,
- notice send,
- live external action,
- legal reliance.

It is internal advisory evidence only. Outputs remain advisory, replay-safe, conflict-preserving, and human-review-bound.

## Required Gate Before Promotion (per BUILD_PHASE_ROADMAP)

Outputs remain advisory, replay-safe, conflict-preserving, and human-review-bound.

## Verification

Required verification for this item:

- `npm run smoke:advanced-intelligence`
- `npm run smoke:connector-certification`
- `npm run smoke:registry-framework`
- `npm run smoke:certification-engine`
- `npm run smoke:governance-evidence-engine`
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

This completes the Build Next sequence (items 08–12) and the full near-term roadmap (Build Now items 01–07 plus Build Next items 08–12). The remaining roadmap phase is the **Build Later** ecosystem-scale capabilities (full institutional ecosystem, Volume VII automation, third-party certification marketplace, federated participant network, external conformance program), each of which sits behind production authority, participant governance, and reliance-gate approvals.
