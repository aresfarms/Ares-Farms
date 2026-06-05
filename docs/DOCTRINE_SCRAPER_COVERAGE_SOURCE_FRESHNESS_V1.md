# Doctrine — Scraper Coverage & Source Freshness Audit v1

**Runtime:** `scraper-coverage-audit-runtime-v0.1.0`
**Spec:** `build-42-scraper-coverage-source-freshness-spec-v1.0`
**Status:** Internal advisory audit. Build 42 does **not** activate live scraping.

## Master Volume traceability

Synthesis only — no new doctrine is invented; this codifies existing obligations.

- **Vol III — Technical Infrastructure (source connectors).** Connectors and
  scrapers are governed inputs: each must declare what it extracts, where it
  comes from, and how it is traced.
- **Vol III-B — Governance Runtime.** Deterministic, replay-safe verification
  artifacts. The audit reads a static registry + optional run observations and
  produces an identical result for identical input.
- **Vol II — Regulatory Governance (source authority).** A source's authority
  tier (OFFICIAL / LICENSED_THIRD_PARTY / DISCOVERY / INTERNAL_REFERENCE) must
  be declared; reviewers may not treat discovery data as official.
- **Vol V — Canonical Doctrines (provenance; live-fetch = 0).** Every governed
  record must carry provenance (`source_url`, `provenance_ref`) so it can be
  traced and replayed. Live external fetch remains disabled until an explicit
  governance authorization lands.

## What the audit answers

1. **Coverage** — does Furlong have the required scrapers for every
   alpha-required source family, and is every required route served?
2. **Schema / provenance** — does each alpha-required scraper declare the
   correct expected fields, including provenance fields, and does its sample
   output actually contain them?
3. **Source authority** — does each alpha-required scraper declare an authority
   tier?
4. **Freshness** — when a scraper reports a run, did it run within its freshness
   window, return records, and avoid schema drift?
5. **Visibility of failure** — are suppressed extractor errors, changed source
   shapes, zero-record runs, and missing runs surfaced rather than hidden?

## Source families and the Alpha set

| Family | Alpha-required | Default freshness | Notes |
|---|---|---|---|
| USDA_PROGRAMS | yes | MONTHLY | OFFICIAL program reference (static reference) |
| SBA_PROGRAMS | yes | MONTHLY | OFFICIAL program reference (static reference) |
| PROPERTY_DISCOVERY | yes | WEEKLY | DISCOVERY tier (runtime/dynamic) |
| COUNTY_RECORDS | no | HELD_FOR_ALPHA | County/title verification deferred from Alpha |
| ENVIRONMENTAL | no | HELD_FOR_ALPHA | Environmental engineering review deferred from Alpha |

`ALPHA_REQUIRED_SOURCE_FAMILIES` and `ALPHA_REQUIRED_ROUTES` are declared
independently of the registry array, so **removing** a scraper surfaces a
coverage gap rather than silently deleting the requirement with it.

## PASS conditions (registry readiness — `verify:scraper-coverage`)

`verify:scraper-coverage` PASSES only if **all** hold:

- Every alpha-required source family has at least one registered scraper.
- Every alpha-required scraper declares non-empty `expectedFields`.
- Every alpha-required scraper declares an `authorityTier`.
- Every alpha-required scraper has a `freshnessWindow` that is **not**
  `HELD_FOR_ALPHA`.
- Every alpha-required scraper declares the provenance fields
  (`source_url`, `provenance_ref`).
- `liveFetchAllowed` is `false` unless the scraper is explicitly authorized by
  governance (`LIVE_FETCH_AUTHORIZED_SCRAPER_IDS` or a per-run authorization).
- Every `HELD_FOR_ALPHA` source declares a `heldReason`.
- No alpha-required route depends only on a missing or held source family.

Held sources with a held reason resolve **BLOCKED_BY_DESIGN** (healthy, not a
failure). A held source *that is also alpha-required* is a failure — an
alpha-required capability cannot be held.

## Freshness rules (runtime observation — when `alphaRequired = true`)

Freshness rules fire only when a scraper reports a run (an observation is
supplied). During Public Alpha live fetch is disabled, no observations exist,
and the freshness rules do not fire.

- `last_successful_run` missing → **WARN** if the source is a static reference
  (the existing corpus may still be valid), **FAIL** if it is runtime/dynamic
  (no run means no current data).
- Stale beyond the freshness window → **FAIL**.
- Zero records from a normally populated scraper (with a successful run and no
  held reason) → **FAIL**.
- Schema mismatch (sample output missing an expected field) → **FAIL**.
- Source changed shape → **FAIL**.
- Extractor error hidden/suppressed → **FAIL**.

## Finding buckets and exit code

Each finding carries a bucket — `COVERAGE`, `SCHEMA`, `FRESHNESS`, or
`LIVE_FETCH` — which feeds the headline counts (`coverageMissingCount`,
`schemaFailureCount`, `freshnessFailureCount`, `liveFetchViolationCount`). Any
`FAIL`-severity finding sets `exitCode = 1`; `WARN` does not. Every finding
resolves to `REQUIRES_HUMAN_REVIEW`.

## Constitutional posture

- Build 42 does **not** activate live scraping.
- The audit measures readiness, coverage, schema expectations, source authority,
  freshness rules, held status, and provenance requirements.
- `liveFetchDisabled = true`, `liveScrapingActivated = false`,
  `noAutonomousScraping = true`, `noLiveExternalAction = true`,
  `advisoryOnly = true`, `productionBlocked = true`, `humanReviewRequired = true`,
  `replaySafe = true`, `auditSafe = true`.
- Live fetch remains disabled unless a later governance decision explicitly
  authorizes a specific scraper.
