# Security & Audit Readiness Gate

This gate controls whether backend work may be treated as ready for module
builds.

It is written for Caitlin as the operator. You do not need to read code to use
it.

## Governing Rule

No borrower-facing, lender-facing, sponsor-facing, admin-facing, marketplace,
or product module should be built on top of the backend unless this gate has
been run and the current blockers are understood.

## What This Gate Checks

The automated gate checks:

- Master Volume and backend readiness documents exist.
- `.env` is ignored by git.
- local environment keys do not contain raw agency credentials.
- `DATABASE_URL` exists.
- PostgreSQL SSL is explicit and certificate-verifying.
- the application database pool uses the governed SSL helper.
- NextAuth has a governed secret and local URL posture.
- the NextAuth route uses the governed auth security helpers.
- protected API routes have a perimeter proxy for authenticated session
  enforcement when production auth is enabled.
- caller-claimed roles, actors, and tenants are checked against authenticated
  session authority when production auth is enabled.
- open development credentials are blocked when production auth is active.
- self-service auth initialization cannot create elevated roles.
- elevated roles must go through governed role provisioning.
- API rate limiting can be enabled at the same perimeter before route logic
  executes.
- the API security policy has smoke coverage wired into backend verification.
- audit/ledger admin-read route, store, and smoke coverage exist.
- backend smoke includes audit/ledger admin-read coverage.
- production backend activation has an environment template and aggregate
  readiness gate.
- production-only blockers are visible before live deployment.

## Commands

Run the local module-readiness gate:

```bash
npm run security:audit
```

Run the production-live gate:

```bash
npm run security:audit:production
```

Run the full backend verification gate:

```bash
npm run verify:backend
```

Run the complete production backend activation gate:

```bash
npm run backend:production-readiness:production
```

`verify:backend` now runs:

- schema singularity verification,
- TypeScript verification,
- API security policy smoke verification,
- Auth Activation policy smoke and gate verification,
- local Security & Audit Readiness Gate,
- local Production Backend Readiness Gate,
- final Backend Module Readiness Gate.

## Current Gate Interpretation

The local gate is allowed to pass while still warning about production-only
items. That is intentional.

Local/internal module work may continue only if:

- `npm run verify:backend` passes,
- `npm run smoke:backend` passes after runtime changes,
- `npm run build` passes,
- production-only blockers are not accidentally treated as solved.

Production-live readiness requires the production gate to pass.

## Production-Live Blockers

These are still blockers before real production exposure:

| Blocker | Reason |
| --- | --- |
| Production API auth toggle | The perimeter proxy is built, but production exposure must set `API_AUTH_ENFORCEMENT=required` and use real session roles/tenants. |
| Production rate limiting toggle | The perimeter proxy supports rate limiting, but production exposure must set `RATE_LIMITING_ENABLED=true` and tune the production limits. |
| Production `NEXTAUTH_SECRET` | Production must use a real secret, not the local development fallback. |
| Production `NEXTAUTH_URL` | Production must use an HTTPS non-localhost URL. |
| Production credential mode | Production auth must use `AUTH_CREDENTIALS_MODE=email-allowlist`, an allowlist, and a strong shared secret until external IdP is added. |
| Production role provisioning mode | Production role changes must use `ROLE_PROVISIONING_MODE=governed-admin-only`. |
| Live external action controls | External calls, notice sends, payment captures, and authenticated agency sessions remain blocked until live-action readiness is complete. |

## What Was Hardened In This Pass

The app now has:

- explicit PostgreSQL SSL policy helper:
  - `src/lib/db/postgresSsl.ts`
- database pool SSL wiring:
  - `src/lib/db/index.ts`
- governed NextAuth URL/secret helper:
  - `src/lib/auth/nextAuthSecurity.ts`
- NextAuth route wiring to the governed helper:
  - `src/app/api/auth/[...nextauth]/route.ts`
- governed API security policy:
  - `src/lib/security/apiSecurityPolicy.ts`
- API perimeter proxy for session enforcement, caller-claim conflict checks,
  and rate limiting:
  - `src/proxy.ts`
- API security policy smoke test:
  - `src/scripts/apiSecurityPolicySmokeTest.ts`
- auth activation policy:
  - `src/lib/auth/authActivationPolicy.ts`
- governed role provisioning store:
  - `src/lib/auth/roleProvisioningStore.ts`
- governed role provisioning route:
  - `src/app/api/auth/role-provisioning/route.ts`
- production auth activation gate:
  - `src/scripts/productionAuthActivationGate.ts`
  - `src/scripts/authActivationPolicySmokeTest.ts`
- production backend activation gate:
  - `src/scripts/backendProductionReadinessGate.ts`
  - `.env.production.example`
  - `docs/PRODUCTION_BACKEND_ACTIVATION_RUNBOOK.md`
- backend module readiness gate:
  - `src/scripts/backendModuleReadinessGate.ts`
  - `docs/BACKEND_MODULE_READINESS_DECISION.md`
- automated readiness gate:
  - `src/scripts/securityAuditReadinessGate.ts`
- package commands:
  - `npm run smoke:security-policy`
  - `npm run smoke:auth-activation-policy`
  - `npm run auth:activation`
  - `npm run auth:activation:production`
  - `npm run backend:production-readiness`
  - `npm run backend:production-readiness:production`
  - `npm run backend:module-readiness`
  - `npm run security:audit`
  - `npm run security:audit:production`

## Current Build Decision

The Security & Audit Readiness Gate is complete for governed module work.

The backend foundation may now support module builds that use the verified
internal backend surfaces.

Internal governed workflow modules are allowed after the local gate, API
security policy smoke test, backend smoke, backend module-readiness gate, and
production build pass.

Production-live public modules remain blocked until the production-live
blockers above are resolved.
