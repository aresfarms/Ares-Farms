# Build 42 — CCR Active-Entry Emission in Build Self-Report

**Doctrine:** VIA-GOVERNANCE-CLASSIFICATION-001 (a governance classification
may not be modified solely to pass a gate; `build:self-report` shall emit the
active Classification Change Registry entries on every run so classification /
severity changes are visible in the canonical audit output).

**Master Volume traceability:** Vol III-B (Governance Runtime — deterministic,
replay-safe verification artifacts), Vol V (Canonical Doctrines — classification
governance), Vol VI-A (Founder Governance — VIA-GOVERNANCE-CLASSIFICATION-001).

## Goal

Make `build:self-report` emit the **active** Classification Change Registry
(CCR) entries so classification / severity changes are visible in the canonical
audit output, and fail the report **closed** when the registry cannot be parsed
or an active CCR is incomplete.

## What changed

### 1. Machine-readable `ccr:meta` blocks — `docs/CLASSIFICATION_CHANGE_REGISTRY.md`

Each CCR now carries a machine-readable HTML-comment block directly below its
heading — one `key: value` line per field. The prose narrative remains; the
meta block is the deterministic parse target (the prose field headers vary
between entries, so prose is not parseable). Required fields:

`id`, `title`, `status`, `previousState`, `newState`, `reason`, `approver`,
`effectiveDate`, `resolutionCriteria`. `status ∈ { ACTIVE | RESOLVED | VOIDED }`.

Recorded statuses (honest operational state):

| CCR | Title | Status | Why |
|---|---|---|---|
| CCR-2026-001 | Build 38 Human Authority Severity Reclassification | **RESOLVED** | Resolution criteria met at Build 39 — Annex populated, `verify:human-authority` exits 0. |
| CCR-2026-002 | Environmental Engineering Reviewer Reclassification | **ACTIVE** | Held for Alpha; activates only when an env workflow is featured AND a qualified reviewer is assigned. |
| CCR-2026-003 | Regulatory Liaison Authority reclassification | **ACTIVE** | Held for Alpha; activates when regulatory examination/response capabilities activate. |
| CCR-2026-004 | Source Legal Authority reclassification | **ACTIVE** | Held for Alpha; activates when source legal/licensing review activates. |

CCR-2026-001 (RESOLVED) is emitted as a **historical** entry and does **not**
count as active.

### 2. Parser — `src/lib/build-self-report/classificationChangeRegistry.ts` (new)

- `parseClassificationChangeRegistry(markdown)` — pure; parses the `ccr:meta`
  blocks. The opening delimiter must begin a line, so an inline prose mention of
  the `ccr:meta` token (e.g. the registry's own how-to note) is never parsed as
  a block.
- `loadClassificationChangeRegistry(path)` — reads + parses from disk; a missing
  or unreadable file fails closed.
- Fail-closed rules: malformed meta line, duplicate field, missing `id`, missing
  or invalid `status`, or an **ACTIVE** entry missing any required field → the
  parse fails. RESOLVED / VOIDED entries require `id` + `title` + `status`.
- A registry with **no** `ccr:meta` blocks (or whose only entries are
  RESOLVED / VOIDED) parses cleanly with zero active entries — an empty registry
  is not a failure.

### 3. Runtime — `src/lib/build-self-report/buildSelfReportRuntime.ts`

- New input `classificationChangeRegistryMarkdown?` (and `…Path?`) — when
  provided, the runtime parses the supplied markdown directly (used by the smoke
  test to inject malformed / empty fixtures); otherwise it reads
  `docs/CLASSIFICATION_CHANGE_REGISTRY.md` from the file-system root.
- New result field `classificationChangeRegistry` with `parsed`, `error`,
  `activeEntries[]`, `historicalEntries[]`, `activeCount`, `historicalCount`.
- `exit_code` now includes `!classificationChangeRegistry.parsed` — a parse
  failure fails the report closed.
- New finding category `CLASSIFICATION_REGISTRY_PARSE_FAIL` and cross-source
  conflict `bsr-v1-classification-registry-parse-fail` on parse failure.
- Markdown renderer adds an **`## Active Classification Changes`** section (and a
  **Historical Classification Changes** subsection). On parse failure it renders
  the fail-closed banner.
- Summary gains `classificationChangesActive`, `classificationChangesHistorical`,
  `classificationRegistryParsed`.

### 4. CLI — `src/scripts/buildSelfReportCli.ts`

Console JSON now reports `classificationRegistryParsed`,
`classificationChangesActive`, `classificationChangesHistorical`, and the active
CCR list (id / title / previous → new state / status).

### 5. Smoke — `src/scripts/buildSelfReportSmokeTest.ts`

- Canonical-registry assertions: parses; CCR-2026-002/-003/-004 ACTIVE and in
  `activeEntries[]`; CCR-2026-001 RESOLVED and NOT active; every active entry
  carries the full required field set; markdown renders the section + each id.
- **Malformed CCR fails closed** (active entry missing `reason`; junk meta line;
  invalid status) → `parsed === false`, `exit_code === 1`, parse-fail finding +
  conflict present.
- **Empty registry passes** (empty markdown; and a registry whose only entry is
  RESOLVED) → `parsed === true`, `activeCount === 0`, `exit_code === 0`, no
  parse-fail finding.

## CI

No CI change required — the new tests run under the existing
`smoke:build-self-report` gate (`.github/workflows/ci.yml`). The CLI
(`build:self-report`) and the Next.js production build are unaffected.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run smoke:build-self-report` | PASS — active 3, historical 1, malformedExit 1, emptyExit 0 |
| `npm run build:self-report` | PASS — exit 0; CCR-2026-002/-003/-004 active, CCR-2026-001 resolved |
| `npm run smoke:public-alpha-profile` | PASS (downstream consumer unaffected) |
| `npm run build` | exit 0 |

## Acceptance (per spec)

- [x] `npm run build:self-report` exits 0.
- [x] Report shows CCR-2026-001 (RESOLVED), -002/-003/-004 (ACTIVE) per registry status.
- [x] `build-self-report.json` includes `classificationChangeRegistry.activeEntries[]`.
- [x] `build-self-report.md` includes an "Active Classification Changes" section.
- [x] Registry parse failure → `build:self-report` fails closed.
- [x] Active CCR missing a required field → `build:self-report` fails closed.
- [x] Resolved/voided CCRs emitted separately as historical, not counted active.
- [x] Test proves a malformed CCR fails the report.
- [x] Test proves an empty registry does not fail if no active CCRs exist.
