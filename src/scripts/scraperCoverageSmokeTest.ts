import {
  composeScraperCoverageAudit,
  SCRAPER_COVERAGE_AUDIT_DISCLOSURES,
  SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION,
  SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
  scraperCoverageAuditLineage,
} from "@/lib/source-audit/scraperCoverageAuditRuntime";
import {
  REQUIRED_SCRAPER_SOURCES,
  RequiredScraperSource,
} from "@/lib/source-audit/scraperSourceRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function cloneSources(): RequiredScraperSource[] {
  return REQUIRED_SCRAPER_SOURCES.map((s) => ({
    ...s,
    expectedFields: [...s.expectedFields],
    requiredForRoutes: [...s.requiredForRoutes],
  }));
}

function hasCategory(
  result: ReturnType<typeof composeScraperCoverageAudit>,
  category: string
): boolean {
  return result.findings.some((f) => f.category === category);
}

const AS_OF = "2026-06-04T00:00:00.000Z";
const RECENT_RUN = "2026-06-01T00:00:00.000Z";
const STALE_RUN = "2025-01-01T00:00:00.000Z";

const USDA_FIELDS = [
  "program_id",
  "program_name",
  "eligible_customer_types",
  "eligible_asset_types",
  "geographic_scope",
  "source_url",
  "last_verified_at",
  "provenance_ref",
];

function main() {
  // ── Version + lineage seals. ───────────────────────────────────────
  assert(
    SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION ===
      "scraper-coverage-audit-runtime-v0.1.0",
    "Runtime version must match the v0.1.0 seal."
  );
  const lineage = scraperCoverageAuditLineage();
  assert(
    lineage.runtimeVersion === SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION &&
      lineage.specVersion === SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
    "Lineage must echo the canonical runtime + spec versions."
  );
  assert(
    lineage.requiredScraperCount === 5 && lineage.alphaRequiredFamilyCount === 3,
    "Lineage must report 5 registered scrapers and 3 alpha-required families."
  );

  // ── Scenario A: canonical readiness baseline must PASS. ────────────
  const base = composeScraperCoverageAudit({ asOf: AS_OF });
  assert(base.exitCode === 0 && base.ok, "Canonical registry must PASS.");
  assert(
    base.registeredScraperCount === 5 &&
      base.alphaRequiredCount === 3 &&
      base.heldForAlphaCount === 2,
    "Baseline counts must be 5 registered / 3 alpha-required / 2 held."
  );
  assert(
    base.coverageMissingCount === 0 &&
      base.schemaFailureCount === 0 &&
      base.freshnessFailureCount === 0 &&
      base.liveFetchViolationCount === 0 &&
      base.findings.length === 0,
    "Baseline must have zero findings across every bucket."
  );
  // Constitutional posture.
  assert(
    base.liveScrapingActivated === false &&
      base.liveFetchDisabled === true &&
      base.advisoryOnly === true &&
      base.productionBlocked === true &&
      base.humanReviewRequired === true &&
      base.replaySafe === true &&
      base.auditSafe === true &&
      base.noAutonomousScraping === true &&
      base.noLiveExternalAction === true,
    "Baseline must preserve every constitutional flag (live scraping NOT activated)."
  );
  // Per-source verdicts.
  const status = (id: string) =>
    base.sources.find((s) => s.scraperId === id)?.status;
  assert(
    status("usda-program-reference-alpha") === "PASS" &&
      status("sba-program-reference-alpha") === "PASS" &&
      status("property-discovery-alpha") === "PASS",
    "Alpha-required sources must resolve PASS at baseline."
  );
  assert(
    status("county-records-alpha") === "BLOCKED_BY_DESIGN" &&
      status("environmental-source-alpha") === "BLOCKED_BY_DESIGN",
    "Held sources with a held reason must resolve BLOCKED_BY_DESIGN."
  );
  // Disclosures.
  assert(
    SCRAPER_COVERAGE_AUDIT_DISCLOSURES.some((d) =>
      d.toLowerCase().includes("does not activate live scraping")
    ),
    "Disclosures must state Build 42 does not activate live scraping."
  );

  // ── Scenario B: missing USDA scraper → FAIL. ───────────────────────
  const missingUsda = composeScraperCoverageAudit({
    asOf: AS_OF,
    sources: cloneSources().filter(
      (s) => s.scraperId !== "usda-program-reference-alpha"
    ),
  });
  assert(missingUsda.exitCode === 1, "Missing USDA scraper must FAIL.");
  assert(
    missingUsda.coverageMissingCount >= 1 &&
      hasCategory(missingUsda, "COVERAGE_MISSING"),
    "Missing USDA scraper must surface a COVERAGE_MISSING finding."
  );

  // ── Scenario C: alpha-required scraper with no expectedFields → FAIL.
  const noFields = composeScraperCoverageAudit({
    asOf: AS_OF,
    sources: cloneSources().map((s) =>
      s.scraperId === "usda-program-reference-alpha"
        ? { ...s, expectedFields: [] }
        : s
    ),
  });
  assert(noFields.exitCode === 1, "Alpha source with no expectedFields must FAIL.");
  assert(
    hasCategory(noFields, "MISSING_EXPECTED_FIELDS"),
    "Empty expectedFields must surface MISSING_EXPECTED_FIELDS."
  );

  // ── Scenario D: HELD_FOR_ALPHA without heldReason → FAIL. ───────────
  const heldNoReason = composeScraperCoverageAudit({
    asOf: AS_OF,
    sources: cloneSources().map((s) =>
      s.scraperId === "county-records-alpha"
        ? { ...s, heldReason: undefined }
        : s
    ),
  });
  assert(heldNoReason.exitCode === 1, "Held source without reason must FAIL.");
  assert(
    hasCategory(heldNoReason, "HELD_WITHOUT_REASON"),
    "Held-without-reason must surface HELD_WITHOUT_REASON."
  );

  // ── Scenario E: liveFetchAllowed=true without authorization → FAIL. ─
  const liveFetchUnauthorized = composeScraperCoverageAudit({
    asOf: AS_OF,
    sources: cloneSources().map((s) =>
      s.scraperId === "property-discovery-alpha"
        ? { ...s, liveFetchAllowed: true }
        : s
    ),
  });
  assert(
    liveFetchUnauthorized.exitCode === 1 &&
      liveFetchUnauthorized.liveFetchViolationCount >= 1 &&
      hasCategory(liveFetchUnauthorized, "LIVE_FETCH_VIOLATION"),
    "liveFetchAllowed without authorization must FAIL with a LIVE_FETCH_VIOLATION."
  );
  // ...and WITH governance authorization → PASS.
  const liveFetchAuthorized = composeScraperCoverageAudit({
    asOf: AS_OF,
    sources: cloneSources().map((s) =>
      s.scraperId === "property-discovery-alpha"
        ? { ...s, liveFetchAllowed: true }
        : s
    ),
    liveFetchAuthorizedScraperIds: ["property-discovery-alpha"],
  });
  assert(
    liveFetchAuthorized.exitCode === 0 &&
      liveFetchAuthorized.liveFetchViolationCount === 0,
    "Explicit governance authorization must clear the live-fetch violation."
  );

  // ── Scenario F: expected field missing from sample output → FAIL. ──
  const schemaMismatch = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "usda-program-reference-alpha",
        lastSuccessfulRun: RECENT_RUN,
        recordCount: 42,
        observedFields: USDA_FIELDS.filter((f) => f !== "program_name"),
      },
    ],
  });
  assert(
    schemaMismatch.exitCode === 1 &&
      hasCategory(schemaMismatch, "SCHEMA_MISMATCH"),
    "A sample missing an expected field must surface SCHEMA_MISMATCH and FAIL."
  );

  // ── Scenario G: stale last_successful_run → FAIL. ──────────────────
  const stale = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "usda-program-reference-alpha",
        lastSuccessfulRun: STALE_RUN,
        recordCount: 42,
        observedFields: USDA_FIELDS,
      },
    ],
  });
  assert(
    stale.exitCode === 1 &&
      stale.freshnessFailureCount >= 1 &&
      hasCategory(stale, "STALE_BEYOND_WINDOW"),
    "A run older than the freshness window must surface STALE_BEYOND_WINDOW and FAIL."
  );

  // ── Scenario H: zero records with no held reason → FAIL. ───────────
  const zeroRecords = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "usda-program-reference-alpha",
        lastSuccessfulRun: RECENT_RUN,
        recordCount: 0,
        observedFields: USDA_FIELDS,
      },
    ],
  });
  assert(
    zeroRecords.exitCode === 1 && hasCategory(zeroRecords, "ZERO_RECORDS"),
    "Zero records from a populated scraper must surface ZERO_RECORDS and FAIL."
  );

  // ── Scenario I: suppressed extractor error → FAIL. ─────────────────
  const extractorError = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "usda-program-reference-alpha",
        lastSuccessfulRun: RECENT_RUN,
        recordCount: 42,
        observedFields: USDA_FIELDS,
        extractorError: "selector .program-row not found",
      },
    ],
  });
  assert(
    extractorError.exitCode === 1 &&
      hasCategory(extractorError, "EXTRACTOR_ERROR_SUPPRESSED"),
    "A suppressed extractor error must surface EXTRACTOR_ERROR_SUPPRESSED and FAIL."
  );

  // ── Scenario J: missing last_run — WARN for static, FAIL for dynamic.
  const staticMissingRun = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "usda-program-reference-alpha",
        lastSuccessfulRun: null,
        recordCount: 42,
        observedFields: USDA_FIELDS,
      },
    ],
  });
  assert(
    staticMissingRun.exitCode === 0 &&
      staticMissingRun.warnCount >= 1 &&
      hasCategory(staticMissingRun, "LAST_RUN_MISSING"),
    "A static reference missing its last run must WARN (not FAIL)."
  );
  const dynamicMissingRun = composeScraperCoverageAudit({
    asOf: AS_OF,
    observations: [
      {
        scraperId: "property-discovery-alpha",
        lastSuccessfulRun: null,
        recordCount: 10,
        observedFields: [
          "property_id",
          "property_type",
          "location",
          "asking_price",
          "source_url",
          "discovered_at",
          "provenance_ref",
        ],
      },
    ],
  });
  assert(
    dynamicMissingRun.exitCode === 1 &&
      hasCategory(dynamicMissingRun, "LAST_RUN_MISSING"),
    "A runtime/dynamic source missing its last run must FAIL."
  );

  // ── Every finding resolves to REQUIRES_HUMAN_REVIEW. ───────────────
  for (const r of [
    missingUsda,
    noFields,
    heldNoReason,
    liveFetchUnauthorized,
    schemaMismatch,
    stale,
    zeroRecords,
    extractorError,
  ]) {
    for (const f of r.findings) {
      assert(
        f.resolution === "REQUIRES_HUMAN_REVIEW",
        `Finding ${f.findingId} must resolve to REQUIRES_HUMAN_REVIEW.`
      );
      assert(
        f.evidenceReplayRef.length > 0 && f.reviewerExplanation.length > 0,
        `Finding ${f.findingId} must carry a replay ref and explanation.`
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION,
        specVersion: SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
        baselineExitCode: base.exitCode,
        registeredScraperCount: base.registeredScraperCount,
        alphaRequiredCount: base.alphaRequiredCount,
        heldForAlphaCount: base.heldForAlphaCount,
        missingUsdaExitCode: missingUsda.exitCode,
        noFieldsExitCode: noFields.exitCode,
        heldNoReasonExitCode: heldNoReason.exitCode,
        liveFetchUnauthorizedExitCode: liveFetchUnauthorized.exitCode,
        liveFetchAuthorizedExitCode: liveFetchAuthorized.exitCode,
        schemaMismatchExitCode: schemaMismatch.exitCode,
        staleExitCode: stale.exitCode,
        zeroRecordsExitCode: zeroRecords.exitCode,
        extractorErrorExitCode: extractorError.exitCode,
        staticMissingRunExitCode: staticMissingRun.exitCode,
        dynamicMissingRunExitCode: dynamicMissingRun.exitCode,
        message: "Scraper Coverage & Source Freshness Audit v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
