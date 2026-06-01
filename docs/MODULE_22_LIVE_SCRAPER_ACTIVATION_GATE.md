# Module 22 - Live Scraper Activation Gate

## Module Decision

Module 22 is the internal Live Scraper Activation Gate at:

`/live-scraper-activation`

This module reviews governed scraper and source-stack readiness before any live
external source action can be considered. It does not activate scrapers. It
proves that live fetch remains blocked until source-specific legal/ToS review,
credential vault evidence, certified live adapter implementation, replay,
provenance, monitoring, rollback, incident response, and human promotion
approval are complete. Module 23 now owns the separate source legal and
licensing review posture that Module 22 consumes as a blocker. Module 24 now
packages Module 22 activation evidence into a separate source promotion packet
without approving live source activation.

## Governing Sources

- Furlong Volume 0 Platform Orientation
- Ares Volume I Constitutional Backbone
- Ares Volume II Regulatory Governance
- Ares Volume III Technical Infrastructure
- Ares Volume III-B Governance Runtime
- Ares Volume IV Operational Runbooks
- Ares Volume V Canonical Doctrines
- Ares Volume VI Source Intelligence Integration
- Ares Master Cross-Reference Index

## Consumed Backend Surfaces

- `/api/governance/live-scraper-activation`
- `/api/scrapers`
- `/api/scrapers/escalate`
- `/api/source-stack`
- `/api/source-stack/freshness`
- `/api/governance/source-legal-review`
- `/api/governance/source-promotion-packets`
- `/api/governance/live-action-readiness/admin`

## Module Rules

- Internal activation-readiness surface only.
- Uses governed source intelligence registries and runtime envelopes.
- Shows the required safe status messages:
  - Your document was received.
  - Human review is pending.
  - More information may be needed.
- Keeps every scraper production-blocked.
- Keeps live external fetch disabled.
- Treats Module 23 source legal/licensing review as required evidence, not as
  legal advice or source-use approval.
- Does not contact source systems.
- Does not fetch official agency, property, marketplace, or borrower data.
- Does not create public verification authority.
- Does not authorize official reports, notices, decisions, approvals, or
  underwriting reliance.

## Verification

Module 22 adds:

- `src/lib/governance/liveScraperActivationGate.ts`
- `src/app/api/governance/live-scraper-activation/route.ts`
- `src/app/live-scraper-activation/page.tsx`
- `src/scripts/liveScraperActivationGateSmokeTest.ts`

Required checks:

```bash
npx tsc --noEmit
npm run smoke:live-scraper-activation
npm run smoke:module-registry
npm run verify:module-manifests
npm run verify:scraper-source-intelligence
npm run verify:source-stack-architecture
npm run smoke:platform
npm run build
```
