# Production Backend Activation Runbook

This runbook is the operator-facing bridge between the local backend build and
production-like backend activation.

It is written for Caitlin as the operator. You do not need to read code to use
it.

## Governing Rule

The backend may be called locally ready when local verification passes.

The backend may be called production-activation ready only when the production
profile gates pass with real deployment configuration.

No borrower-facing, lender-facing, sponsor-facing, admin-facing, marketplace,
or product module should treat production API access as available until this
runbook is satisfied.

## What This Gate Adds

The build now has:

- a production environment template:
  - `.env.production.example`
- a production backend readiness gate:
  - `npm run backend:production-readiness`
  - `npm run backend:production-readiness:production`

## Required Production Settings

Use the hosting provider secret manager for real values. Do not paste real
secrets into `.env.production.example`.

| Setting | Required Production Posture |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL with `sslmode=verify-full` or `sslmode=verify-ca` |
| `NEXT_PUBLIC_BASE_URL` | HTTPS production application URL |
| `NEXTAUTH_URL` | HTTPS production application URL |
| `NEXTAUTH_SECRET` | strong production secret, 32+ characters |
| `API_AUTH_ENFORCEMENT` | `required` |
| `RATE_LIMITING_ENABLED` | `true` |
| `API_RATE_LIMIT_WINDOW_SECONDS` | positive integer |
| `API_RATE_LIMIT_MAX` | positive integer |
| `AUTH_CREDENTIALS_MODE` | `email-allowlist` |
| `AUTH_CREDENTIAL_EMAIL_ALLOWLIST` | comma-separated internal login emails |
| `AUTH_CREDENTIAL_SHARED_SECRET` | strong temporary shared secret, 32+ characters |
| `ROLE_PROVISIONING_MODE` | `governed-admin-only` |
| `BACKEND_SMOKE_BASE_URL` | HTTPS production or staging base URL |

## Local Completion Commands

Run these before claiming the backend is locally ready for governed internal
module work:

```bash
npm run verify:backend
npm run build
npm run smoke:backend
npm run backend:production-readiness
```

## Production Activation Commands

Run these before production-live exposure:

```bash
npm run backend:production-readiness:production
npm run auth:activation:production
npm run security:audit:production
```

The production profile is expected to fail until the real production
environment values are configured.

## Current Interpretation

The backend is locally strong when the local gates pass.

Production remains intentionally blocked until real secrets, HTTPS URL,
session enforcement, rate limits, credential allowlist, and governed role
provisioning are configured.

This is not a delay or bug. It is the Master Volume control boundary doing its
job.

## Do Not Put These In `.env`

Do not put raw USDA, SBA, lender, sponsor, tribal, borrower portal, agency
portal, or third-party account credentials into `.env`.

The backend uses governed credential vault references and pre-session
credentialed agency ingestion records for that class of access.
