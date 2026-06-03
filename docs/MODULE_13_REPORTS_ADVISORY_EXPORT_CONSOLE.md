# Module 13 - Reports and Advisory Export Console

## Module Decision

Module 13 is the internal Reports and Advisory Export Console at:

`/reports`

This module is an internal advisory report record, export posture,
classification, and human-review boundary surface. It records governed advisory
artifacts without creating official reports or regulatory reliance packets.

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
- `/api/reports/admin`
- `/api/reports/pdf`

## Module Rules

- Internal advisory report governance surface only.
- May record advisory report records and export posture.
- Must preserve classification, explainability, replay, evidence, and human-review controls.
- Must preserve the official-use and external-report-generation boundaries.
- Does not create an official report.
- Does not create a public verification artifact.
- Does not create a lender reliance packet.

## Verification

Module 13 was verified on 2026-05-25 with:

```bash
npm run smoke:content-claims
npx tsx src/scripts/reportAdminReadSmokeTest.ts
npx tsc --noEmit
npm run build
```

Browser inspection target:

```bash
http://localhost:3000/reports
```

Browser inspection confirmed:

- `/reports` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Advisory report controls render.
- No horizontal overflow or runtime error overlay was detected.
