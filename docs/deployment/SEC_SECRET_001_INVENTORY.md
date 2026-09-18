# SEC-SECRET-001 — Names-Only Secret Inventory + Repo-Scan Evidence

> **HARD RULE: NO secret VALUES, hashes, or fragments in this file — names and
> purposes only.** Real provisioning + rotation in GCP Secret Manager is
> **OWNER-RUN** (Caitlin). This pass is the names-only inventory + repo scan; it
> is **necessary but NOT sufficient** to close SEC-SECRET-001. The blocker stays
> **OPEN** until the owner half (§5) is verified.

- **Base:** `main @ 06391f4` · **Branch:** `build-sec-secret-001-evidence`
- **Repo scan:** `verify:repo-secrets` **PASS — 1388 tracked files, 0 live
  credentials** (2026-06-14). `.env.local` untracked + gitignored ✓.
  `.env.production.example` secrets are placeholders/empty ✓.

## Method (authoritative list FROM THE CODE)
Derived by grepping `process.env.*` across `src/`, cross-referencing the
production-readiness gates and `src/security/secretsGovernance.ts` (the in-code
SECRET-GOV-001 registry), and the `.env.production.example` template. Starter
names not referenced anywhere were dropped (SMITHSONIAN_API_KEY, SESSION_SECRET —
**not in code**; FRED — only in the *deferred* financing-node spec, not active).

## 1. Required secrets — names only (NO VALUES)

| Secret NAME | Purpose | Consumer (module/route) | Store | Rotation | Owner | Status |
|---|---|---|---|---|---|---|
| `DATABASE_URL` / `furlong-db-password` | Cloud SQL connection + DB credentials | DB/ledger layer (`writeAuditLedger`, schema) | Secret Manager | 90d | platform-security | needed |
| `NEXTAUTH_SECRET` | Session/auth signing — internal-route sign-in | NextAuth (`nextAuthSecurity`), `proxy.ts` | Secret Manager | 180d | platform-security | needed |
| `AUTH_CREDENTIAL_SHARED_SECRET` | Operator-wall credentials-mode shared secret | operator auth (credentials mode) | Secret Manager | 90d | platform-security | needed |
| `ANTHROPIC_API_KEY` | AI guide (Tier-1) | navigator AI seam | Secret Manager | 90d | platform-security | needed |
| `GSA_API_KEY` | GSA real-estate ingest | `ingestGsaRealEstate` | Secret Manager | 180d | platform-security | needed |
| `RESEND_API_KEY` | Accessibility-feedback email | accessibility feedback route | Secret Manager | 180d | platform-security | needed |
| `STRIPE_SECRET_KEY` | Payments (GATED — not active) | readiness gates; future billing | Secret Manager | 90d | platform-security | needed (gated) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Stripe webhook (gated) | Secret Manager | 90d | platform-security | needed (gated) |
| `PREVIEW_BASIC_AUTH_PASSWORD` | Locked-preview HTTP Basic wall (preview-only, UNSET in prod) | `proxy.ts` preview gate | Secret Manager (preview env) | as-needed | platform-security | needed (preview) |

**Service accounts** (from SECRET-GOV-001 registry; Workload Identity, no
downloaded keys):

| SA | Purpose | Least-privilege | Key rotation |
|---|---|---|---|
| `cloud-run-core` | Core app runtime (`cloudsql.client` only) | required | tracked |
| `cloud-run-jobs` | Scheduled ingest/freshness jobs (separate from core) | required | tracked |
| `ci-deployer` | CI/CD deploy identity | required | tracked |

> Non-secret runtime CONFIG (not in this inventory): `NEXTAUTH_URL`,
> `NEXT_PUBLIC_BASE_URL`, `NODE_ENV`, `API_AUTH_ENFORCEMENT`,
> `RATE_LIMITING_ENABLED`, `AUTH_CREDENTIALS_MODE`, `ROLE_PROVISIONING_MODE`,
> `LEDGER_MODE`, `OPERATOR_MFA_ENFORCED`, `DISCOVERY_PRIMARY`, etc. —
> behavioral flags, not credentials.

## 2. FINDING — in-code registry is narrower than the real secret set
`src/security/secretsGovernance.ts` (`SECRET_REGISTRY`) currently tracks only
`furlong-db-password`, `anthropic-api-key`, `nextauth-secret`. The app actually
reads more secrets (table §1). **Recommendation (owner/security, separate
change — NOT done in this names-only pass):** extend `SECRET_REGISTRY` to cover
`gsa-api-key`, `resend-api-key`, `auth-credential-shared-secret`,
`stripe-secret-key`, `stripe-webhook-secret`, `preview-basic-auth-password`
before closing SEC-SECRET-001, so the Secret Risk Dashboard reflects the full
live set. Editing it changes the blocker gate's required set, so it belongs in
the owner/security half, not here.

## 3. Repo-scan confirmation (hygiene gate) — PASS
- `verify:repo-secrets` → **0 live credentials** across 1388 tracked files.
  Benign allowlisted hits unchanged, each with its written reason (synthetic
  refusal fixture; archived public GSA key in image-rights evidence;
  `.env.production.example` placeholders).
- `.env.local` — **not tracked**, **gitignored** (`.env*` with `!.env.production.example`).
- `.env.production.example` — secrets are placeholders/empty (`DATABASE_URL=…USER:PASSWORD@HOST…`,
  `NEXTAUTH_SECRET=replace-with-…`, `STRIPE_SECRET_KEY=` empty). No real values.
- No `*-service-account.json` tracked.

## 4. What actually closes SEC-SECRET-001 — OWNER HALF (Caitlin, in GCP)
Hand-off checklist (do NOT auto-close):
- [ ] Every §1 secret **provisioned in Secret Manager** (real values, owner-placed) — not env files.
- [ ] A secret / SA key **actually rotated** (observe the rotation, not just a flag).
- [ ] **Secret Risk Dashboard reflects live state** + flags overdue (introduce a stale secret → it surfaces).
- [ ] App reads secrets from Secret Manager at runtime (Workload Identity; no tracked files / downloaded keys).
- [ ] (Recommended) `SECRET_REGISTRY` extended per §2 so the dashboard covers the full set.

## 5. Hard rules / posture
- Names + purposes only; no values/hashes/fragments.
- `.env.local` / service-account JSON / GPG material = owner-held, never committed, never agent-handled.
- Build-agent scope ends here (inventory + scan + commit). Provisioning/rotation is owner-run.
- **SEC-SECRET-001 remains OPEN.** No production activation, no blocker closure, no financing activation, no DNS.
