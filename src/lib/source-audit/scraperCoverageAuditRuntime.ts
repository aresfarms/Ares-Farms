import {
  ALPHA_REQUIRED_ROUTES,
  ALPHA_REQUIRED_SOURCE_FAMILIES,
  isHeldForAlpha,
  isStaticReferenceSource,
  LIVE_FETCH_AUTHORIZED_SCRAPER_IDS,
  REQUIRED_PROVENANCE_FIELDS,
  REQUIRED_SCRAPER_SOURCES,
  RequiredScraperSource,
  ScraperCoverageStatus,
  ScraperFreshnessWindow,
  ScraperSourceFamily,
} from "@/lib/source-audit/scraperSourceRegistry";

/**
 * Scraper Coverage & Source Freshness Audit Runtime (Build 42)
 *
 * Answers, deterministically and without touching the network:
 *   1. Does Furlong have the required scrapers? (coverage)
 *   2. Do they extract the correct fields? (schema / provenance)
 *   3. Do they run on schedule? (freshness)
 *   4. Are failures visible? (extractor-error / zero-record / stale)
 *
 * Two layers:
 *   - Registry readiness (always): coverage, expected-fields, authority
 *     tier, non-held freshness window for alpha-required sources,
 *     provenance fields, live-fetch posture, held-reason presence, and
 *     route dependency satisfaction.
 *   - Runtime observation (when supplied): for each alpha-required
 *     source that reports a run, audit last_successful_run, staleness,
 *     record count, observed schema, source-shape change, and any
 *     suppressed extractor error.
 *
 * Constitutional posture: advisory-only, internal audit, replay-safe,
 * audit-safe. Build 42 does NOT activate live scraping. Every finding
 * resolves to REQUIRES_HUMAN_REVIEW.
 */

export const SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION =
  "scraper-coverage-audit-runtime-v0.1.0";

export const SCRAPER_COVERAGE_AUDIT_SPEC_VERSION =
  "build-42-scraper-coverage-source-freshness-spec-v1.0";

export const SCRAPER_COVERAGE_AUDIT_DOC_REF =
  "docs/DOCTRINE_SCRAPER_COVERAGE_SOURCE_FRESHNESS_V1.md";

const REVIEW_ROUTE = "/governance/scraper-coverage-audit";

const DEFAULT_DOCTRINE_REFS = [
  "TECH-CONN-001",
  "CANON-SOVEREIGNTY-001",
  "CANON-PROVENANCE-001",
  SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
];

// =============================================================================
// Observation input
// =============================================================================

/**
 * What a scraper reported about its most recent run. Supplied only
 * when a scraper has actually executed. During Public Alpha (live
 * fetch disabled) no observations are supplied, so the audit runs in
 * registry-readiness mode and the freshness rules do not fire.
 */
export type ScraperRuntimeObservation = {
  scraperId: string;
  /** ISO-8601 timestamp of the last successful run, or null if never. */
  lastSuccessfulRun?: string | null;
  /** Records produced by the most recent run. */
  recordCount?: number | null;
  /** Field names present in the sample output of the most recent run. */
  observedFields?: string[];
  /** A suppressed / hidden extractor error, if the scraper swallowed one. */
  extractorError?: string | null;
  /** True if the upstream source changed shape since the last run. */
  sourceShapeChanged?: boolean;
  /** Governance authorization reference, if live fetch was authorized. */
  liveFetchAuthorizedBy?: string | null;
};

export type ScraperCoverageAuditInput = {
  reviewerRole?: string | null;
  asOf?: string;
  sources?: RequiredScraperSource[];
  observations?: ScraperRuntimeObservation[];
  liveFetchAuthorizedScraperIds?: string[];
  commit?: string;
  branch?: string;
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Findings + per-source result
// =============================================================================

export type ScraperCoverageFindingCategory =
  | "COVERAGE_MISSING"
  | "ROUTE_DEPENDS_ON_MISSING_SOURCE"
  | "MISSING_EXPECTED_FIELDS"
  | "MISSING_AUTHORITY_TIER"
  | "HELD_WINDOW_ON_ALPHA_REQUIRED"
  | "MISSING_PROVENANCE_FIELDS"
  | "HELD_WITHOUT_REASON"
  | "LIVE_FETCH_VIOLATION"
  | "LAST_RUN_MISSING"
  | "STALE_BEYOND_WINDOW"
  | "ZERO_RECORDS"
  | "SCHEMA_MISMATCH"
  | "SOURCE_SHAPE_CHANGED"
  | "EXTRACTOR_ERROR_SUPPRESSED";

export type ScraperCoverageFindingBucket =
  | "COVERAGE"
  | "SCHEMA"
  | "FRESHNESS"
  | "LIVE_FETCH";

export type ScraperCoverageSeverity = "FAIL" | "WARN";

export type ScraperCoverageFinding = {
  findingId: string;
  category: ScraperCoverageFindingCategory;
  bucket: ScraperCoverageFindingBucket;
  severity: ScraperCoverageSeverity;
  scraperId?: string;
  sourceFamily?: ScraperSourceFamily;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
};

export type ScraperCoverageSourceResult = {
  scraperId: string;
  sourceFamily: ScraperSourceFamily;
  alphaRequired: boolean;
  authorityTier: string;
  freshnessWindow: ScraperFreshnessWindow;
  heldForAlpha: boolean;
  staticReference: boolean;
  status: ScraperCoverageStatus;
  observed: boolean;
  reasons: string[];
};

export type ScraperCoverageAuditResult = {
  ok: boolean;
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  asOf: string;
  registeredScraperCount: number;
  alphaRequiredCount: number;
  heldForAlphaCount: number;
  coverageMissingCount: number;
  schemaFailureCount: number;
  freshnessFailureCount: number;
  liveFetchViolationCount: number;
  warnCount: number;
  findings: ScraperCoverageFinding[];
  sources: ScraperCoverageSourceResult[];
  disclosures: string[];
  exitCode: 0 | 1;
  // Constitutional flags.
  liveScrapingActivated: false;
  liveFetchDisabled: true;
  advisoryOnly: true;
  productionBlocked: true;
  humanReviewRequired: true;
  replaySafe: true;
  auditSafe: true;
  noAutonomousScraping: true;
  noLiveExternalAction: true;
};

export const SCRAPER_COVERAGE_AUDIT_DISCLOSURES = [
  "Scraper Coverage & Source Freshness Audit v1 is internal advisory audit evidence only, replay-safe and audit-safe.",
  "Build 42 does NOT activate live scraping. The audit measures readiness, coverage, schema expectations, source authority, freshness rules, held status, and provenance requirements.",
  "Live fetch remains disabled unless a later governance decision explicitly authorizes a specific scraper.",
  "Every alpha-required source must declare expected fields, an authority tier, a non-held freshness window, and source/provenance fields.",
  "HELD_FOR_ALPHA sources require a held reason; a held alpha-required source is a coverage failure.",
  "Freshness rules apply only when a scraper reports a run. A stale run, zero records without a held reason, a schema mismatch, a changed source shape, or a suppressed extractor error fails the audit closed.",
  "Every finding resolves to REQUIRES_HUMAN_REVIEW.",
] as const;

// =============================================================================
// Freshness windows
// =============================================================================

const FRESHNESS_WINDOW_MAX_AGE_DAYS: Record<ScraperFreshnessWindow, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 31,
  ON_DEMAND: Number.POSITIVE_INFINITY,
  HELD_FOR_ALPHA: Number.POSITIVE_INFINITY,
};

function daysBetween(laterIso: string, earlierIso: string): number | null {
  const later = Date.parse(laterIso);
  const earlier = Date.parse(earlierIso);
  if (Number.isNaN(later) || Number.isNaN(earlier)) {
    return null;
  }
  return (later - earlier) / (1000 * 60 * 60 * 24);
}

// =============================================================================
// Composition
// =============================================================================

export function composeScraperCoverageAudit(
  input: ScraperCoverageAuditInput = {}
): ScraperCoverageAuditResult {
  const sources = input.sources ?? REQUIRED_SCRAPER_SOURCES;
  const observations = input.observations ?? [];
  const asOf = input.asOf ?? new Date().toISOString();
  const authorizedLiveFetch = new Set([
    ...LIVE_FETCH_AUTHORIZED_SCRAPER_IDS,
    ...(input.liveFetchAuthorizedScraperIds ?? []),
  ]);
  const observationById = new Map<string, ScraperRuntimeObservation>(
    observations.map((o) => [o.scraperId, o])
  );

  const findings: ScraperCoverageFinding[] = [];
  const sourceResults: ScraperCoverageSourceResult[] = [];

  const push = (
    f: Omit<
      ScraperCoverageFinding,
      "resolution" | "reviewRoute" | "doctrineRefs" | "evidenceReplayRef"
    > & { evidenceReplayRef?: string }
  ) => {
    findings.push({
      ...f,
      evidenceReplayRef:
        f.evidenceReplayRef ??
        `scraper-audit-replay://${f.scraperId ?? f.sourceFamily ?? "registry"}/${f.category}`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    });
  };

  // ───────────────────────────────────────────────────────────────────
  // Layer 1 — registry coverage (families + routes).
  // ───────────────────────────────────────────────────────────────────
  const presentFamilies = new Set(sources.map((s) => s.sourceFamily));
  for (const family of ALPHA_REQUIRED_SOURCE_FAMILIES) {
    if (!presentFamilies.has(family)) {
      push({
        findingId: `scraper-coverage-missing-${family}`,
        category: "COVERAGE_MISSING",
        bucket: "COVERAGE",
        severity: "FAIL",
        sourceFamily: family,
        topic: `No registered scraper for alpha-required source family ${family}`,
        reviewerExplanation: `Source family ${family} is alpha-required but no scraper is registered for it. Furlong cannot serve the routes that depend on it until a scraper is registered with expected fields, an authority tier, a non-held freshness window, and provenance fields.`,
      });
    }
  }

  // A route is "served" only by a present, non-held scraper that lists
  // the route. Held / removed scrapers do not satisfy a route.
  for (const route of ALPHA_REQUIRED_ROUTES) {
    const served = sources.some(
      (s) =>
        !isHeldForAlpha(s) &&
        presentFamilies.has(s.sourceFamily) &&
        s.requiredForRoutes.includes(route)
    );
    if (!served) {
      push({
        findingId: `scraper-route-unserved-${route.replace(/\//g, "-")}`,
        category: "ROUTE_DEPENDS_ON_MISSING_SOURCE",
        bucket: "COVERAGE",
        severity: "FAIL",
        topic: `Route ${route} has no live source family`,
        reviewerExplanation: `Route ${route} depends on at least one registered, non-held alpha-required scraper, but none currently serves it. The route's data dependency is unmet.`,
        evidenceReplayRef: `scraper-audit-replay://route${route}/unserved`,
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // Layer 2 — per-source registry + observation audit.
  // ───────────────────────────────────────────────────────────────────
  for (const source of sources) {
    const reasons: string[] = [];
    const held = isHeldForAlpha(source);
    const staticRef = isStaticReferenceSource(source);
    let worst: ScraperCoverageStatus = "PASS";
    const bump = (next: ScraperCoverageStatus) => {
      const rank: Record<ScraperCoverageStatus, number> = {
        PASS: 0,
        N_A: 0,
        BLOCKED_BY_DESIGN: 1,
        WARN: 2,
        FAIL: 3,
      };
      if (rank[next] > rank[worst]) {
        worst = next;
      }
    };

    // Held sources: require a held reason; never fail the gate.
    if (held) {
      if (!source.heldReason || source.heldReason.trim().length === 0) {
        push({
          findingId: `scraper-held-without-reason-${source.scraperId}`,
          category: "HELD_WITHOUT_REASON",
          bucket: "COVERAGE",
          severity: "FAIL",
          scraperId: source.scraperId,
          sourceFamily: source.sourceFamily,
          topic: `Held source ${source.scraperId} has no held reason`,
          reviewerExplanation: `Source ${source.scraperId} is HELD_FOR_ALPHA but declares no heldReason. A held source must document why it is held so the held status is auditable.`,
        });
        reasons.push("HELD_FOR_ALPHA without heldReason");
        bump("FAIL");
      } else {
        reasons.push(`held: ${source.heldReason}`);
        bump("BLOCKED_BY_DESIGN");
      }
    }

    // Live-fetch posture (applies to every source).
    if (
      source.liveFetchAllowed &&
      !authorizedLiveFetch.has(source.scraperId) &&
      !observationById.get(source.scraperId)?.liveFetchAuthorizedBy
    ) {
      push({
        findingId: `scraper-live-fetch-violation-${source.scraperId}`,
        category: "LIVE_FETCH_VIOLATION",
        bucket: "LIVE_FETCH",
        severity: "FAIL",
        scraperId: source.scraperId,
        sourceFamily: source.sourceFamily,
        topic: `Live fetch enabled without authorization on ${source.scraperId}`,
        reviewerExplanation: `Source ${source.scraperId} has liveFetchAllowed = true but is not in the governance live-fetch authorization list and carries no per-run authorization. Live fetch remains disabled during Public Alpha unless a governance decision explicitly authorizes this scraper.`,
      });
      reasons.push("live fetch enabled without authorization");
      bump("FAIL");
    }

    // Alpha-required registry-readiness checks.
    if (source.alphaRequired) {
      if (source.expectedFields.length === 0) {
        push({
          findingId: `scraper-missing-expected-fields-${source.scraperId}`,
          category: "MISSING_EXPECTED_FIELDS",
          bucket: "SCHEMA",
          severity: "FAIL",
          scraperId: source.scraperId,
          sourceFamily: source.sourceFamily,
          topic: `Alpha-required scraper ${source.scraperId} declares no expected fields`,
          reviewerExplanation: `Source ${source.scraperId} is alpha-required but declares no expectedFields. Without an expected schema the audit cannot verify the scraper extracts the correct fields.`,
        });
        reasons.push("no expectedFields");
        bump("FAIL");
      }

      if (!source.authorityTier || (source.authorityTier as string).length === 0) {
        push({
          findingId: `scraper-missing-authority-tier-${source.scraperId}`,
          category: "MISSING_AUTHORITY_TIER",
          bucket: "SCHEMA",
          severity: "FAIL",
          scraperId: source.scraperId,
          sourceFamily: source.sourceFamily,
          topic: `Alpha-required scraper ${source.scraperId} has no authority tier`,
          reviewerExplanation: `Source ${source.scraperId} is alpha-required but declares no authorityTier. Source authority must be declared so reviewers know whether the data is OFFICIAL, LICENSED_THIRD_PARTY, DISCOVERY, or INTERNAL_REFERENCE.`,
        });
        reasons.push("no authorityTier");
        bump("FAIL");
      }

      if (source.freshnessWindow === "HELD_FOR_ALPHA") {
        push({
          findingId: `scraper-held-window-on-alpha-${source.scraperId}`,
          category: "HELD_WINDOW_ON_ALPHA_REQUIRED",
          bucket: "COVERAGE",
          severity: "FAIL",
          scraperId: source.scraperId,
          sourceFamily: source.sourceFamily,
          topic: `Alpha-required scraper ${source.scraperId} is held for Alpha`,
          reviewerExplanation: `Source ${source.scraperId} is alpha-required but its freshnessWindow is HELD_FOR_ALPHA. An alpha-required source cannot be held — either it must run on a real cadence, or it is not actually alpha-required.`,
        });
        reasons.push("alpha-required but HELD_FOR_ALPHA");
        bump("FAIL");
      }

      const missingProvenance = REQUIRED_PROVENANCE_FIELDS.filter(
        (f) => !source.expectedFields.includes(f)
      );
      if (missingProvenance.length > 0) {
        push({
          findingId: `scraper-missing-provenance-${source.scraperId}`,
          category: "MISSING_PROVENANCE_FIELDS",
          bucket: "SCHEMA",
          severity: "FAIL",
          scraperId: source.scraperId,
          sourceFamily: source.sourceFamily,
          topic: `Alpha-required scraper ${source.scraperId} missing provenance fields`,
          reviewerExplanation: `Source ${source.scraperId} is alpha-required but its expectedFields omit provenance field(s): ${missingProvenance.join(", ")}. Without provenance the data cannot be traced or replayed.`,
        });
        reasons.push(`missing provenance: ${missingProvenance.join(", ")}`);
        bump("FAIL");
      }

      // Observation audit (only when the scraper reported a run).
      const obs = observationById.get(source.scraperId);
      if (obs) {
        // Suppressed extractor error.
        if (obs.extractorError && obs.extractorError.trim().length > 0) {
          push({
            findingId: `scraper-extractor-error-${source.scraperId}`,
            category: "EXTRACTOR_ERROR_SUPPRESSED",
            bucket: "SCHEMA",
            severity: "FAIL",
            scraperId: source.scraperId,
            sourceFamily: source.sourceFamily,
            topic: `Extractor error reported for ${source.scraperId}`,
            reviewerExplanation: `Source ${source.scraperId} reported an extractor error ("${obs.extractorError}"). A hidden or suppressed extractor error must fail the audit so the failure is visible.`,
          });
          reasons.push("extractor error");
          bump("FAIL");
        }

        // Source shape changed.
        if (obs.sourceShapeChanged) {
          push({
            findingId: `scraper-source-shape-changed-${source.scraperId}`,
            category: "SOURCE_SHAPE_CHANGED",
            bucket: "SCHEMA",
            severity: "FAIL",
            scraperId: source.scraperId,
            sourceFamily: source.sourceFamily,
            topic: `Upstream source shape changed for ${source.scraperId}`,
            reviewerExplanation: `The upstream source for ${source.scraperId} changed shape since the last run. The extractor must be reviewed before its output can be trusted.`,
          });
          reasons.push("source shape changed");
          bump("FAIL");
        }

        // Schema mismatch (observed fields missing expected fields).
        if (obs.observedFields) {
          const missing = source.expectedFields.filter(
            (f) => !obs.observedFields!.includes(f)
          );
          if (missing.length > 0) {
            push({
              findingId: `scraper-schema-mismatch-${source.scraperId}`,
              category: "SCHEMA_MISMATCH",
              bucket: "SCHEMA",
              severity: "FAIL",
              scraperId: source.scraperId,
              sourceFamily: source.sourceFamily,
              topic: `Sample output for ${source.scraperId} is missing expected fields`,
              reviewerExplanation: `The most recent sample output for ${source.scraperId} is missing expected field(s): ${missing.join(", ")}. The scraper is not extracting the correct fields.`,
            });
            reasons.push(`schema mismatch: ${missing.join(", ")}`);
            bump("FAIL");
          }
        }

        // Last successful run missing.
        if (!obs.lastSuccessfulRun) {
          const severity: ScraperCoverageSeverity = staticRef ? "WARN" : "FAIL";
          push({
            findingId: `scraper-last-run-missing-${source.scraperId}`,
            category: "LAST_RUN_MISSING",
            bucket: "FRESHNESS",
            severity,
            scraperId: source.scraperId,
            sourceFamily: source.sourceFamily,
            topic: `${source.scraperId} reports a run with no last_successful_run`,
            reviewerExplanation: `Source ${source.scraperId} was observed but has no last_successful_run. ${staticRef ? "It is a static reference corpus, so this is a warning — the existing corpus may still be valid." : "It is a runtime/dynamic source, so a missing successful run means there is no current data — this fails the audit."}`,
          });
          reasons.push("no last_successful_run");
          bump(severity);
        } else {
          // Staleness.
          const maxAge = FRESHNESS_WINDOW_MAX_AGE_DAYS[source.freshnessWindow];
          const age = daysBetween(asOf, obs.lastSuccessfulRun);
          if (age !== null && age > maxAge) {
            push({
              findingId: `scraper-stale-${source.scraperId}`,
              category: "STALE_BEYOND_WINDOW",
              bucket: "FRESHNESS",
              severity: "FAIL",
              scraperId: source.scraperId,
              sourceFamily: source.sourceFamily,
              topic: `${source.scraperId} is stale beyond its ${source.freshnessWindow} window`,
              reviewerExplanation: `Source ${source.scraperId} last succeeded ${Math.floor(age)} day(s) ago, beyond its ${source.freshnessWindow} freshness window (${maxAge} day(s)). The data is stale.`,
            });
            reasons.push(`stale (${Math.floor(age)}d > ${maxAge}d)`);
            bump("FAIL");
          }
        }

        // Zero records from a normally populated scraper.
        if (
          (obs.recordCount === 0 || obs.recordCount === null) &&
          obs.lastSuccessfulRun
        ) {
          push({
            findingId: `scraper-zero-records-${source.scraperId}`,
            category: "ZERO_RECORDS",
            bucket: "FRESHNESS",
            severity: "FAIL",
            scraperId: source.scraperId,
            sourceFamily: source.sourceFamily,
            topic: `${source.scraperId} produced zero records`,
            reviewerExplanation: `Source ${source.scraperId} reported a successful run but produced zero records and declares no held reason. A normally populated scraper returning nothing is a silent failure and must be surfaced.`,
          });
          reasons.push("zero records");
          bump("FAIL");
        }
      }
    }

    const observed = observationById.has(source.scraperId);
    if (!source.alphaRequired && !held) {
      // Non-alpha, non-held source: not assessed for Alpha.
      if (worst === "PASS") {
        bump("N_A");
        reasons.push("not alpha-required");
      }
    }

    sourceResults.push({
      scraperId: source.scraperId,
      sourceFamily: source.sourceFamily,
      alphaRequired: source.alphaRequired,
      authorityTier: source.authorityTier,
      freshnessWindow: source.freshnessWindow,
      heldForAlpha: held,
      staticReference: staticRef,
      status: worst,
      observed,
      reasons,
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // Counts + exit code.
  // ───────────────────────────────────────────────────────────────────
  const failBucket = (bucket: ScraperCoverageFindingBucket) =>
    findings.filter((f) => f.bucket === bucket && f.severity === "FAIL").length;

  const coverageMissingCount = failBucket("COVERAGE");
  const schemaFailureCount = failBucket("SCHEMA");
  const freshnessFailureCount = failBucket("FRESHNESS");
  const liveFetchViolationCount = failBucket("LIVE_FETCH");
  const warnCount = findings.filter((f) => f.severity === "WARN").length;
  const hasFail = findings.some((f) => f.severity === "FAIL");
  const exitCode: 0 | 1 = hasFail ? 1 : 0;

  const alphaRequiredCount = sources.filter((s) => s.alphaRequired).length;
  const heldForAlphaCount = sources.filter((s) => isHeldForAlpha(s)).length;

  return {
    ok: exitCode === 0,
    runtimeVersion: SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION,
    specVersion: SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
    docRef: SCRAPER_COVERAGE_AUDIT_DOC_REF,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    asOf,
    registeredScraperCount: sources.length,
    alphaRequiredCount,
    heldForAlphaCount,
    coverageMissingCount,
    schemaFailureCount,
    freshnessFailureCount,
    liveFetchViolationCount,
    warnCount,
    findings,
    sources: sourceResults,
    disclosures: [...SCRAPER_COVERAGE_AUDIT_DISCLOSURES],
    exitCode,
    liveScrapingActivated: false,
    liveFetchDisabled: true,
    advisoryOnly: true,
    productionBlocked: true,
    humanReviewRequired: true,
    replaySafe: true,
    auditSafe: true,
    noAutonomousScraping: true,
    noLiveExternalAction: true,
  };
}

export function scraperCoverageAuditLineage(): {
  runtimeVersion: string;
  specVersion: string;
  requiredScraperCount: number;
  alphaRequiredFamilyCount: number;
} {
  return {
    runtimeVersion: SCRAPER_COVERAGE_AUDIT_RUNTIME_VERSION,
    specVersion: SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
    requiredScraperCount: REQUIRED_SCRAPER_SOURCES.length,
    alphaRequiredFamilyCount: ALPHA_REQUIRED_SOURCE_FAMILIES.length,
  };
}
