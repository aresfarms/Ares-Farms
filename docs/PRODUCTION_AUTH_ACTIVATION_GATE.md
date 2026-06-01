# Production Auth Activation Gate

This gate controls when the backend authentication layer can be treated as
ready for production-like API exposure.

It is written for Caitlin as the operator. You do not need to read code to use
it.

## Governing Rule

No borrower-facing, lender-facing, sponsor-facing, admin-facing, marketplace,
or product module may rely on production API access until this gate is passing
for the intended environment.

## What Was Added

The backend now has:

- a credential activation policy:
  - `src/lib/auth/authActivationPolicy.ts`
- a governed role provisioning store:
  - `src/lib/auth/roleProvisioningStore.ts`
- a governed role provisioning API:
  - `/api/auth/role-provisioning`
- an auth activation smoke test:
  - `npm run smoke:auth-activation-policy`
- a production auth activation gate:
  - `npm run auth:activation`
  - `npm run auth:activation:production`

## What This Protects

This gate prevents:

- open development credentials from being used as production credentials,
- `/api/auth/init` from creating elevated roles like `operator`, `underwriter`,
  `auditor`, `admin`, or `governance`,
- request bodies from becoming role authority,
- role changes unless they come through authenticated session authority,
- admin self-escalation into admin or governance roles,
- production activation without API auth enforcement and rate limiting.

## Current Local Status

The local gate passes with production warnings.

That means the backend code is present and testable locally, but production
activation still requires real environment values.

## Production Activation Requirements

Production activation requires:

| Setting | Required Value |
| --- | --- |
| `NEXTAUTH_SECRET` | strong production secret, 32+ characters |
| `NEXTAUTH_URL` | HTTPS non-localhost URL |
| `API_AUTH_ENFORCEMENT` | `required` |
| `RATE_LIMITING_ENABLED` | `true` |
| `AUTH_CREDENTIALS_MODE` | `email-allowlist` |
| `AUTH_CREDENTIAL_EMAIL_ALLOWLIST` | comma-separated allowed login emails |
| `AUTH_CREDENTIAL_SHARED_SECRET` | strong shared secret, 32+ characters |
| `ROLE_PROVISIONING_MODE` | `governed-admin-only` |

## Important Interpretation

The current production credential mode is a controlled internal bridge. It is
not a long-term public identity provider.

Before real public launch, the preferred next hardening step is an external
identity provider or passwordless verified email flow. Until then, production
activation must stay limited to tightly controlled internal users.

## Commands

Run local auth activation:

```bash
npm run auth:activation
```

Run production-profile auth activation:

```bash
npm run auth:activation:production
```

Run the backend verification gate:

```bash
npm run verify:backend
```

Run the full backend production activation gate:

```bash
npm run backend:production-readiness:production
```
