# Module 18 - Exception Remediation and Recovery Console

## Module Decision

Module 18 is the internal Exception Remediation and Recovery Console at:

`/exception-remediation`

This module connects stalled-work, exception, readiness, credential, notice,
payment, connector, and sovereign-control posture into one Vol IV recovery
surface. It can record an advisory remediation memo through the governed report
runtime.

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
- `/api/notices/admin`
- `/api/connectors/admin`
- `/api/billing/connectors/admin`
- `/api/governance/live-action-readiness/admin`
- `/api/governance/sovereign-consent-gateway/admin`
- `/api/connectors/credentialed-ingestion/admin`
- `/api/reports/pdf`

## Module Rules

- Internal remediation and recovery surface only.
- May record advisory remediation memos.
- Must preserve borrower, tenant, application, notice, payment, connector, and sovereign boundaries.
- Does not perform live remediation.
- Does not transmit external connector requests.
- Does not send notices.
- Does not capture payments.
- Does not use sovereign data outside scoped gateway controls.

## Verification

Module 18 was verified on 2026-05-25 as part of the Modules 0-20
verification pass.

Completed checks:

```bash
npm run smoke:content-claims
npm run smoke:reports-admin-read
npx tsc --noEmit
npm run build
```

Browser inspection confirmed:

- `/exception-remediation` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Cross-module remediation links render.
- No horizontal overflow or runtime error overlay was detected.
