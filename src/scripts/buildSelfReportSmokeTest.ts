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
  // Classification Change Registry — canonical file (default path).
  // Scenario A reads docs/CLASSIFICATION_CHANGE_REGISTRY.md from the
  // repo root. Per VIA-GOVERNANCE-CLASSIFICATION-001 it must parse and
  // surface the active entries. CCR-2026-001 resolved (its resolution
  // criteria are met since verify:human-authority exits 0); -002/-003/
  // -004 remain ACTIVE (held for Alpha until their capabilities lift).
  // ────────────────────────────────────────────────────────────────────
  const ccr = result.classificationChangeRegistry;
  assert(
    ccr.parsed,
    `Canonical Classification Change Registry must parse. Error: ${ccr.error ?? "(none)"}`
  );
  const allCcr = [...ccr.activeEntries, ...ccr.historicalEntries];
  const ccrById = (id: string) => allCcr.find((e) => e.id === id);
  assert(
    ccrById("CCR-2026-001")?.status === "RESOLVED",
    "CCR-2026-001 must be RESOLVED (resolution criteria met at Build 39)."
  );
  for (const activeId of ["CCR-2026-002", "CCR-2026-003", "CCR-2026-004"]) {
    const entry = ccrById(activeId);
    assert(
      entry?.status === "ACTIVE",
      `${activeId} must be ACTIVE in the canonical registry.`
    );
    assert(
      ccr.activeEntries.some((e) => e.id === activeId),
      `${activeId} must appear in activeEntries[].`
    );
  }
  assert(
    !ccr.activeEntries.some((e) => e.id === "CCR-2026-001"),
    "CCR-2026-001 (RESOLVED) must NOT count as active."
  );
  // Every active entry must carry the full required field set.
  for (const entry of ccr.activeEntries) {
    assert(
      entry.id.length > 0 &&
        entry.title.length > 0 &&
        entry.previousState.length > 0 &&
        entry.newState.length > 0 &&
        entry.reason.length > 0 &&
        entry.approver.length > 0 &&
        entry.effectiveDate.length > 0 &&
        entry.resolutionCriteria.length > 0,
      `Active CCR ${entry.id} must carry every required field.`
    );
  }
  // Markdown must surface the active-changes section + each active id.
  const ccrMd = renderBuildSelfReportMarkdown(result);
  assert(
    ccrMd.includes("## Active Classification Changes"),
    "Markdown must include the Active Classification Changes section."
  );
  for (const activeId of ["CCR-2026-002", "CCR-2026-003", "CCR-2026-004"]) {
    assert(
      ccrMd.includes(activeId),
      `Markdown active-changes section must render ${activeId}.`
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

  // ────────────────────────────────────────────────────────────────────
  // Scenario E: malformed CCR — an ACTIVE entry missing a required
  // field must fail the report closed (exit 1) and surface a finding +
  // cross-source conflict. Proves "if an active CCR lacks required
  // fields, build:self-report fails closed."
  // ────────────────────────────────────────────────────────────────────
  const malformedCcrMarkdown = [
    "# Classification Change Registry",
    "",
    "<!-- ccr:meta",
    "id: CCR-TEST-MALFORMED",
    "title: Malformed active entry (missing reason)",
    "status: ACTIVE",
    "previousState: ACTIVE_FILL",
    "newState: HELD_FOR_ALPHA",
    "approver: Founder Governance Review",
    "effectiveDate: 2026-06-04",
    "resolutionCriteria: never",
    "-->",
    "",
  ].join("\n");
  const malformedPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
    classificationChangeRegistryMarkdown: malformedCcrMarkdown,
  });
  assert(
    malformedPack.classificationChangeRegistry.parsed === false,
    "Malformed CCR (active entry missing required field) must not parse."
  );
  assert(
    malformedPack.header.exit_code === 1,
    "Malformed CCR must fail the report closed (exit_code 1)."
  );
  assert(
    malformedPack.classificationChangeRegistry.activeCount === 0,
    "A failed parse must emit zero active entries."
  );
  assert(
    malformedPack.findings.some(
      (f) => f.category === "CLASSIFICATION_REGISTRY_PARSE_FAIL"
    ),
    "Malformed CCR must surface a CLASSIFICATION_REGISTRY_PARSE_FAIL finding."
  );
  assert(
    malformedPack.crossSourceConflicts.some(
      (c) => c.conflictId === "bsr-v1-classification-registry-parse-fail"
    ),
    "Malformed CCR must surface the classification-registry-parse-fail conflict."
  );

  // A junk line inside a meta block must also fail closed.
  const junkLineCcrMarkdown = [
    "<!-- ccr:meta",
    "id: CCR-TEST-JUNK",
    "title: Junk line entry",
    "status: ACTIVE",
    "this line has no key colon value structure",
    "-->",
  ].join("\n");
  const junkPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
    classificationChangeRegistryMarkdown: junkLineCcrMarkdown,
  });
  assert(
    junkPack.classificationChangeRegistry.parsed === false &&
      junkPack.header.exit_code === 1,
    "A malformed meta line must fail the report closed."
  );

  // Invalid status must fail closed.
  const badStatusCcrMarkdown = [
    "<!-- ccr:meta",
    "id: CCR-TEST-BADSTATUS",
    "title: Bad status entry",
    "status: PENDING",
    "-->",
  ].join("\n");
  const badStatusPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
    classificationChangeRegistryMarkdown: badStatusCcrMarkdown,
  });
  assert(
    badStatusPack.classificationChangeRegistry.parsed === false &&
      badStatusPack.header.exit_code === 1,
    "An invalid status value must fail the report closed."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario F: empty registry — a registry with no active CCRs must
  // NOT fail the report. Proves "empty registry does not fail if no
  // active CCRs exist." Covers both a literally empty file and a file
  // whose only entry is RESOLVED (historical, not active).
  // ────────────────────────────────────────────────────────────────────
  const emptyCcrPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
    classificationChangeRegistryMarkdown: "",
  });
  assert(
    emptyCcrPack.classificationChangeRegistry.parsed === true,
    "An empty registry must parse (no entries is not a failure)."
  );
  assert(
    emptyCcrPack.classificationChangeRegistry.activeCount === 0,
    "An empty registry must emit zero active entries."
  );
  assert(
    emptyCcrPack.header.exit_code === 0,
    "An empty registry with no active CCRs must NOT fail the report."
  );
  assert(
    !emptyCcrPack.findings.some(
      (f) => f.category === "CLASSIFICATION_REGISTRY_PARSE_FAIL"
    ),
    "An empty registry must not surface a parse-fail finding."
  );

  const historyOnlyCcrMarkdown = [
    "<!-- ccr:meta",
    "id: CCR-TEST-RESOLVED",
    "title: Resolved-only entry",
    "status: RESOLVED",
    "-->",
  ].join("\n");
  const historyOnlyPack = composeBuildSelfReport({
    commit: "smoke",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [
      { id: "REQ-58", name: "p1" },
      { id: "REQ-59", name: "p2" },
      { id: "REQ-60", name: "p3" },
    ],
    classificationChangeRegistryMarkdown: historyOnlyCcrMarkdown,
  });
  assert(
    historyOnlyPack.classificationChangeRegistry.parsed === true &&
      historyOnlyPack.classificationChangeRegistry.activeCount === 0 &&
      historyOnlyPack.classificationChangeRegistry.historicalCount === 1 &&
      historyOnlyPack.header.exit_code === 0,
    "A registry whose only entry is RESOLVED must parse, count 0 active, and not fail."
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
        classificationRegistryParsed:
          result.classificationChangeRegistry.parsed,
        classificationChangesActive:
          result.summary.classificationChangesActive,
        classificationChangesHistorical:
          result.summary.classificationChangesHistorical,
        malformedCcrExitCode: malformedPack.header.exit_code,
        emptyCcrExitCode: emptyCcrPack.header.exit_code,
        handoffs: handoffs.length,
        message: "Build Self-Report v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
