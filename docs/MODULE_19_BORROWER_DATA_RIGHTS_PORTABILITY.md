# Module 19 - Borrower Data Rights and Portability Workspace

## Module Decision

Module 19 is the internal Borrower Data Rights and Portability Workspace at:

`/data-rights`

This module prepares borrower review, export, transport, audit, and
machine-readable package posture by connecting application, document, notice,
ledger, connector, report, sovereign, and remediation records. It can record an
advisory portability summary through the governed report runtime.

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
- `/api/documents/admin`
- `/api/notices/admin`
- `/api/ledger/admin`
- `/api/connectors/admin`
- `/api/reports/admin`
- `/api/governance/sovereign-consent-gateway/admin`
- `/api/reports/pdf`

## Module Rules

- Internal borrower data-rights preparation surface only.
- Supports borrower review, export, transport, audit, and machine-readable preparation.
- Must preserve classification, redaction, consent, retention, recipient authority, and restricted-use controls.
- Must not put borrower rights behind a premium barrier or dark pattern.
- Does not externally disclose records.
- Does not publish official reports.
- Does not bypass raw document controls.

## Verification

Module 19 was verified on 2026-05-25 as part of the Modules 0-20
verification pass.

Completed checks:

```bash
npm run smoke:content-claims
npm run smoke:reports-admin-read
npx tsc --noEmit
npm run build
```

Browser inspection confirmed:

- `/data-rights` loads successfully.
- Claims Gate remains Pass.
- The page hydrates and finishes loading.
- Borrower review, export, transport, audit, and machine-readable source links render.
- No horizontal overflow or runtime error overlay was detected.
