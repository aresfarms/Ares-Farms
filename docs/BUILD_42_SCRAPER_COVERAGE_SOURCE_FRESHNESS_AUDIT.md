# Build 42 — Scraper Coverage & Source Freshness Audit

**Doctrine:** `docs/DOCTRINE_SCRAPER_COVERAGE_SOURCE_FRESHNESS_V1.md`
**Runtime:** `scraper-coverage-audit-runtime-v0.1.0`
**Master Volume traceability:** Vol II (source authority), Vol III (source
connectors), Vol III-B (governance runtime), Vol V (provenance; live-fetch = 0).

## Goal

Answer whether Furlong has the required scrapers, whether they extract the
correct fields, whether they run on schedule, and whether failures are visible —
**without activating live scraping.**

## What changed

### New files

| File | Role |
|---|---|
| `src/lib/source-audit/scraperSourceRegistry.ts` | Canonical declaration of the 5 required scrapers, the alpha-required families/routes, required provenance fields, and the (empty) live-fetch authorization list. |
| `src/lib/source-audit/scraperCoverageAuditRuntime.ts` | The audit: registry-readiness layer + per-observation freshness/schema layer. Emits headline counts, per-source verdicts, and findings. |
| `src/scripts/verifyScraperCoverage.ts` | `verify:scraper-coverage` gate — registry-readiness audit (no observations), exits non-zero on any FAIL. |
| `src/scripts/scraperCoverageSmokeTest.ts` | `smoke:scraper-coverage` — proves the baseline PASS and every required failure case fails closed. |
| `docs/DOCTRINE_SCRAPER_COVERAGE_SOURCE_FRESHNESS_V1.md` | Canonical doctrine (synthesis from the Master Volumes). |

### npm scripts (`package.json`)

```json
"verify:scraper-coverage": "tsx src/scripts/verifyScraperCoverage.ts",
"smoke:scraper-coverage": "tsx src/scripts/scraperCoverageSmokeTest.ts"
```

### CI (`.github/workflows/ci.yml`)

Two steps added after the personal-document guard:

```yaml
- name: Scraper coverage and source freshness audit
  run: npm run verify:scraper-coverage

- name: Scraper coverage smoke test
  run: npm run smoke:scraper-coverage
```

## The registry

5 scrapers: 3 alpha-required (USDA, SBA program references; property discovery),
2 held-for-Alpha (county records; environmental source). Alpha-required families
(`USDA_PROGRAMS`, `SBA_PROGRAMS`, `PROPERTY_DISCOVERY`) and routes
(`/financing-pathways`, `/readiness`) are declared **independently** of the
registry array, so removing a scraper surfaces a coverage gap rather than
silently deleting the requirement.

## Audit semantics

- **Registry readiness** (always): coverage by family + route, expected fields,
  authority tier, non-held freshness window for alpha-required sources,
  provenance fields, live-fetch posture, held-reason presence.
- **Runtime observation** (only when a scraper reports a run): missing last run
  (WARN for static reference, FAIL for runtime/dynamic), staleness, zero
  records, schema mismatch, source-shape change, suppressed extractor error.
- Findings carry a bucket (`COVERAGE` / `SCHEMA` / `FRESHNESS` / `LIVE_FETCH`)
  feeding the headline counts. Any FAIL → `exitCode = 1`; WARN does not fail.
  Every finding resolves to `REQUIRES_HUMAN_REVIEW`.

## `verify:scraper-coverage` baseline output

```json
{
  "ok": true,
  "runtimeVersion": "scraper-coverage-audit-runtime-v0.1.0",
  "registeredScraperCount": 5,
  "alphaRequiredCount": 3,
  "heldForAlphaCount": 2,
  "coverageMissingCount": 0,
  "schemaFailureCount": 0,
  "freshnessFailureCount": 0,
  "liveFetchViolationCount": 0,
  "findings": [],
  "exitCode": 0
}
```

## Constitutional posture

Build 42 does **not** activate live scraping. It audits scraper readiness,
coverage, schema expectations, source authority, freshness rules, held status,
and provenance requirements. Live fetch remains disabled
(`liveFetchDisabled = true`, `liveScrapingActivated = false`,
`noAutonomousScraping = true`, `noLiveExternalAction = true`) unless a later
governance decision explicitly authorizes a specific scraper.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run smoke:scraper-coverage` | PASS — baseline 0; every failure case exits 1; authorized/static cases exit 0 |
| `npm run verify:scraper-coverage` | PASS — 5 registered / 3 alpha-required / 2 held; zero findings |
| `npm run verify:module-manifests` | PASS |
| `npm run build:self-report` | PASS |
| `npm run build` | exit 0 |

## Smoke coverage (failure cases proven)

- missing USDA scraper → FAIL (`COVERAGE_MISSING`)
- alpha-required scraper with no expectedFields → FAIL (`MISSING_EXPECTED_FIELDS`)
- HELD_FOR_ALPHA without heldReason → FAIL (`HELD_WITHOUT_REASON`)
- liveFetchAllowed=true without authorization → FAIL (`LIVE_FETCH_VIOLATION`);
  with governance authorization → PASS
- expected field missing from sample output → FAIL (`SCHEMA_MISMATCH`)
- stale last_successful_run → FAIL (`STALE_BEYOND_WINDOW`)
- zero records with no held reason → FAIL (`ZERO_RECORDS`)
- suppressed extractor error → FAIL (`EXTRACTOR_ERROR_SUPPRESSED`)
- missing last run → WARN for static reference, FAIL for runtime/dynamic
  (`LAST_RUN_MISSING`)
