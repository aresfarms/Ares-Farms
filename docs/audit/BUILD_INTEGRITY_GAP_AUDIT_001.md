# BUILD-INTEGRITY-GAP-AUDIT-001

- **Date:** 2026-06-15 · **Scope:** `main @ bc69258` only · **Mode:** read-only audit
- **Hard rules honored:** no fixes (this pass changes nothing but this doc), no
  blocker closure, no production activation, no DNS/secret/financing/routing change.

> Purpose: surface forgotten holes — orphaned branches, unverified assumptions,
> stale blockers, untested routes, missing gates, undocumented production risk.
> Findings are **classified, not fixed.**

## 0. Headline

**No CRITICAL gap found.** Production is correctly fail-closed (10 blockers OPEN,
`combinedProductionReady=false`), internal routes are blocked, the repo secret
scan is clean, and all 15 gates pass. The real remaining work is **owner GCP
infra + recorded human review** (expected), plus **branch hygiene** and one
**missing automated gate** (public-disclaimer sweep).

## 1. Gate battery — 15/15 PASS

| Gate | Result | Notes |
|---|---|---|
| `tsc --noEmit` | ✅ 0 | |
| `npm run build` | ✅ 0 | |
| verify:navigator | ✅ | ownership/steering refusals hold |
| verify:navigator-red-team-v3 | ✅ | all conversational + guardrail rows green |
| verify:break-me | ✅ | 780 variants, 0 breaks |
| verify:repo-secrets | ✅ | 1396 files, 0 live credentials |
| verify:forensic-tamper-test | ✅ | seal detects tamper |
| verify:forensic-evidence-wiring | ✅ | 3/6 wired |
| verify:forensic-pass02 | ✅ | owner attestation partial; classes stay unwired |
| verify:csp-hydration | ✅ | prod nonce mode (run against `next start`) |
| verify:domain-purpose | ✅ | 6 owned domains |
| verify:domain-governance | ✅ | registrar/DNS controls |
| verify:security-governance | ✅ | operator wall + CSRF + headers live-proven |
| verify:security-conformance | ✅ | docs/manifest agree |
| verify:cyber-resilience | ✅ | production_ready=false, 5 SEC blockers open |

## 2. Blocker criteria vs current evidence

10 blockers, **all OPEN**; `combinedProductionReady=false`.

| Blocker | Evidence on hand | Gap to close |
|---|---|---|
| SEC-DR-001 | recovery framework in code | **No DR drill / valid simulation-backed cert** (owner) |
| SEC-BACKUP-001 | backup governance defined | **No immutable Tier-C vault + restore test** (owner) |
| SEC-DNS-001 | registrar/DNS-baseline EVIDENCED (Track A, 2026-06-14) | cutover half: live edge, cert, rollback rehearsal, human sign-off |
| SEC-SECRET-001 | inventory + registry aligned (9 secrets); Secret Manager **enabled**, **no values provisioned** | provision values + rotate one + dashboard reflects live + human review |
| SEC-FORENSICS-001 | 3/6 wired; Pass 02 owner sink attestation **partial**; human-review gate added | complete sink attestation (6 items/sink) → wire 3 → human review |
| REALITY-INPUT/CONTEXT/PRIVACY/OUTPUT-001 | evidence bundle + boards + break-me | **recorded human review** (4/5 have evidence; unsigned) |
| REALITY-URL-001 | controls exist; `CANDIDATE_SOURCES_LIVE=false` | **least evidence** — sandboxed fetcher not built; SSRF unverified vs live fetch |

## 3. Branch inventory & classification

**Merged into `main` — PRUNABLE (22):** build-13-capital-graph,
build-14-customer-type-registry, build-44-a-stewardship, build-44-b-logo-brand,
build-45-customer-landing, build-cop-curated-opportunity-doctrine,
build-discovery-engine, build-domain-asset-governance,
build-domain-governance-002-finalization, build-gcp-nonce-csp-readiness,
build-gcp-operational-blockers-01, build-hypothesis-location-coverage,
build-life-event-resilience-doctrine, build-module-ecosystem-doctrine,
build-objective-discovery-001, build-proposed-solution-hypothesis,
build-sec-forensics-evidence-wiring-01, build-sec-forensics-owner-sink-handoff,
build-sec-forensics-pass02-verify, build-security-cyber-resilience,
build-security-hardening-governance-fort-knox, master-volume-build.
→ all reachable from main; safe `-d` prune in a hygiene pass.

**Unmerged — NEEDS TRIAGE (16):**

| Branch | +ahead | last commit | Likely class |
|---|---|---|---|
| build-navigator-foundation | +3 | 2026-06-14 | **superseded?** navigator is live on main |
| build-navigator-radical-simplification | +2 | 2026-06-14 | **superseded?** |
| build-navigator-conversational-ux | +1 | 2026-06-14 | **superseded?** |
| build-navigator-first-15-seconds-doctrine | +1 | 2026-06-14 | relevant (doctrine) — verify folded |
| build-navigator-debug-001 | +1 | 2026-06-14 | **stale?** debug branch |
| build-navigator-refresh-error-001 | +1 | 2026-06-14 | **stale?** matches the .next 500 we cleared |
| build-filestore-to-postgres | +1 | 2026-06-11 | **relevant** (DB migration, gated) |
| build-gcp-deploy | +1 | 2026-06-10 | **relevant** (infra, gated) |
| build-security-hardening-alpha | +1 | 2026-06-10 | superseded? (fort-knox merged) |
| build-43-alpha-continuity-closure | +2 | 2026-06-05 | obsolete? |
| build-44-onboarding-ux | +1 | 2026-06-05 | obsolete? |
| build-45-universal-exploration-engine | +1 | 2026-06-05 | superseded? (discovery merged) |
| build-42-scraper-coverage-audit | +1 | 2026-06-04 | obsolete? |
| build-39-vol-vi-a-doctrine-annex | +2 | 2026-06-04 | relevant (doctrine annex) — verify |
| classify-dashboard-internal | +1 | 2026-06-05 | superseded? |
| public-alpha-founder-review-package | +1 | 2026-06-05 | obsolete? |

**Dangerous/stale:** none in the secrets sense — `verify:repo-secrets` is clean
across the tree and no branch carries committed credentials. "stale?" above means
*possibly-orphaned work*, not a security hazard. Classification is by age/ahead-
count signal; each `?` needs a one-line owner decision before prune (diffs not
read in this pass).

## 4. Risk-marker scan (TODO/FIXME/HACK/temporary/bypass/unsafe/dev-only)

- **Real TODO/FIXME: 0.** All `HACK`/`XXX` hits are false positives
  (house-hacking copy, GSA "Power Hack Saw" item, the `ledger:event:HACKED`
  tamper fixture, base32 `furlong-XXXX` token template).
- `unsafe-*` hits are CSP tokens (`unsafe-inline`/`unsafe-eval`) in policy code —
  expected, not a risk.
- `eslint-disable`: 20, all benign lint pragmas (`no-img-element`,
  `exhaustive-deps`, `no-explicit-any` in governance v2 pages, `require-imports`
  in scripts). → Low cleanup only.

## 5. `process.env` vs SECRET_REGISTRY

30 distinct `process.env.*` names in `src`. **Every secret-bearing one is in the
registry:** ANTHROPIC_API_KEY, DATABASE_URL (→furlong-db-password), GSA_API_KEY,
NEXTAUTH_SECRET, PREVIEW_BASIC_AUTH_PASSWORD, RESEND_API_KEY. The rest are
**non-secret config flags** (API_AUTH_ENFORCEMENT, RATE_LIMITING_ENABLED,
DISCOVERY_PRIMARY, LEDGER_MODE, NODE_ENV, *_PROFILE, BASE_URL, etc.) or
non-secret addresses (ACCESSIBILITY_FEEDBACK_FROM/TO) or test/dev toggles
(FORCE_FAIL, CSP_HYDRATION_ALLOW_DEV, BREAKME_SEED, PREVIEW_*). **No uncovered
secret. No-action.**

## 6. Public route boundaries

- **Public API reachable:** `api/public/{surfaces,equipment,grants}` → 200.
- **Advisory framing / no-financing-guarantee / no-legal-tax / privacy:** proven
  on the AI **decision surfaces** (navigator + discovery) by verify:navigator,
  verify:navigator-red-team-v3 (48 rows), verify:break-me (780 variants) and the
  claims/conformance gates. Static informational pages (`/about`, `/team`,
  `/trust`, `/accessibility`, …) carry the public watermark/disclaimer via layout.
- **GAP (Medium):** no single automated gate asserts a disclaimer is present on
  **every** public page route — coverage is strong on the surfaces that give
  advice and inferred on static pages. See M1.

## 7. Internal route blocking

- Internal **API** (`api/ledger/admin`, `api/governance/production-release-board`,
  `api/config/change`, `api/connectors/admin`, `api/runtime/transition`) → **401**.
- Internal **pages** (`/internal`, `/dashboard`, `/production-final-authority`,
  `/operator-queue`) → **307** (redirect to auth). Operator wall live-proven by
  verify:security-governance. **No-action.**

## 8. Production gates fail-closed

`combinedProductionReady=false`. `productionReady()` requires every blocker
satisfied **AND** `CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE`; `forensicReadiness
Verified()` now also requires a human-review conjunct (Pass 02); SEC-SECRET keeps
6/9 secrets `vault_backed:false`. All paths fail-closed. **No-action.**

## 9. Security gates wired into package scripts

All audited gates resolve to `verify:*` scripts in `package.json` (forensic-
tamper-test, forensic-evidence-wiring, forensic-pass02, repo-secrets,
domain-purpose, domain-governance, security-governance, security-conformance,
cyber-resilience, navigator, navigator-red-team-v3, break-me, csp-hydration).
**No-action.**

---

## Findings

### CRITICAL
- **None.** No hole that would permit production activation, expose secrets, or
  unblock a gate was found.

### HIGH-RISK (largest blockers-to-close; all owner-side, all expected)
- **H1 — SEC-SECRET-001 unprovisioned.** Secret Manager is enabled in furlong-prod
  but **no values provisioned**; 6/9 registry secrets `vault_backed:false`/rotation
  unknown. Biggest single infra gap. (Owner: provision + rotate + verify.)
- **H2 — SEC-DR-001 / SEC-BACKUP-001 have no executed evidence.** No DR drill, no
  immutable Tier-C restore test on record. (Owner GCP.)
- **H3 — REALITY-URL-001 thinnest.** Sandboxed candidate-source fetcher not built;
  SSRF protection unverified against a live fetch path (`CANDIDATE_SOURCES_LIVE=
  false`). Deferred + gated, but it is the least-evidenced REALITY blocker.

### MEDIUM
- **M1 — No public-disclaimer conformance gate.** Disclaimer presence is asserted
  on AI decision surfaces but not on *every* public page. Recommend a sweep gate.
- **M2 — Navigator branch cluster (7) likely superseded** by the live navigator on
  main; risk of drift/confusion. Triage + prune-or-fold.
- **M3 — 22 merged branches unpruned** — branch-list noise; safe `-d` prune.
- **M4 — Human review unrecorded** for the 4 evidenced REALITY blockers and
  (post-Pass-03) SEC-FORENSICS. Gates exist; sign-off is the missing step.

### LOW cleanup
- **L1 — 20 eslint-disable pragmas** (benign) — optional tidy.
- **L2 — Dev/preview-only env must be UNSET in prod** (CSP_HYDRATION_ALLOW_DEV,
  PREVIEW_BASIC_AUTH_*, FORCE_FAIL). Documented in the GCP runbook; recommend a
  prod-env preflight assertion.
- **L3 — csp-hydration only meaningful in prod mode** — ensure CI starts a
  `next start` server for it (currently a manual prod start).

### NO-ACTION confirmations
- 15/15 gates green · 0 real TODO/FIXME/HACK · no uncovered secret env var ·
  internal routes blocked (401/307) · public API reachable · 10 blockers OPEN ·
  `combinedProductionReady=false` · repo-secrets clean (1396 files) · MV
  traceability dense (503 source files reference a Volume/doctrine).

## Recommended next sequence
1. **Owner infra (unblocks the most):** SEC-SECRET-001 provision+rotate; SEC-DR/
   BACKUP DR-drill + immutable restore test. (Owner GCP; agent verifies after.)
2. **Branch hygiene pass:** prune the 22 merged; triage the 16 unmerged (start with
   the navigator cluster — confirm folded-or-obsolete, then prune).
3. **M1 gate:** build a `verify:public-disclaimer` conformance sweep over all
   `(public)` page routes.
4. **REALITY-URL-001:** design the sandboxed fetcher spec (deferred/gated build).
5. **Record human reviews** where evidence is complete (4 REALITY now; SEC-
   FORENSICS after Pass 03) — each explicit, none automatic.

## Posture
Audit only. No code changed (this doc excepted). 10 blockers OPEN,
`combinedProductionReady=false`, no blocker closed, no production/DNS/secret/
financing/routing change.
