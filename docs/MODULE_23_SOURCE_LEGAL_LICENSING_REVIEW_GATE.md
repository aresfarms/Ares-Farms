# Module 23 - Source Legal and Licensing Review Gate

## Module Decision

Module 23 is the internal Source Legal and Licensing Review Gate at:

`/source-legal-review`

This module reviews source-specific legal, terms-of-service, licensing,
anti-bulk, retention, republication, permitted-use, restricted-use, public DTO,
and human activation controls before any scraper, connector, source-stack, or
live external source activation can proceed.

This module does not provide legal advice. It records review posture only. It
does not contact external source systems, fetch live source data, approve
scraping, approve bulk acquisition, approve republication, or create official
source reliance.

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

- `/api/governance/source-legal-review`
- `/api/source-stack`
- `/api/source-stack/freshness`
- `/api/governance/live-scraper-activation`
- `/api/connectors/adapters`
- `/api/source-ingestion/review`

## Module Rules

- Internal legal/licensing readiness surface only.
- Review evidence only, not legal advice.
- Uses canonical source-stack profiles and source authority posture.
- Shows the required safe status messages:
  - Your document was received.
  - Human review is pending.
  - More information may be needed.
- Keeps every source activation-blocked.
- Keeps legal approval and ToS approval at zero until qualified review is
  actually implemented as a controlled promotion workflow.
- Keeps live external fetch disabled.
- Does not contact source systems.
- Does not fetch official agency, property, marketplace, or borrower data.
- Does not approve anti-bulk acquisition.
- Does not approve retention, caching, republication, or public display.
- Does not create public verification authority.
- Does not authorize official reports, notices, decisions, approvals,
  underwriting reliance, collateral certification, or legal/regulatory use.

## Interoperability

Module 23 publishes:

- `source.legal.reviewed`

Module 23 feeds:

- Module 22 Live Scraper Activation Gate
- Module 24 Source Promotion Packet Gate
- Module 14 Live Action Sovereign Governance Gate
- Module 20 Integrated Module Readiness Control Tower
- Promotion controls

Module 22 now treats source legal review as a separate blocker. Live scraper
activation cannot be considered complete when Module 23 still records qualified
legal/licensing review as pending.

Module 24 consumes Module 23 legal/licensing posture as promotion packet
evidence, but it still cannot approve source use or provide legal advice.

## Verification

Module 23 adds:

- `src/lib/governance/sourceLegalReviewGate.ts`
- `src/app/api/governance/source-legal-review/route.ts`
- `src/app/source-legal-review/page.tsx`
- `src/scripts/sourceLegalReviewGateSmokeTest.ts`

Required checks:

```bash
npx tsc --noEmit
npm run smoke:source-legal-review
npm run smoke:live-scraper-activation
npm run smoke:module-registry
npm run verify:module-manifests
npm run verify:source-stack-architecture
npm run backend:module-readiness
npm run smoke:integration
npm run build
```
