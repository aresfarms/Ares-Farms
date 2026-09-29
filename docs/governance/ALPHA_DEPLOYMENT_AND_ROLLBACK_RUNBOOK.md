# Alpha Deployment & Rollback Runbook

**Status: COMPLETE for Alpha entry.** Operational runbook for standing up,
deploying, rolling back, and shutting down the closed, invitation-only Public
Alpha. Written for the operator (an environmental engineer, not a software
engineer): every step is explicit.

**Mark:** Internally Verified — Independent Verification Pending (VIA-AUDIT-001 /
VIA-AUDIT-EXCEPTION-001: the builder is not the independent verifier).

**Scope:** Public Alpha only — a closed cohort behind an email allowlist, with a
human in the loop at every decision point. This runbook does **not** authorize
production launch, live external fetch, or any autonomous determination.

**Doctrine references**
- Master Volume IV — Operational Runbooks.
- Master Volume III / III-B — Technical Infrastructure & Governance Runtime.
- Master Volume VII — Operational Annex / Public Alpha entry.
- `docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md` — what Alpha is and is not.
- `docs/MODULE_29_DEPLOYMENT_ENVIRONMENT_READINESS_GATE.md`.
- `docs/governance/ALPHA_KEY_CUSTODY_AND_DISASTER_RECOVERY_RUNBOOK.md` — recovery.
- `docs/governance/PUBLIC_ALPHA_CEREMONY_PART_D.md` — the 2-of-3 founder vote.

> **Hard precondition.** Do not deploy a cohort-facing environment until Ceremony
> Part D records ≥2 founder APPROVE votes. Until then Public Alpha is PENDING and
> no cohort is opened.

---

## 1. Alpha environment boundary

- A **single** Alpha environment (Vercel project; `.vercel` is git-ignored),
  isolated from any production project. It serves only the seven customer
  surfaces + the authenticated borrower portal to the allowlisted cohort.
- Posture is fixed: `DRY_RUN=true`, `LEDGER_MODE=OPTION_C`, live fetch = 0,
  `STRIPE_*` unset, `AUTH_CREDENTIALS_MODE=email-allowlist`,
  `ROLE_PROVISIONING_MODE=governed-admin-only`. Secrets live only in the host
  secret manager (template: `.env.production.example`); never in git.
- **No public/production claims beyond Alpha scope.** The Alpha environment makes
  no approval, denial, lender-commitment, agency, certification, public- or
  regulatory-verification claim. It is advisory-only and clearly labeled Alpha.

## 2. Deployment owner

- **Operator of record:** the deploying operator (records each step).
- **Authority:** Chief Governance Authority (Caitlin Hudson) authorizes the
  deploy; Part D quorum is the precondition. Founders of record: Caitlin Hudson
  (Chief Governance Authority), Stuart Fraass (Qualified Governance Reviewer),
  Frances Fraass (Founder).

## 3. Pre-deploy checks

1. Part D quorum reached (≥2 APPROVE). If not, **stop**.
2. `git checkout main && git pull`; record the Alpha-entry commit SHA.
3. Run the Step 8 gate suite locally — all must exit 0:
   `npm run verify:human-authority`, `npm run verify:no-personal-docs`,
   `npm run verify:disclosures`, `npm run verify:customer-journey`,
   `npm run build:self-report`, `npm run verify:module-manifests`,
   `npm run build`.
4. Confirm CI "Verify" is green on the Alpha-entry commit.
5. Confirm env vars in the Vercel Alpha project: `DRY_RUN=true`, allowlist =
   invited cohort only, `STRIPE_*` empty, `DATABASE_URL` uses `sslmode=verify-full`.

## 4. Deployment procedure

1. Set/confirm environment variables (Section 1) in the Vercel Alpha project.
2. Deploy the Alpha-entry commit to the Vercel Alpha environment. Record the
   deployment URL + ID.
3. Run post-deploy verification (Section 9).
4. Live smoke the seven surfaces (`/about`, `/trust`, `/data-rights`,
   `/financing-pathways`, `/readiness`, `/onboarding`, `/portal/borrower`):
   each renders the canonical content + disclosures; a non-allowlisted email
   cannot authenticate.
5. Notify founders (Section 10). Archive the Alpha-entry evidence
   (`npm run build-record:archive`).

## 5. Rollback procedure

1. In Vercel, **promote the previous known-good immutable deployment** (instant
   rollback). Fastest, lowest risk.
2. If the cause is a code defect, also **revert on `main`** via a revert PR (let
   CI go green) and redeploy the reverted commit — never hand-patch the live
   deployment.
3. Re-run post-deploy verification (Section 9) against the rolled-back deploy.
4. Notify founders (Section 10) with: what failed, the rollback target deploy ID,
   and the verification result.

## 6. Emergency shutdown procedure

1. **Disable the deployment / unassign the domain** in Vercel — cohort offline.
2. If access must be cut faster than a redeploy, **empty
   `AUTH_CREDENTIAL_EMAIL_ALLOWLIST`** and redeploy (no one can authenticate).
3. Confirm `DRY_RUN=true` held throughout.
4. Notify founders immediately (Section 10) — emergency shutdown is always a
   founder-notification event.
5. Do not re-open until the cause is understood, a fix is merged + CI-green, and
   founders authorize re-deployment.

## 7. DNS / domain change rule

1. The Alpha domain attaches to the Vercel Alpha project only (never shared with
   a production project).
2. Record the prior DNS value before any change. Add the domain in Vercel, create
   the provider DNS record it specifies, await propagation + certificate.
3. Update `NEXT_PUBLIC_BASE_URL` / `NEXTAUTH_URL` to the final domain; redeploy.
4. **DNS rollback:** restore the recorded prior value and re-point to the prior
   deployment.

## 8. Incident trigger conditions

Open an incident (and notify founders) on any of: a disclosure gap on a live
surface, any live-action / `DRY_RUN` breach, access by a non-allowlisted party,
data exposure, a failed post-deploy verification, or a rollback. Data-integrity
incidents follow the Key Custody & Disaster Recovery Runbook.

## 9. Post-deploy verification

Run after every deploy/rollback (all must pass):

```
npm run verify:human-authority
npm run verify:no-personal-docs
npm run verify:disclosures
npm run verify:customer-journey
npm run build:self-report
npm run build
```

Plus the live surface smoke (Section 4 step 4). Any failure → roll back.

## 10. Founder notification procedure

Notify **all three** founders (Caitlin Hudson, Stuart Fraass, Frances Fraass) on:
Alpha open, deploy, rollback, emergency shutdown, any disclosure-gap or
live-action event, and any incident. Each notification records: timestamp, event,
commit/deployment ID, operator, action taken, current state (UP / ROLLED BACK /
DOWN). Emergency shutdown and data-integrity incidents require acknowledgement
from at least two founders before re-open.
