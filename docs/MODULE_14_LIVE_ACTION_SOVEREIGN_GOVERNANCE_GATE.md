# Module 14 - Live Action and Sovereign Governance Gate

## Module Decision

Module 14 is the internal Live Action and Sovereign Governance Gate at:

`/promotion`

This module is an internal production-promotion readiness, live-action hold,
and Sovereign Consent Gateway posture surface. It consumes execution evidence
from prior modules and records gate posture without performing live actions.

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
- `/api/notices/admin`
- `/api/billing/connectors/admin`
- `/api/governance/live-action-readiness/admin`
- `/api/governance/live-action-readiness`
- `/api/governance/sovereign-consent-gateway/admin`
- `/api/governance/sovereign-consent-gateway`

## Module Rules

- Internal production-promotion gate only.
- May record live-action readiness review posture.
- May record Sovereign Consent Gateway review posture.
- Must consume execution evidence from connector, notice, and payment modules.
- Must preserve sovereign Level 5 default posture and bounded Level 4 exception controls.
- Does not perform live external calls.
- Does not send notices.
- Does not capture payments.
- Does not perform sovereign data access, scoring use, or underwriting use.

## Verification

Module 14 was verified on 2026-05-25 with:

```bash
npm run smoke:content-claims
npx tsx src/scripts/liveActionReadinessSmokeTest.ts
npx tsx src/scripts/liveActionReadinessAdminReadSmokeTest.ts
npx tsx src/scripts/sovereignConsentGatewaySmokeTest.ts
npx tsx src/scripts/sovereignConsentGatewayAdminReadSmokeTest.ts
npx tsc --noEmit
npm run build
```

Browser inspection target:

```bash
http://localhost:3000/promotion
```

Browser inspection confirmed:

- `/promotion` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Live-action readiness and Sovereign Consent Gateway controls render.
- No horizontal overflow or runtime error overlay was detected.
