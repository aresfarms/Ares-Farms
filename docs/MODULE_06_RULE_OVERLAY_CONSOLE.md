# Module 06 - Rule and Overlay Evaluation Console

## Module Decision

Module 06 is the internal Rule and Overlay Evaluation Console at:

`/rules`

This module is an internal governance surface for recording advisory rule,
overlay, escalation, and source-reliance evaluations against governed
application scope.

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
- `/api/rules/admin`
- `/api/rules/evaluate`

## Module Rules

- Internal rule and overlay review surface only.
- May record advisory rule evaluation output.
- May apply canonical rule and overlay identifiers.
- Must preserve human-review and regulatory-reliance boundaries.
- Does not issue final eligibility, lending, or adverse-action outcomes.
- Does not create public, lender, sponsor, or borrower-facing claims.

## Verification

Module 06 was verified on 2026-05-25 with:

```bash
npm run smoke:content-claims
npx tsc --noEmit
npm run build
```

Browser inspection target:

```bash
http://localhost:3000/rules
```

Browser inspection confirmed:

- `/rules` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Rule and overlay controls render.
- No horizontal overflow issues were detected.
