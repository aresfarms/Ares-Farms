# Legacy Baseline Quarantine

The original early-build `INPUT → VALIDATION → SCORING → DECISION → RESPONSE`
baseline is **superseded for current nonresidential Furlong runtime use**.

Historical modules and types that contain applicant credit/liquidity or autonomous
approve/reject scoring are retained only as migration/history artifacts. They are
not current platform authority and must not be imported into active `src/app/api`
routes or customer/provider surfaces.

Current nonresidential rule:

- Furlong scores/ranks property/project readiness and provider/program fit only.
- Personal credit, personal/household income, DTI, personal liquidity, personal
  net worth, and similar personal-financial profile fields do not affect Furlong
  nonresidential ranking.
- A selected provider separately owns any borrower/business underwriting its
  program requires.
- Residential is the separately governed exception.
- `/api/rank` and `/api/test-score` are property/project-only governed surfaces
  and reject personal-financial scoring inputs.

`npm run verify:master-volume-build-parity` enforces this boundary and fails if
an active API route imports the superseded personal-financial scoring path or if
the active property/project scoring surfaces drift back toward applicant-credit
scoring.
