# NAVIGATOR-CLUSTER-TRIAGE-001

- **Date:** 2026-06-15 · **Base:** `main @ 60f6b7f` · **Mode:** triage only
- **Rules honored:** nothing merged, nothing deleted, no product code changed.
  Diffs inspected against main; this doc is the only artifact.

## Headline

**All six branches forked from a STALE main and cannot be folded as-is.** A
`git diff main..<branch>` for every one is dominated by *deletions of work that
is now on main* (forensics Pass 01/02, break-me, red-team-v3, public-disclaimer,
module-sovereignty, domain/secrets governance). Folding any as-is would **revert**
large amounts of merged work. Main's Navigator has also evolved **past** these
forks (red-team-v3, break-me, hypothesis-002, objective-discovery,
proposed-solution-as-hypothesis all landed on the router afterward) — so main is
the **current preferred Navigator direction**.

The three UX branches are the **old/bad first-touch UX** the triage was warned
not to resurrect. The three 06-14 branches each carry **one genuinely-unique,
not-on-main artifact** worth salvaging (a regression gate / doctrine), but each
must be **re-validated against current main**, never folded wholesale.

---

## Per-branch findings

### 1. build-navigator-conversational-ux — `edddcea`
1. **Hash:** edddcea (forked `b8d1bcb`, 2026-06-12)
2. **Diff vs main:** 44 files, +191/−3875 — almost entirely deletions of merged work; one commit "NAVIGATOR-UX-001 goal-first (presentation only)".
3. **Already on main?** The *direction* is superseded; main's Navigator is newer.
4. **Unique useful content:** none not better-represented by main's current Navigator.
5. **Risks if folded:** reverts all post-06-12 navigator + security work; resurrects old first-touch UX.
6. **Recommendation:** **delete as obsolete.**
7. **Gates if salvaged:** n/a.

### 2. build-navigator-radical-simplification — `bc5b948`
1. **Hash:** bc5b948 (forked `b8d1bcb`, 2026-06-12)
2. **Diff vs main:** 44 files, +181/−3875 — UX-001 + UX-002 (superset of #1, presentation only).
3. **Already on main?** Superseded.
4. **Unique useful content:** none.
5. **Risks if folded:** same mass-revert + bad-UX resurrection as #1.
6. **Recommendation:** **delete as obsolete.**
7. **Gates if salvaged:** n/a.

### 3. build-navigator-foundation — `55d36dc`
1. **Hash:** 55d36dc (forked `b8d1bcb`, 2026-06-12)
2. **Diff vs main:** 45 files, +255/−3937 — UX-001+002+003 "kitchen-table" (superset of #1 and #2).
3. **Already on main?** No — and it **conflicts with the current preferred Navigator**: it predates red-team-v3/break-me/hypothesis/objective-discovery now on main.
4. **Unique useful content:** none salvageable as code; any UX ideas belong in a *fresh* founder-approved UX branch off current main, not this stale tree.
5. **Risks if folded:** largest mass-revert; resurrects the bad card/first-touch UX.
6. **Recommendation:** **delete as obsolete** (the "foundation UI branch conflicts with current direction" — confirmed).
7. **Gates if salvaged:** n/a.

### 4. build-navigator-debug-001 — `4c36037`
1. **Hash:** 4c36037 (forked `253ae4e`, 2026-06-14)
2. **Diff vs main:** appears large, but the **true branch change (forkpoint→branch) is one file:** `src/scripts/verifyNavigator.ts` — adds business-EXPANSION routing regression assertions ("I own a trucking company and want to expand" → routes to question/pathways, a real reply with **no "Something hiccuped" fallback**, carries a `turnIntent`).
3. **Already on main?** **Partially.** Main covers laundromat expansion (verifyNavigator L887/L1250) but has **0 "trucking"/expansion-fallback/turnIntent** assertions of this kind.
4. **Unique useful content:** the no-fallback + turnIntent regression assertions for business-expansion phrasings.
5. **Risks if folded:** none if salvaged as test-only; folding the *branch* would mass-revert.
6. **Recommendation:** **salvage specific file** — port the new assertions into main's `verifyNavigator.ts`, re-validate, then delete the branch.
7. **Gates if salvaged:** `tsc`, `build`, `verify:navigator`, `verify:navigator-red-team-v3`, `verify:break-me` (server-backed).

### 5. build-navigator-refresh-error-001 — `7ba97a6`
1. **Hash:** 7ba97a6 (forked `253ae4e`, 2026-06-14)
2. **Diff vs main:** true branch additions = `src/scripts/verifyNavigatorRefresh.ts` (+63) and `docs/debug/NAVIGATOR_REFRESH_ERROR_001.md`.
3. **Already on main?** **No** — neither the gate nor the doc exists on main.
4. **Unique useful content:** a refresh-survival regression gate + a root-cause doc. The root cause it documents — a corrupted `.next/dev` cache when a production build runs against a live dev server — is **exactly the "Internal Server Error on refresh" we diagnosed and cleared this session** (`rm -rf .next && npm run dev`). Genuinely valuable and current.
5. **Risks if folded:** the gate was written pre-evolution; must be re-validated against a current **production** server (it asserts nonce-CSP + journey-load crash-proofing). Low risk; test/doc-only.
6. **Recommendation:** **salvage specific files** — bring `verifyNavigatorRefresh.ts` + the doc onto main, wire `verify:navigator-refresh`, re-validate against `next start`; then delete the branch.
7. **Gates if salvaged:** `tsc`, `build`, `verify:navigator`, `verify:navigator-refresh` (BASE_URL→prod server), `verify:csp-hydration`.

### 6. build-navigator-first-15-seconds-doctrine — `2698e18`
1. **Hash:** 2698e18 (forked `253ae4e`, 2026-06-14)
2. **Diff vs main:** true branch additions = `docs/doctrine/NAVIGATOR_FIRST_15_SECONDS_001.md` + `src/scripts/verifyNavigatorExperience.ts`.
3. **Already on main?** **No** — the doctrine is only *referenced* in audit/build-47 docs; the doctrine doc and gate are not on main.
4. **Unique useful content:** the first-touch doctrine + an **advisory** experience gate (self-describes as doctrine-only; first-touch source checks are warnings unless `NAV_EXPERIENCE_ENFORCE_SOURCE=1`, so it does **not** force the old UI).
5. **Risks if folded:** low — the gate is deliberately advisory and won't resurrect bad UX; but it asserts a doctrine that should be confirmed against the *current* Navigator direction before any hard enforcement.
6. **Recommendation:** **salvage / keep for later** — bring the doctrine doc + advisory gate onto main as doctrine of record; defer hard UI enforcement to a future founder-approved UX branch off current main.
7. **Gates if salvaged:** `tsc`, `build`, `verify:navigator-experience` (advisory), `verify:navigator`.

---

## Special-focus answers
- **Do not resurrect bad UX/card versions:** confirmed — #1/#2/#3 ARE that old UX → obsolete, do not fold.
- **debug-001 regression tests already on main?** Partially (laundromat yes; trucking-expansion no-fallback/turnIntent **no**) → salvage the gap.
- **refresh-error recovery docs/gates on main?** **No** → salvage (gate + doc).
- **first-15-seconds doctrine on main?** **No** (only referenced) → salvage doctrine + advisory gate.
- **foundation UI branch conflicts with current preferred Navigator?** **Yes** — forked 06-12, predates the merged red-team/break-me/hypothesis/objective work → obsolete.

## Classification summary

| Branch | Hash | Class | Action |
|---|---|---|---|
| build-navigator-conversational-ux | edddcea | obsolete/superseded | delete |
| build-navigator-radical-simplification | bc5b948 | obsolete/superseded | delete |
| build-navigator-foundation | 55d36dc | obsolete/superseded (conflicts w/ current) | delete |
| build-navigator-debug-001 | 4c36037 | partially salvageable | salvage verifyNavigator assertions → delete |
| build-navigator-refresh-error-001 | 7ba97a6 | partially salvageable | salvage gate + doc → delete |
| build-navigator-first-15-seconds-doctrine | 2698e18 | salvageable / keep for later | salvage doctrine + advisory gate |

**Dangerous/stale:** none in the security sense (repo-secret scan clean; no committed
credentials). "Stale" here = forked-before-current-direction, not hazardous.

## Recommended next sequence (separate approved steps — NOT done here)
1. **Salvage pass** (cherry-pick files onto fresh branches off `main @ 60f6b7f`, re-validate):
   - debug-001 → port business-expansion regression assertions into `verifyNavigator.ts`.
   - refresh-error-001 → `verifyNavigatorRefresh.ts` + doc + `verify:navigator-refresh`.
   - first-15-seconds → doctrine doc + advisory `verifyNavigatorExperience.ts`.
2. **Prune** the three obsolete UX branches **with `-D`** (they are NOT merged, so safe `-d` will refuse — deletion requires force and an explicit decision; do not auto-force). After salvage lands, the three salvaged branches become safe-`-d` prunable.

> Note: the three obsolete UX branches carry unmerged commits, so safe `git branch -d`
> will refuse them. Force-deletion (`-D`) is an explicit destructive decision and is
> deliberately deferred to the owner — not performed in this triage.

## Posture
Triage only. Nothing merged, nothing deleted, no product code changed.
**10 blockers OPEN; `combinedProductionReady=false`.**
