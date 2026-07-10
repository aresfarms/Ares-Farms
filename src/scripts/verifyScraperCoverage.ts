import { execSync } from "node:child_process";

import {
  composeScraperCoverageAudit,
  SCRAPER_COVERAGE_AUDIT_DOC_REF,
  SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
} from "@/lib/source-audit/scraperCoverageAuditRuntime";

/**
 * verify:scraper-coverage — Scraper Coverage & Source Freshness Audit
 *
 * Runs the registry-readiness audit (no live observations — Build 42
 * does not activate live scraping) and exits non-zero if any
 * alpha-required coverage / schema / provenance / freshness / live-fetch
 * rule fails. The canonical readiness baseline is the five-source
 * registry: 3 alpha-required, 2 held-for-Alpha, zero failures.
 */

function safeExec(command: string, fallback: string): string {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

function main() {
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");

  const result = composeScraperCoverageAudit({
    reviewerRole: "Source Governance Reviewer",
    commit,
    branch,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        runtimeVersion: result.runtimeVersion,
        specVersion: SCRAPER_COVERAGE_AUDIT_SPEC_VERSION,
        docRef: SCRAPER_COVERAGE_AUDIT_DOC_REF,
        commit,
        branch,
        registeredScraperCount: result.registeredScraperCount,
        alphaRequiredCount: result.alphaRequiredCount,
        heldForAlphaCount: result.heldForAlphaCount,
        coverageMissingCount: result.coverageMissingCount,
        schemaFailureCount: result.schemaFailureCount,
        freshnessFailureCount: result.freshnessFailureCount,
        liveFetchViolationCount: result.liveFetchViolationCount,
        warnCount: result.warnCount,
        findings: result.findings.map((f) => ({
          findingId: f.findingId,
          category: f.category,
          severity: f.severity,
          scraperId: f.scraperId ?? null,
          topic: f.topic,
        })),
        exitCode: result.exitCode,
        message:
          result.exitCode === 0
            ? "verify:scraper-coverage PASS — every alpha-required source family is covered with expected fields, authority tier, a non-held freshness window, provenance fields, and no live-fetch violation. Live scraping remains disabled."
            : "verify:scraper-coverage FAIL — see findings (coverage / schema / provenance / freshness / live-fetch).",
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

main();
