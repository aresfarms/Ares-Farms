# Module 21 - Environmental Compliance Review

## Module Decision

Module 21 is the internal Environmental Compliance Review surface at:

`/environmental-compliance`

This module reviews environmental pathway state, provider-license posture,
borrower fee controls, spoke isolation, audit anchors, and pathway advancement
posture without generating official environmental reports or performing live
provider action.

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

- `/api/applications/admin`
- `/api/governance/environmental-compliance`
- `/api/governance/environmental-compliance/admin`
- `/api/connectors/credentialed-ingestion/admin`
- `/api/governance/live-action-readiness/admin`
- `/api/reports/admin`

## Module Rules

- Internal environmental compliance review surface only.
- Uses governed admin/read APIs instead of direct database reads.
- Preserves borrower, tenant, application, provider-license, fee, and audit
  record scope.
- Records advisory operational posture only.
- Shows the required safe status messages:
  - Your document was received.
  - Human review is pending.
  - More information may be needed.
- Does not generate official environmental reports.
- Does not contact environmental providers.
- Does not fetch live agency data.
- Does not make loan, permit, eligibility, or environmental clearance
  determinations.

## Verification

Completed checks:

```bash
npx tsc --noEmit
npm run smoke:module-registry
npm run verify:module-manifests
npm run backend:module-readiness
npm run verify:environmental-compliance
npm run build
```

Browser inspection confirmed:

- `/environmental-compliance` loads successfully.
- Claims Gate remains Pass.
- Required safe status messages render.
- The governance boundary text renders.
- The platform navigation includes Module 21.
