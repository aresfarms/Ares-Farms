# Alpha Deployment Runbook

**Status: COMPLETE.** Operational runbook for deploying and operating the
closed, invitation-only Public Alpha. Written for the operator (an
environmental engineer, not a software engineer): every step is explicit.

**Scope:** Public Alpha only — a closed cohort behind an email allowlist, with a
human in the loop at every decision point. This runbook does **not** authorize
production launch, live external fetch, or any autonomous determination. Those
remain governed by the production gate modules (26–41) and stay
BLOCKED_BY_DESIGN until a separate production ceremony.

**Doctrine references**
- Master Volume IV — Operational Runbooks (this document is an Alpha runbook).
- Master Volume III / III-B — Technical Infrastructure & Governance Runtime.
- Master Volume VII — Operational Annex / Public Alpha entry.
- `docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md` — what Alpha is and is not.
- `docs/MODULE_29_DEPLOYMENT_ENVIRONMENT_READINESS_GATE.md` — deployment readiness.
- `docs/governance/VOL_VII_OPERATIONAL_ANNEX.md` — authority roster.
- `docs/governance/PUBLIC_ALPHA_CEREMONY_PART_D.md` — the 2-of-3 founder vote that
  must pass **before** any Alpha cohort is opened.

> **Hard precondition.** Do not execute Section 2 (Deployment procedure) until
> Ceremony Part D records ≥2 founder APPROVE votes. Until then Public Alpha is
> PENDING and no cohort is opened.

---

## 1. Environment inventory

| Item | Alpha value / source | Notes |
|---|---|---|
| Application | Next.js production build (`npm run build` → `npm start`) | App Router; `next.config.mjs` |
| Hosting | Vercel project (the `.vercel` dir is git-ignored) | One Alpha environment, distinct from any production project |
| Runtime Node | Node 20 (matches CI `actions/setup-node` 20) | |
| Database | `DATABASE_URL` — Postgres with `sslmode=verify-full` (or `verify-ca`) | Template: `.env.production.example`. Real value lives in the host secret manager, never in git |
| Public base URL | `NEXT_PUBLIC_BASE_URL`, `NEXTAUTH_URL` | The Alpha domain |
| Auth secret | `NEXTAUTH_SECRET` (≥32 random chars) | Host secret manager only |
| Cohort access | `AUTH_CREDENTIALS_MODE=email-allowlist`, `AUTH_CREDENTIAL_EMAIL_ALLOWLIST=<invited operators>` | The allowlist **is** the closed-cohort gate |
| Role provisioning | `ROLE_PROVISIONING_MODE=governed-admin-only` | No self-provisioning |
| API perimeter | `API_AUTH_ENFORCEMENT=required`, `RATE_LIMITING_ENABLED=true` | |
| Live-action posture | `DRY_RUN=true`, `LEDGER_MODE=OPTION_C`, live fetch = 0 | No real DB writes to external systems, no scrapers, no notices sent |
| Payment connectors | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` **unset** | Held until a separate payment-promotion approval |
| Secrets of record | Host secret manager (Vercel env) + untracked local `.env` | Never commit secrets; `verify:no-personal-docs` + `.gitignore` guard the tree |

**Environment-variable secret custody:** all secrets live in the hosting
provider's secret manager. The local `.env` is git-ignored. No secret is ever
pasted into a tracked file. `.env.production.example` is the only committed
template and contains placeholders only.

---

## 2. Deployment procedure

Precondition: Part D quorum reached (Section above). Operator performs each step
and records the result.

1. **Confirm the source of truth.** `git checkout main && git pull`. Note the
   commit SHA — this is the Alpha-entry commit and goes in the evidence package.
2. **Run the Step 8 gate suite locally** (must all exit 0):
   `npm run verify:human-authority`, `npm run verify:no-personal-docs`,
   `npm run verify:disclosures`, `npm run verify:customer-journey`,
   `npm run build:self-report`, `npm run verify:module-manifests`,
   `npm run build`.
   If any gate exits nonzero, **stop** — do not deploy. Fix on a branch + PR.
3. **Confirm CI is green** on the Alpha-entry commit (GitHub Actions "Verify").
4. **Set environment variables** in the Vercel Alpha project from Section 1.
   Verify `DRY_RUN=true` and the email allowlist contain only invited cohort
   addresses. Confirm `STRIPE_*` are empty.
5. **Deploy** the Alpha-entry commit to the Vercel Alpha environment (production
   deployment of the Alpha project). Record the deployment URL + ID.
6. **Smoke the live deployment:** load `/about`, `/trust`, `/data-rights`,
   `/financing-pathways`, `/readiness`, `/onboarding`, `/portal/borrower`.
   Confirm each renders the canonical surface content and disclosures (the same
   surfaces `verify:customer-journey` audits). Confirm a non-allowlisted email
   cannot authenticate.
7. **Record the Alpha-entry evidence** (Section: Founder notification) and run
   `npm run build-record:archive` to checkpoint the build record.

---

## 3. Rollback procedure

Use when a deployment renders incorrect content, exposes a disclosure gap, or
behaves outside the Alpha boundaries.

1. In Vercel, **promote the previous known-good deployment** (instant rollback to
   the prior immutable build). This is the fastest, lowest-risk action.
2. If rollback is due to a code defect, also **revert on `main`**: open a revert
   PR, let CI go green, and redeploy the reverted commit (do not hand-patch the
   live deployment).
3. Re-run the Section 2 step 6 live smoke against the rolled-back deployment.
4. Notify founders (Section 6) with: what failed, the rollback target deployment
   ID, and the live smoke result.
5. File the incident under `docs/MODULE_18_EXCEPTION_REMEDIATION_RECOVERY.md`
   handling and, if data integrity is in question, follow the Disaster Recovery
   Runbook.

---

## 4. DNS / domain procedure

1. The Alpha domain is attached to the Vercel Alpha project only (never shared
   with a production project).
2. To attach/change: add the domain in the Vercel Alpha project, then create the
   provider DNS record (CNAME/A/ALIAS) the dashboard specifies. Wait for
   propagation; confirm HTTPS certificate issuance succeeds.
3. Update `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` to the final domain and
   redeploy (these are read at build/runtime).
4. **Rollback of DNS:** revert the DNS record to the prior value and re-point the
   domain to the prior deployment. Keep the prior record value recorded before
   any change.
5. Never expose an internal/governance route publicly; the closed cohort reaches
   only the seven customer surfaces + the authenticated borrower portal.

---

## 5. Emergency shutdown procedure

Use to take Alpha offline immediately (suspected data exposure, a live-action
boundary breach, or founder instruction).

1. **Disable the deployment / domain** in Vercel (unassign the domain or disable
   the Alpha project), taking the cohort offline. This is the primary stop.
2. If access must be cut faster than a redeploy, **empty
   `AUTH_CREDENTIAL_EMAIL_ALLOWLIST`** (no one can authenticate) and redeploy, or
   set the project to maintenance.
3. Confirm `DRY_RUN=true` held throughout (no live external action is possible by
   design; verify nothing flipped it).
4. **Notify founders immediately** (Section 6) — emergency shutdown is always a
   founder-notification event.
5. Do not re-open until the cause is understood, a fix is merged + CI-green, and
   founders authorize re-deployment.

---

## 6. Founder notification procedure

Founders of record (per `docs/governance/VOL_VII_OPERATIONAL_ANNEX.md`):
- **Caitlin Hudson** — Chief Governance Authority.
- **Stuart Fraass** — Qualified Governance Reviewer (per AAR-2026-001).
- **Frances Fraass** — Founder.

Notify **all three** on: Alpha open, deployment, rollback, emergency shutdown,
any disclosure-gap or live-action-boundary event, and any disaster-recovery
activation. A notification records: timestamp, the event, the commit/deployment
ID, the operator, the action taken, and the current state (UP / ROLLED BACK /
DOWN). Emergency shutdown and disaster events require acknowledgement from at
least two founders.

---

## 7. Alpha-specific operational boundaries

These boundaries are constitutional and are enforced in code; this runbook does
not relax them:

- **Advisory-only.** No autonomous lending, eligibility, pathway, opportunity,
  certification, onboarding, or readiness determination. A human reviews every
  decision point.
- **Production-blocked / `DRY_RUN=true`.** No live external action, no notice
  send, no payment authorization, no regulatory or public verification.
- **Live fetch = 0.** No scrapers run; no external connector is activated
  (see Build 42 Scraper Coverage audit — readiness only, not activation).
- **Closed cohort.** Access is the email allowlist only; no public sign-up.
- **No information sale, no silent submission, no secret distribution, no
  marketing-lead generation.**
- **Replay-safe / audit-safe.** Every material action is versioned, traceable,
  and reconstructable; build records are checkpointed into the archive.
- Production launch, live scraping, and payment connectors require their own
  separate governance ceremonies and are out of scope for Alpha.
