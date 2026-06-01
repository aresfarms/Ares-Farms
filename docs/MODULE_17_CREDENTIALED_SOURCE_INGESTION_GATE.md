# Module 17 - Credentialed Source Ingestion Gate

## Module Decision

Module 17 is the internal Credentialed Source Ingestion Gate at:

`/source-ingestion`

This module governs pre-session review for credentialed agency or external
source access. It records credential, ToS, license, whitelist, provenance,
isolation, anti-bulk, and circuit-breaker posture without transmitting an
external request.

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
- `/api/connectors/credentialed-ingestion/admin`
- `/api/connectors/credentialed-ingestion`
- `/api/governance/live-action-readiness/admin`
- `/api/governance/sovereign-consent-gateway/admin`

## Module Rules

- Internal pre-session governance surface only.
- May record credentialed ingestion readiness.
- Must preserve source authority, license, ToS, whitelist, isolation, provenance, and anti-bulk gates.
- Must use credential vault references only.
- Does not store credential values.
- Does not transmit external requests.
- Does not fetch official data.
- Does not process ingested data through scoring, eligibility, or underwriting engines.

## Verification

Module 17 was verified on 2026-05-25 as part of the Modules 0-17
verification pass.

Completed checks:

```bash
npm run smoke:content-claims
npx tsx src/scripts/credentialedAgencyIngestionSmokeTest.ts
npx tsx src/scripts/credentialedIngestionAdminReadSmokeTest.ts
npx tsc --noEmit
npm run build
```

Browser inspection confirmed:

- `/source-ingestion` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Pre-session controls and credentialed ingestion records render.
- No horizontal overflow or runtime error overlay was detected.
