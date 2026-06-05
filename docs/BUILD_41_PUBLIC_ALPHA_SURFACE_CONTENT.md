# Build 41 — Public Alpha Surface Content (Track 2)

**Runbook position:** Track 2 of the Public Alpha Execution Runbook — Steps 6 + 7. Final code gate before Ceremony Part D.
**Doctrine:** `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md` (synthesis-only, sourced from existing doctrine — no new claims).
**Registry:** `src/lib/customer-journey/publicAlphaSurfaceContent.ts`
**Gate CLI:** `src/scripts/verifyCustomerJourney.ts` → `npm run verify:customer-journey`
**Audit CLI (Build 38 broader audit, preserved):** `npm run verify:customer-journey-audit`
**Sibling builds:** Build 38 Customer Journey audit · Build 36 Module 45 · Build 37 Module 44 · Build 39 Vol VI-A doctrine + Annex.

---

## Why this build exists

Per the runbook:
> **STEP 6 — Drop in the surface content.** Add each route's copy from `PUBLIC_ALPHA_SURFACE_CONTENT.md`: `/about`, `/trust`, `/data-rights`, `/financing-pathways`, `/readiness`, `/onboarding`, `/portal/borrower`. Disclosures must render visible-on-render (not behind a click). Confirm `/data-rights` deletion language matches Data Transparency Doctrine.
>
> **STEP 7 — Run the content gates.** `verify:disclosures` exit 0 · `verify:customer-journey` exit 0 (7 routes content-complete).

Build 41 ships the canonical surface content as a registry + the `verify:customer-journey` gate. The actual surface-text drops into the seven `page.tsx` files land separately — when they land, the gate progressively flips to exit 0 and the Alpha path is open.

---

## What ships

### 1. `docs/PUBLIC_ALPHA_SURFACE_CONTENT.md` — canonical doctrine doc
Per-route content blocks for the seven customer-facing routes. Every block carries its source doctrine — nothing invented. Includes the visible-on-render disclosure list per route, the banned tokens for `/financing-pathways`, and the verbatim deletion language for `/data-rights`.

### 2. `src/lib/customer-journey/publicAlphaSurfaceContent.ts` — registry
Machine-readable mirror of the markdown. Exports:
- Constants: `CUSTOMER_PROMISE_TAGLINE`, `CUSTOMER_PROMISE_NEGATIONS` (5), `CUSTOMER_PROMISE_AFFIRMATIONS` (6), `FINANCING_REALITY_CLASSIFICATIONS` (6), `CUSTOMER_RIGHT_IDS` (5), `CUSTOMER_PROJECT_INTAKE_QUESTIONS` (4), `FOUR_STAGE_ESCALATION` (4), `FURLONG_WILL_DO` (10), `FURLONG_WILL_NOT_DO` (12), `VERBATIM_DELETION_LANGUAGE_MARKERS`, `PATHWAY_DISCOVERY_BANNED_TOKENS`.
- `PUBLIC_ALPHA_SURFACE_SECTIONS` — array of 7 `SurfaceSection` entries, each with: route, ordinal, doctrine label, `pageFilePath`, required content patterns (with source doctrine per requirement), required Module 44 disclosure IDs, banned tokens.
- `publicAlphaSurfaceContentLineage()` — version + counts.

Customer-facing pages can import the constants directly, ensuring the page renders exactly what the gate audits.

### 3. `src/scripts/verifyCustomerJourney.ts` — the Step 7 gate
Reads each route's `page.tsx` from disk and audits five checks per route:

1. **route_loads** — `page.tsx` exists.
2. **required content tokens** — every pattern in the registry matches the rendered text.
3. **Module 44 disclosures** — every required disclosure_id is present in the disclosure audit pack for the route's module.
4. **banned tokens** — `/financing-pathways` has no unexempted-by-negation approval language.
5. **verbatim deletion language** — `/data-rights` matches the Data Transparency Doctrine deletion block.

**Fail-closed mirrors Build 40:**
- Registry empty → fail (`REGISTRY_VACUOUS`).
- Page file missing → fail (`ROUTE_LOAD_FAIL`).
- Required token missing → fail (`REQUIRED_CONTENT_MISSING`).
- Required disclosure missing → fail (`DISCLOSURE_MISSING`).
- Banned token unexempted → fail (`BANNED_TOKEN_PRESENT`).
- Exit 0 only when all 7 routes pass all 5 checks.

Per-route attribution and missing-item lists are recorded in `docs/build-records/<date>/customer-journey.json`.

### 4. `docs/BUILD_41_PUBLIC_ALPHA_SURFACE_CONTENT.md` — this doc

### 5. `package.json` — npm scripts
- `npm run verify:customer-journey` → new Step 7 gate (this build).
- `npm run verify:customer-journey-audit` → preserves the Build 38 broader customer journey audit (sections + success questions + customer promise + financing reality), renamed for clarity.

---

## Baseline at issuance

```
sectionsPass: 0
sectionsFail: 7
totalRequiredContentBlocks: 53
totalContentTokensPresent: <baseline incomplete>
totalContentTokensMissing: <baseline incomplete>
totalRequiredDisclosures: 25
totalDisclosuresPresent: <some, varies by route>
totalDisclosuresMissing: <some>
totalBannedTokenViolations: 0
exitCode: 1
```

This is the honest baseline. Every route loads (Build 38 created stubs). What's missing is the canonical surface content text. Future commits add that text and the gate progressively flips toward exit 0. Same honest-baseline pattern as Module 45 (gate exits 1 until access-control records role fills) and Build 38 customer journey (gate exits 1 until surface content lands).

---

## How the gate moves from exit 1 to exit 0

For each of the seven routes:

1. Open the `page.tsx` file referenced by the registry.
2. Import the canonical constants from `@/lib/customer-journey/publicAlphaSurfaceContent`.
3. Render the required content blocks visibly on initial paint (no click required). Use the constants directly so the page text and the gate stay in sync.
4. Confirm the visible-on-render disclosures from Module 44 land for the route's surface class (Module 44 already reports this via `composeDisclosureAuditGate`).
5. Re-run `npm run verify:customer-journey`.

The gate's `findings` list per run shows exactly which tokens and disclosures are missing per route.

---

## Verification (this PR)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run verify:customer-journey` | exit 1 — **correct honest baseline** (registry shipped; surface text not yet on pages). Gate self-asserts: refuses to declare PASS without inspecting at least 7 sections + content + disclosures. |
| `npm run verify:customer-journey-audit` (Build 38, preserved) | unchanged |
| `npm run verify:disclosures` | unchanged (Module 44 already green) |
| `npm run verify:no-personal-docs` (when Build 40 merges) | unchanged |
| `npm run smoke:public-alpha-customer-journey` (Build 38) | unchanged |
| `npm run verify:module-manifests` | PASS |
| `npm run build` | PASS |

---

## Doctrine traceability

| Surface content block | Source doctrine |
|---|---|
| `Compass to Capital` tagline | Customer Journey §Customer Promise |
| 5 negations / 6 affirmations | Customer Journey §Customer Promise |
| `Your information belongs to you` | Data Transparency §Foundational Principle |
| 10 will-do / 12 will-not-do | Data Transparency §What Furlong Will Do / §What Furlong Will Not Do |
| Trust principle | Data Transparency §Trust Principle |
| 5 customer rights | Data Transparency Posture Runtime v1 |
| Verbatim deletion language | Data Transparency §What Furlong Will Do (item 7) |
| 6 financing reality classifications | Customer Journey §5 |
| Pathway discovery categories + no-approval ban | Customer Journey §3 |
| Readiness 3 sections + human-review notice | Customer Journey §4 |
| 4 intake questions | Customer Journey §2 |
| 4-stage escalation | Data Transparency §Escalation Control |
| Reviewer roles | Vol VII Operational Annex + Module 45 |
| Next-step guidance | Customer Journey §6 |
| Module 44 disclosure IDs per route | Module 44 §2 |

No new doctrine introduced.

---

## Constitutional posture

- **Sourced only.** Every required block has a `sourceDoctrine` field.
- **Anti-vacuous-pass invariant.** Gate refuses PASS on an empty registry or 0 scanned sections.
- **Visible-on-render.** Disclosures must appear in initial paint.
- **Negation-aware banned-token detection.** `/financing-pathways` may say "Furlong does NOT approve" — that's compliant; the regex skips negated contexts.
- **Audit-traced.** Every finding carries route, ordinal, category, source-doctrine citation.
- **Replay-safe.** Deterministic over the working tree at HEAD; same commit + same registry + same pages → same audit.

---

## What still needs to happen for Alpha to actually open

| Step | Status |
|---|---|
| Step 0 — commit Vol VI-A doctrine + Annex | ⏳ PR #29 open |
| Step 1 — populate Vol VII Annex | ⏳ PR #29 open |
| Step 2 — wire traceability (partial via Module 45) | partial; CCR active-entry emission in Build 34 still pending |
| Step 3 — `verify:human-authority` exit 0 | ✅ once #29 merges |
| Step 4 — exception review owners (Stuart + Frances) | ✅ recorded in PR #29 |
| Step 5 — technical continuity artifacts | ⏳ separate review |
| **Step 6 — drop surface content into 7 pages** | ⏳ Build 41 ships the registry; page-text drops land in follow-up commits |
| **Step 7 — `verify:customer-journey` exit 0** | ⏳ gates exit 1 until Step 6 lands |
| Step 8 — whole-platform verification green | ⏳ |
| Step 9 — Ceremony Part D (2-of-3 founder vote) | ⏳ |

PR #29 + Build 41 + the seven page-content drops + the ceremony = Public Alpha open.
