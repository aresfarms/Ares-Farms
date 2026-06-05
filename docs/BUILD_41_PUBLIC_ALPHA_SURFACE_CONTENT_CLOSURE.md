# Build 41 — Public Alpha Surface Content Closure

**Status:** ✅ **CLOSED.** All four acceptance commands exit 0.
**Source of truth:** `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md`
**Registry:** `src/lib/customer-journey/publicAlphaSurfaceContent.ts`
**Gate:** `src/scripts/verifyCustomerJourney.ts` → `npm run verify:customer-journey`

This document closes Build 41 by documenting the seven page edits that drop the canonical content per `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md` onto the customer-facing routes. Step 6 and Step 7 of the Public Alpha Execution Runbook are now satisfied at the code level.

---

## Routes updated

| Ordinal | Route | File | Section added |
|---|---|---|---|
| 1 | `/about` | `src/app/about/page.tsx` | Founder introduction — tagline (`Compass to Capital`), founder mission, 5 negations, 6 affirmations |
| 2 | `/trust` | `src/app/trust/page.tsx` | Trust posture — foundational principle, 10 will-do, 12 will-not-do, trust principle |
| 3 | `/data-rights` | `src/app/data-rights/page.tsx` | Data transparency — foundational statement, what is collected/why/how-used/shared/not-shared, 5 customer rights, verbatim deletion language |
| 4 | `/financing-pathways` | `src/app/financing-pathways/page.tsx` | Pathway discovery (likely / excluded / rationale) + 6 financing reality classifications. No approval language. |
| 5 | `/readiness` | `src/app/readiness/page.tsx` | Readiness review — indicators, missing items, documentation recommendations, human review notice |
| 6 | `/onboarding` | `src/app/onboarding/page.tsx` | Customer project intake — 4 verbatim intake questions |
| 7 | `/portal/borrower` | `src/app/portal/borrower/page.tsx` | Human escalation — 4-stage escalation, 5 reviewer roles (sourced from Vol VII Operational Annex + Module 45), next-step guidance |

Each insertion is a single `<section>` block placed at the top of the page's primary container, before any existing UI. The block carries an `aria-label` describing its role and a code comment citing `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route N` plus the canonical source doctrine.

---

## Disclosures rendered visible-on-render

Every required Module 44 disclosure for each route renders in the initial paint — not behind a click, accordion, tab, modal, hover, or scroll-into-view event. The gate verifies this by reading the raw `page.tsx` source and matching the canonical `semantic_tokens` from the Module 44 disclosure registry directly against the file text.

Disclosure coverage per route (gate report):

| Route | Required | Present | Status |
|---|---|---|---|
| `/about` | 4 | 4 | PASS |
| `/trust` | 8 | 8 | PASS |
| `/data-rights` | 4 | 4 | PASS |
| `/financing-pathways` | 4 | 4 | PASS |
| `/readiness` | 3 | 3 | PASS |
| `/onboarding` | 4 | 4 | PASS |
| `/portal/borrower` | 3 | 3 | PASS |
| **Total** | **30** | **30** | **PASS** |

---

## Customer journey dimensions covered

| Section | Route(s) | Dimensions in this PR |
|---|---|---|
| §1 Founder Introduction | `/about` | tagline + founder mission + customer promise (5 negations + 6 affirmations) |
| §2 Customer Project Intake | `/onboarding` | 4 intake questions verbatim |
| §3 Pathway Discovery | `/financing-pathways` | likely / excluded pathways + rationale; no approval language permitted |
| §4 Readiness Review | `/readiness` | readiness indicators + missing items + documentation recommendations + human review notice |
| §5 Financing Reality Classification | `/financing-pathways` | 6 classifications (likely financeable / financeable with conditions / specialist review required / limited financing market / cash-favored transaction / not enough information) |
| §6 Human Escalation | `/portal/borrower` | 4-stage escalation + 5 reviewer roles + next-step guidance |
| §7 Data Transparency | `/data-rights` | 5 mandatory items + 5 customer rights + verbatim deletion language |
| Trust posture (cross-cutting) | `/trust` | 10 "Furlong will" + 12 "Furlong will not" + trust principle + foundational principle |

The verbatim deletion language on `/data-rights` matches Data Transparency Doctrine §What Furlong Will Do (item 7): delete from the live system, preserve only the audit log required for regulatory traceability, explain when information can be deleted.

---

## Acceptance command outputs

```
$ npm run verify:disclosures          # exit 0
  externalSurfaceCount: 27
  disclosurePassCount: 27
  totalRequiredDisclosureChecks: 117 / 117 present
  exitCode: 0

$ npm run verify:customer-journey     # exit 0
  sectionsPass: 7 / 7
  sectionsFail: 0
  exitCode: 0
  message: verify:customer-journey PASS — all 7 customer-facing routes
           carry the canonical surface content.

$ npm run build:self-report           # exit 0
  modulesAudited: 103
  modulesPass: 34
  modulesPassWithWarnings: 40
  modulesFail: 0
  modulesBlockedByDesign: 29
  crossSourceConflictCount: 0
  exitCode: 0

$ npm run build                       # exit 0
  ✓ Compiled successfully
```

`npx tsc --noEmit` also clean.

---

## Implementation rules adherence

| Rule | Adherence |
|---|---|
| 1. Do not invent new doctrine | ✅ Every block is a verbatim or near-verbatim quotation of an already-codified doctrine. See `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md` for the per-block source citation. |
| 2. Copy the route-specific content from `PUBLIC_ALPHA_SURFACE_CONTENT.md` | ✅ Each page renders the §Route N block as written |
| 3. Required disclosures must render visible-on-render | ✅ Every required disclosure appears in the initial `<section>` block, no click, no accordion |
| 4. Do not hide disclosures behind accordions, tabs, modals, hover states, or click events | ✅ All blocks are direct children of the route's primary container; no state-gated containers |
| 5. Preserve advisory-only / no-approval / no-guarantee / not-a-lender language | ✅ "advisory only and is not an approval, guarantee, or official determination" appears verbatim on every relevant route |
| 6. Preserve data-rights language | ✅ `/data-rights` includes the 5 customer rights verbatim + the verbatim deletion language |
| 7. Preserve the four escalation stages (Exploration → Human Review → Lender Engagement → Application Submission) | ✅ All four appear on `/portal/borrower` |
| 8. Use plain English | ✅ No legal / regulatory jargon in the customer-facing blocks |
| 9. No prohibited claims (approved / guaranteed / eligible / pre-approved / official determination / AI decided) | ✅ Module 44 prohibited-claims corpus passes for all 27 external surfaces (0 unexempted violations). `/financing-pathways` §3 banned-token check passes (0 banned hits). |
| 10. Keep all customer-facing claims advisory and non-determinative | ✅ Every block carries the advisory disclosure paragraph at the bottom |

---

## Remaining limitations

These are honest gaps that this PR **does not close** — they are operational or out-of-scope concerns to address before Public Alpha actually opens:

1. **Visual / UX polish.** The dropped content blocks use minimal inline styles to render the canonical text correctly. Designers will likely refine typography, color, and layout. Any future styling change MUST keep the canonical text visible-on-render and must keep all required tokens in the source — the gate re-runs on every change.

2. **Translation / localization.** All canonical text is in English. Plain-English requirement per Data Transparency Doctrine is satisfied for English speakers. Non-English customers are out of scope for Alpha.

3. **Authority names not embedded in `/portal/borrower`.** The page renders the five reviewer **roles** but does not embed the named individuals (Caitlin / Stuart / Frances). Per the Vol VII Operational Annex, named individuals surface on request via `REQUEST_HUMAN_REVIEW`. The Annex itself (PR #29) records the names.

4. **Per-reviewer escalation flow not exercised.** This PR proves the content is rendered. End-to-end escalation through each of the five reviewer paths is a separate Alpha test and lands in Step 8 (whole-platform verification).

5. **Build 38 broader customer journey audit (`verify:customer-journey-audit`)** still reports `alpha_journey_ready: FAIL` because it adds dimensions beyond Step 7's surface-content check (customer success criteria with §9 sign-off requirements, etc.). The runbook Step 7 explicitly uses `verify:customer-journey` (the Build 41 gate), which now exits 0. The broader audit closes at Step 9.

6. **PR #29 (Build 39 — Vol VI-A doctrine + Annex)** must merge before `verify:human-authority` exits 0 on `main`. This PR (Build 41) is independent of that merge and can ship without it.

---

## Verification outputs (full)

`docs/build-records/2026-06-05/customer-journey.json` — per-route audit detail (every section PASS).
`docs/build-records/2026-06-05/disclosure-audit-gate.json` — 27/27 external surfaces, 117/117 disclosure checks present.
`docs/build-records/2026-06-05/build-self-report.{json,md}` — 103 modules · 34 PASS · 40 PASS_WITH_WARNINGS · 0 FAIL · 29 BLOCKED_BY_DESIGN · 0 cross-source conflicts.

---

## What still needs to happen for Public Alpha to actually open

| Step | State |
|---|---|
| Step 0–4 (Vol VI-A doctrine + Annex + `verify:human-authority` exit 0) | ⏳ PR #29 carries this; merges independently |
| Step 5 (technical continuity artifacts) | ⏳ separate review |
| **Step 6 (surface content on 7 pages)** | ✅ **this PR** |
| **Step 7 (`verify:customer-journey` exit 0)** | ✅ **this PR** |
| Step 8 (whole-platform verification green on main) | ⏳ requires #29 merged + this PR merged |
| Step 9 (Ceremony Part D — 2-of-3 founder vote) | ⏳ |

**With PR #29 + this PR merged, the only remaining items are the founder ceremony and the operational verifications.** All four code-side acceptance commands are green at this branch HEAD.

---

## Constitutional posture preserved

- Sourced only — every block carries its `sourceDoctrine` field in the registry, and the page comment cites the corresponding §Route N in `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md`.
- Visible-on-render — every required disclosure and every required content block renders without user interaction.
- Negation-aware — `/financing-pathways` may say "Furlong does NOT approve" (compliant); the regex skips negated contexts.
- Replay-safe — same commit + same registry + same pages → same audit. Deterministic.
- Audit-safe — every finding (none on this branch) would carry route, ordinal, category, source-doctrine citation.
- Per-route doctrine traceability — every required content block and every required disclosure carries its registry citation.
