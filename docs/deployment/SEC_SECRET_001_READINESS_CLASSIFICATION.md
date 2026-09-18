# SEC-SECRET-001 — Readiness Classification (names-only owner checklist)

- **Date:** 2026-06-15 · **Owner:** Caitlin · **Authority:** `SEC_SECRET_001_INVENTORY.md`, `SECRET_REGISTRY`
- **Hard rule:** NAMES ONLY. No values requested, recorded, or provisioned here. This
  classifies *how ready each secret is to be created*, so the owner can sequence the
  Secret Manager provisioning. **SEC-SECRET-001 stays OPEN.**

## Classification legend
- **available now** — a real value already exists somewhere the owner controls; just place it in Secret Manager.
- **generate now** — no dependency; the owner can mint it immediately (random secret, or a free key request).
- **blocked by service setup** — needs an external service/account/domain provisioned first, then becomes generate/available.
- **gated/deferred** — intentionally not provisioned yet (founder/counsel decision).
- **unknown** — cannot classify without owner confirmation.

## The 8 production secrets

| # | Secret (Secret Manager name) | Env alias | Classification | Why / dependency (names only) |
|---|---|---|---|---|
| 1 | `furlong-db-password` | `DATABASE_URL` | **blocked by service setup → then available** | **Neon** can satisfy this: once the Neon Postgres project/branch is created, its pooled connection string IS `DATABASE_URL`. No separate `furlong-db-password` value needed — Drizzle just consumes `DATABASE_URL`. Blocked only until the Neon project exists; then available. |
| 2 | `nextauth-secret` | `NEXTAUTH_SECRET` | **generate now** | No dependency — mint a random high-entropy secret (owner-side). |
| 3 | `auth-credential-shared-secret` | `AUTH_CREDENTIAL_SHARED_SECRET` | **generate now** | No dependency — random shared secret for the operator-wall credentials mode. |
| 4 | `anthropic-api-key` | `ANTHROPIC_API_KEY` | **available now IF a real API key exists, else generate now** | Satisfied **only by an actual Anthropic API key** from the Anthropic Console. A Claude / Claude Code **subscription is NOT an API key** — if no API key has been minted, classify as *generate now* (create one in the console). |
| 5 | `gsa-api-key` | `GSA_API_KEY` | **generate now (free key request)** | Request a free key from the GSA / api.data.gov registration. No paid service setup; treat as generate-now (short request step). |
| 6 | `resend-api-key` | `RESEND_API_KEY` | **blocked by service setup → then generate** | Needs a Resend account (and a verified sending domain for production email). Once the account/domain exist, generate the key. |
| 7 | `stripe-secret-key` | `STRIPE_SECRET_KEY` | **gated/deferred** | Payments are gated (`FINANCING_NODE_LIVE=false`; membership economics unset). Do NOT provision until founders/counsel activate billing. |
| 8 | `stripe-webhook-secret` | `STRIPE_WEBHOOK_SECRET` | **gated/deferred** | Generated only when a Stripe webhook endpoint is configured — which only happens after billing is ungated. Defer with #7. |

## Preview-only (NOT one of the 8 prod secrets)

| Secret | Env alias | Classification | Note |
|---|---|---|---|
| `preview-basic-auth-password` | `PREVIEW_BASIC_AUTH_PASSWORD` | **gated/deferred for prod (unset in prod)** | Preview-environment HTTP Basic wall only. Must remain **UNSET in production**. Generate-now *only* for the preview env if/when a locked preview is stood up. |

## Explicitly NOT app-runtime secrets (do not add to Secret Manager as app secrets)
- **Drizzle** — an ORM, not a secret; it *consumes* `DATABASE_URL` (#1). Nothing to provision.
- **GitHub / Codex / source-control credentials** — developer/CI identities, **not app runtime secrets**. Only relevant if the CI **deploy** path needs them (e.g. a deploy token for the `ci-deployer` identity) — and even then they belong to CI/Workload-Identity config, not the app's runtime secret set. Classify as *out of scope for the 8 app secrets*; revisit under the deploy-pipeline (SA) setup, not here.

## Suggested provisioning order (owner, when ready)
1. **generate now** (no deps): `nextauth-secret`, `auth-credential-shared-secret`, `gsa-api-key`, and `anthropic-api-key` (mint if none).
2. **service-setup then provision:** create Neon project → `DATABASE_URL` (#1); create Resend account + verify domain → `resend-api-key` (#6).
3. **leave gated:** `stripe-secret-key`, `stripe-webhook-secret`, `preview-basic-auth-password` (prod).
4. Place each value in **Secret Manager** (owner-run), rotate one to prove rotation, confirm the Secret Risk Dashboard reflects live state, then human review.

## Posture
Classification only — no values, no provisioning, no service created. `secretsGovernanceVerified()=false`; **SEC-SECRET-001 OPEN**; 10 blockers open; `combinedProductionReady=false`. No DNS / production / financing activation.
