import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
  composePublicAlphaCustomerJourney,
} from "@/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime";

/**
 * Build 38 — Public Alpha Profile v1 (Customer Journey) CLI
 *
 * Generates docs/build-records/<YYYY-MM-DD>/public-alpha-customer-journey.json
 * and exits non-zero if any of:
 *   - any of the 7 entry-surface sections FAIL
 *   - any of the 6 customer success questions are unanswerable
 *   - the customer promise statement is incomplete
 *   - any of the 6 financing reality classifications are missing
 *   - any required disclosure is missing on a section's surface
 *   - any escalation-capable section has no Module 45 binding
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

  const result = composePublicAlphaCustomerJourney({
    reviewerRole: "Chief Governance Authority",
    metadata: {
      commit,
      branch,
      source: "public-alpha-customer-journey-cli",
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "public-alpha-customer-journey.json");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
        specVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
        docRef: PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
        commit,
        branch,
        sectionCount: result.summary.sectionCount,
        sectionsPass: result.summary.sectionsPass,
        sectionsFail: result.summary.sectionsFail,
        sectionsWarn: result.summary.sectionsWarn,
        customerSuccessQuestionsPass:
          result.summary.customerSuccessQuestionsPass,
        customerSuccessQuestionsFail:
          result.summary.customerSuccessQuestionsFail,
        customerPromiseStatus: result.summary.customerPromiseStatus,
        financingRealityStatus: result.summary.financingRealityStatus,
        classificationsPresentCount:
          result.summary.classificationsPresentCount,
        classificationsTotal: result.summary.classificationsTotal,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        v1OverallReadinessPercent: result.summary.v1OverallReadinessPercent,
        alphaJourneyReady: result.alphaJourneyReady,
        exitCode: result.exitCode,
        jsonPath,
        message:
          result.exitCode === 0
            ? "Public Alpha Customer Journey PASS — every section, customer promise, financing reality classification, disclosure coverage, and escalation binding holds."
            : "Public Alpha Customer Journey FAIL — see findings (section / promise / classification / disclosure / authority gap).",
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

main();
