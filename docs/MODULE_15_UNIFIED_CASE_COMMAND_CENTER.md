# Module 15 - Unified Case Command Center

## Module Decision

Module 15 is the internal Unified Case Command Center at:

`/case-command`

This module is a cross-module case view that links governed application scope
to operator queue, document, review, rule, notice, connector, partner, billing,
report, and promotion-gate posture.

## Governing Sources

- Furlong Volume 0 Platform Orientation
- Ares Volume I Constitutional Backbone
- Ares Volume II Regulatory Governance
- Ares Volume III Technical Infrastructure
- Ares Volume III-B Governance Runtime
- Ares Volume IV Operational Runbooks
- Ares Volume V Canonical Doctrines
- Ares Master Cross-Reference Index
- Furlong Customer Version
- Furlong Governance Doctrines Master Series

## Consumed Backend Surfaces

- `/api/applications/admin`
- `/api/queues/admin`
- `/api/documents/admin`
- `/api/reviews/admin`
- `/api/rules/admin`
- `/api/notices/admin`
- `/api/connectors/admin`
- `/api/partners/admin`
- `/api/billing/admin`
- `/api/reports/admin`
- `/api/governance/live-action-readiness/admin`

## Module Rules

- Internal cross-module command surface only.
- Reads prior module APIs instead of bypassing module boundaries.
- Links back into Modules 02-14 for workflow continuation.
- Must preserve scoped application, borrower, and tenant boundaries.
- Does not make final decisions.
- Does not perform live external actions.
- Does not create borrower-facing, lender-facing, or public claims.

## Verification

Module 15 was verified on 2026-05-25 as part of the Modules 0-17
verification pass.

Completed checks:

```bash
npm run smoke:content-claims
npx tsc --noEmit
npm run build
```

Browser inspection confirmed:

- `/case-command` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Cross-module links and scoped interoperability records render.
- No horizontal overflow or runtime error overlay was detected.
