import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DISCLOSURE_AUDIT_GATE_DOC_REF,
  DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
  DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
  composeDisclosureAuditGate,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";

/**
 * Module 44 — Disclosure Audit Gate CLI
 *
 * Generates docs/build-records/<YYYY-MM-DD>/disclosure-audit-gate.json
 * and exits non-zero if §5 is not satisfied:
 *   - every external surface carries every required disclosure,
 *   - zero unexempted prohibited-claim leaks,
 *   - 100% surface coverage with the public-gateway count reconciled,
 *   - any red-team injection (if supplied) is caught.
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

  const result = composeDisclosureAuditGate({
    reviewerRole: "Qualified Governance Reviewer",
    metadata: { commit, branch, source: "disclosure-audit-gate-cli" },
  });

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "disclosure-audit-gate.json");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
        specVersion: DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
        docRef: DISCLOSURE_AUDIT_GATE_DOC_REF,
        commit,
        branch,
        disclosureRegistryCount: result.disclosureRegistry.length,
        prohibitedClaimsCorpusCount: result.prohibitedClaimsCorpus.length,
        externalSurfaceCount: result.summary.externalSurfaceCount,
        publicSurfaceCountFromRegistry:
          result.summary.publicSurfaceCountFromRegistry,
        publicSurfaceCountFromGateway:
          result.summary.publicSurfaceCountFromGateway,
        surfaceCountReconciled: result.summary.surfaceCountReconciled,
        disclosurePassCount: result.summary.disclosurePassCount,
        disclosureFailCount: result.summary.disclosureFailCount,
        claimsPassCount: result.summary.claimsPassCount,
        claimsFailCount: result.summary.claimsFailCount,
        totalRequiredDisclosureChecks:
          result.summary.totalRequiredDisclosureChecks,
        presentDisclosureChecks: result.summary.presentDisclosureChecks,
        missingDisclosureChecks: result.summary.missingDisclosureChecks,
        totalProhibitedClaimViolations:
          result.summary.totalProhibitedClaimViolations,
        exemptNegationHits: result.summary.exemptNegationHits,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        v1OverallReadinessPercent: result.summary.v1OverallReadinessPercent,
        exitCode: result.exitCode,
        jsonPath,
        message:
          result.exitCode === 0
            ? "Disclosure Audit Gate PASS — every external surface carries required disclosures, zero unexempted prohibited claims, surface count reconciled."
            : "Disclosure Audit Gate FAIL — see findings (disclosure gap, prohibited-claim leak, surface count discrepancy, or red-team miss).",
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

main();
