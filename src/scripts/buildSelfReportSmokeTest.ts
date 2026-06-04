import {
  BUILD_SELF_REPORT_DISCLOSURES,
  BUILD_SELF_REPORT_PRODUCTION_RESTRICTIONS,
  BUILD_SELF_REPORT_RUNTIME_VERSION,
  BUILD_SELF_REPORT_SIGNAL_IDS,
  BUILD_SELF_REPORT_SPEC_VERSION,
  buildSelfReportLineage,
  composeBuildSelfReport,
  renderBuildSelfReportMarkdown,
} from "@/lib/build-self-report/buildSelfReportRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    BUILD_SELF_REPORT_RUNTIME_VERSION === "build-self-report-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    BUILD_SELF_REPORT_SPEC_VERSION === "module-42-build-self-report-spec-v1.0",
    "Spec version must match v1.0 seal."
  );
  const lineage = buildSelfReportLineage();
  assert(
    lineage.runtimeVersion === BUILD_SELF_REPORT_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical."
  );
  assert(
    lineage.specVersion === BUILD_SELF_REPORT_SPEC_VERSION,
    "Lineage specVersion must equal canonical."
  );
  assert(
    lineage.moduleCount === moduleManifests.length,
    "Lineage moduleCount must equal manifest registry size."
  );
  assert(
    lineage.eventContractCount === eventContractRegistry.length,
    "Lineage eventContractCount must equal event contract registry size."
  );
  assert(
    lineage.handoffCount === crossModuleHandoffMap.length,
    "Lineage handoffCount must equal handoff map size."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: default run with deterministic inputs.
  // ────────────────────────────────────────────────────────────────────
  const result = composeBuildSelfReport({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-bsr-smoke",
    commit: "smoke-commit-sha",
    branch: "smoke",
    treeStatus: "clean",
    verifyBackend: "PASS",
    build: "PASS",
    liveFetchEnabled: 0,
    auditChainIntact: "PASS",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      {
        id: "REQ-58",
        name: "Module 44 Disclosure Audit Gate",
        owner: "TBD",
        blocked_reason: "not yet implemented",
        required_evidence: "disclosure audit corpus + prohibited claims red-team",
        promotion_condition: "module 44 ships",
      },
      {
        id: "REQ-59",
        name: "Module 45 Human Authority Registry",
        owner: "TBD",
        blocked_reason: "not yet implemented",
        required_evidence: "named credentialed roles per gate",
        promotion_condition: "module 45 ships",
      },
      {
        id: "REQ-60",
        name: "Live route probe under booted Next.js instance",
        owner: "TBD",
        blocked_reason: "deterministic file-system probe in v0.1",
        required_evidence: "live HTTP 200 + DOM render check",
        promotion_condition: "live-probe harness ships",
      },
    ],
  });

  // Constitutional flags.
  assert(
    result.productionBlocked &&
      result.humanReviewRequired &&
      result.advisoryOnly &&
      result.buildSelfReportInternalOnly &&
      result.noInformationSale &&
      result.noSilentSubmission &&
      result.noSecretDistribution &&
      result.noMarketingLead &&
      result.noFraudAccusation &&
      result.noDenial &&
      result.noRejection &&
      result.noAutonomousLending &&
      result.noAutonomousEligibility &&
      result.noAutonomousPathway &&
      result.noAutonomousOpportunity &&
      result.noAutonomousIntelligence &&
      result.noAutonomousEvidence &&
      result.noAutonomousCertification &&
      result.noAutonomousOnboarding &&
      result.noAutonomousReadiness &&
      result.noPublicVerification &&
      result.noRegulatoryReliance &&
      result.noLenderCommitment &&
      result.noLegalReliance &&
      result.noLiveExternalAction &&
      result.noSourceCertainty &&
      result.noNoticeSend &&
      result.replaySafe &&
      result.auditSafe &&
      result.federationScoped &&
      result.conflictPreserving,
    "Report must preserve every constitutional flag."
  );

  // Header.
  assert(
    result.header.commit === "smoke-commit-sha",
    "Header must reflect the caller-supplied commit."
  );
  assert(
    result.header.totals.modules === moduleManifests.length,
    "Header must report every module."
  );
  assert(
    result.header.totals.modules ===
      result.header.totals.pass +
        result.header.totals.pass_with_warnings +
        result.header.totals.fail +
        result.header.totals.blocked_by_design,
    "Header verdict counts must sum to total modules."
  );

  // Every module row must declare every check cell (no blanks).
  for (const row of result.modules) {
    for (const [key, cell] of Object.entries(row.checks)) {
      const status =
        typeof cell === "string" ? cell : cell.status;
      assert(
        ["PASS", "FAIL", "WARN", "N/A", "BLOCKED_BY_DESIGN"].includes(status),
        `Module ${row.module_id} check ${key} has invalid status "${status}".`
      );
      if (status === "N/A") {
        const reason =
          typeof cell === "object" && cell.reason ? cell.reason : "";
        assert(
          reason.length > 0,
          `Module ${row.module_id} check ${key} marked N/A must carry a reason.`
        );
      }
    }
    assert(
      ["PASS", "FAIL", "WARN", "N/A", "BLOCKED_BY_DESIGN"].includes(
        typeof row.checks.blocks_enforced === "string"
          ? row.checks.blocks_enforced
          : row.checks.blocks_enforced.status
      ),
      `Module ${row.module_id} blocks_enforced has invalid status.`
    );
  }

  // Every finding resolves to REQUIRES_HUMAN_REVIEW.
  for (const finding of result.findings) {
    assert(
      finding.resolution === "REQUIRES_HUMAN_REVIEW",
      `Finding ${finding.findingId} must resolve to REQUIRES_HUMAN_REVIEW.`
    );
    assert(
      finding.evidenceReplayRef.length > 0,
      `Finding ${finding.findingId} must carry an evidence replay reference.`
    );
    assert(
      finding.reviewerExplanation.length > 0,
      `Finding ${finding.findingId} must carry a reviewer explanation.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: gate behavior — live_fetch_enabled != 0 must
  // surface a cross-source conflict and force exit_code 1.
  // ────────────────────────────────────────────────────────────────────
  const liveFetchPack = composeBuildSelfReport({
    commit: "smoke",
    liveFetchEnabled: 1,
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
  });
  assert(
    liveFetchPack.header.exit_code === 1,
    "live_fetch_enabled != 0 must produce exit_code 1."
  );
  assert(
    liveFetchPack.crossSourceConflicts.some(
      (c) => c.conflictId === "bsr-v1-live-fetch-enabled"
    ),
    "live_fetch_enabled != 0 must surface the live-fetch conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: audit chain broken must surface conflict + exit 1.
  // ────────────────────────────────────────────────────────────────────
  const auditBrokenPack = composeBuildSelfReport({
    commit: "smoke",
    auditChainIntact: "FAIL",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
  });
  assert(
    auditBrokenPack.header.exit_code === 1,
    "audit_chain_intact = FAIL must produce exit_code 1."
  );
  assert(
    auditBrokenPack.crossSourceConflicts.some(
      (c) => c.conflictId === "bsr-v1-audit-chain-broken"
    ),
    "audit_chain_intact = FAIL must surface the audit-chain-broken conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: requirements not enumerated must surface conflict.
  // ────────────────────────────────────────────────────────────────────
  const reqGapPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [], // 60 - 57 = 3 pending, but 0 listed
  });
  assert(
    reqGapPack.header.exit_code === 1,
    "requirements-not-enumerated must produce exit_code 1."
  );
  assert(
    reqGapPack.crossSourceConflicts.some(
      (c) => c.conflictId === "bsr-v1-requirements-not-enumerated"
    ),
    "requirements-not-enumerated must surface the requirements conflict."
  );

  // Disclosures + production restrictions.
  assert(
    BUILD_SELF_REPORT_DISCLOSURES.some((d) =>
      d.toLowerCase().includes("blocked_by_design")
    ),
    "Disclosures must include BLOCKED_BY_DESIGN framing."
  );
  assert(
    BUILD_SELF_REPORT_PRODUCTION_RESTRICTIONS.includes("no information sale") &&
      BUILD_SELF_REPORT_PRODUCTION_RESTRICTIONS.includes("no silent submission"),
    "Production restrictions must block information sale and silent submission."
  );

  // Signals.
  assert(
    result.v1Signals.length === BUILD_SELF_REPORT_SIGNAL_IDS.length,
    "Audit must compose all four governed build-self-report signals."
  );

  // Markdown renderer sanity.
  const md = renderBuildSelfReportMarkdown(result);
  assert(
    md.includes(`Build Self-Report — ${result.header.checkpoint}`),
    "Markdown must include the checkpoint header."
  );
  assert(
    md.includes("| # | id | title"),
    "Markdown must include the per-module table header."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-build-self-report"
  );
  assert(
    moduleManifest !== undefined,
    "governance-build-self-report module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Module must be production-blocked and replay-required."
  );
  assert(
    moduleManifest.publicSurfaceAllowed === false,
    "Module must not have a public surface."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.build.self.report.generated"
    ),
    "Module must publish the generated event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.build.self.report.generated"
  );
  assert(contract !== undefined, "Event contract must be registered.");
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Event contract must not be public-surface allowed."
  );

  // Handoff conformance.
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-build-self-report" ||
      handoff.toModuleId === "governance-build-self-report"
  );
  assert(
    handoffs.length >= 8,
    "Build Self-Report module must declare at least eight governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some((h) => h.toModuleId === "build-preservation"),
    "Build Self-Report must hand off to build-preservation (Module 42)."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
        specVersion: BUILD_SELF_REPORT_SPEC_VERSION,
        modulesAudited: result.summary.modulesAudited,
        modulesPass: result.summary.modulesPass,
        modulesPassWithWarnings: result.summary.modulesPassWithWarnings,
        modulesFail: result.summary.modulesFail,
        modulesBlockedByDesign: result.summary.modulesBlockedByDesign,
        orphansNoConsumer: result.summary.orphansNoConsumer,
        orphansNoProducer: result.summary.orphansNoProducer,
        orphansDangling: result.summary.orphansDangling,
        danglingEventContracts: result.summary.danglingEventContracts,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        defaultExitCode: result.header.exit_code,
        liveFetchPackExitCode: liveFetchPack.header.exit_code,
        auditBrokenPackExitCode: auditBrokenPack.header.exit_code,
        reqGapPackExitCode: reqGapPack.header.exit_code,
        handoffs: handoffs.length,
        message: "Build Self-Report v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
