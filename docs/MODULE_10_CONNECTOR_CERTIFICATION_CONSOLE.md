# Module 10 - Connector Certification Console

## Module Decision

Module 10 is the internal Connector Certification Console at:

`/connectors`

This module is an internal source authority, adapter review, and
execution-control posture surface for USDA, SBA, property, and institutional
connector governance.

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
- `/api/connectors/admin`
- `/api/connectors/source-check`
- `/api/connectors/adapters`
- `/api/connectors/execution`

## Module Rules

- Internal connector governance surface only.
- May record source authority checks.
- May record adapter review posture.
- May record execution-control posture.
- Must preserve credential, consent, isolation, outage, replay, and schema-contract gates.
- Does not perform live external calls.
- Does not fetch official external source data.
- Does not create public, lender, sponsor, or borrower-facing claims.

## Verification

Module 10 was verified on 2026-05-25 with:

```bash
npm run smoke:content-claims
npx tsc --noEmit
npm run build
```

Browser inspection target:

```bash
http://localhost:3000/connectors
```

Browser inspection confirmed:

- `/connectors` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Source, adapter, and execution-control surfaces render.
- No horizontal overflow issues were detected.
