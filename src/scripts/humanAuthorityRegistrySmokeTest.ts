import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  HUMAN_AUTHORITY_BINDINGS,
  HUMAN_AUTHORITY_REGISTRY_DOC_REF,
  HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
  HUMAN_AUTHORITY_REGISTRY_SIGNAL_IDS,
  HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
  HUMAN_AUTHORITY_ROLE_REGISTRY,
  composeHumanAuthorityRegistry,
  deriveModuleIntent,
  humanAuthorityRegistryLineage,
  moduleHumanAuthorityResolutionFor,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // ────────────────────────────────────────────────────────────────────
  // Version + doc seal
  // ────────────────────────────────────────────────────────────────────
  assert(
    HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION ===
      "human-authority-registry-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION ===
      "module-45-human-authority-registry-spec-v1.0",
    "Spec version must match v1.0 seal."
  );
  assert(
    HUMAN_AUTHORITY_REGISTRY_DOC_REF ===
      "docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md",
    "Doc ref must point at the canonical Module 45 doctrine doc."
  );

  const lineage = humanAuthorityRegistryLineage();
  assert(
    lineage.runtimeVersion === HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
    "Lineage runtime version must equal canonical."
  );
  assert(
    lineage.bindingCount === HUMAN_AUTHORITY_BINDINGS.length,
    "Lineage bindingCount must equal canonical registry size."
  );
  assert(
    lineage.roleCount === HUMAN_AUTHORITY_ROLE_REGISTRY.length,
    "Lineage roleCount must equal canonical role registry size."
  );

  // ────────────────────────────────────────────────────────────────────
  // §4 hard rule: every binding must declare ai_permitted = false
  // (constitutional violation otherwise).
  // ────────────────────────────────────────────────────────────────────
  for (const b of HUMAN_AUTHORITY_BINDINGS) {
    assert(
      b.clearing_rule.ai_permitted === false,
      `Binding ${b.binding_id} must have ai_permitted = false.`
    );
    assert(
      b.clearing_rule.no_self_clear === true,
      `Binding ${b.binding_id} must have no_self_clear = true.`
    );
    if (b.clearing_rule.mode === "quorum") {
      assert(
        b.clearing_rule.min_approvers >= 2,
        `Binding ${b.binding_id}: quorum mode requires min_approvers >= 2.`
      );
    }
    assert(
      b.audit_event === "authority.cleared",
      `Binding ${b.binding_id}: every clear must emit authority.cleared.`
    );
    assert(
      b.required_roles.length > 0,
      `Binding ${b.binding_id} must declare at least one required role.`
    );
    for (const role of b.required_roles) {
      assert(
        HUMAN_AUTHORITY_ROLE_REGISTRY.some((r) => r.roleId === role),
        `Binding ${b.binding_id} references unknown role ${role}.`
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Module 45 itself must have a binding (it amends the registry).
  // ────────────────────────────────────────────────────────────────────
  const module45Binding = HUMAN_AUTHORITY_BINDINGS.find(
    (b) => b.module_id === "governance-human-authority-registry"
  );
  assert(
    module45Binding !== undefined,
    "Module 45 must have its own binding (amend registry)."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: no filled roles. Coverage holds, no-AI holds, but
  // every alpha_required module with a binding reports FAIL because
  // the role is unfilled. exit code must be 1.
  // ────────────────────────────────────────────────────────────────────
  const baselinePack = composeHumanAuthorityRegistry();

  assert(
    baselinePack.productionBlocked &&
      baselinePack.humanReviewRequired &&
      baselinePack.advisoryOnly &&
      baselinePack.humanAuthorityRegistryInternalOnly &&
      baselinePack.noAiClearing &&
      baselinePack.noSelfClear &&
      baselinePack.noAutonomousDetermination &&
      baselinePack.noInformationSale &&
      baselinePack.noSilentSubmission &&
      baselinePack.noApproval &&
      baselinePack.noDenial &&
      baselinePack.noLenderCommitment &&
      baselinePack.noLegalReliance &&
      baselinePack.noPublicVerification &&
      baselinePack.noRegulatoryReliance &&
      baselinePack.noLiveExternalAction &&
      baselinePack.noSourceCertainty &&
      baselinePack.noNoticeSend &&
      baselinePack.replaySafe &&
      baselinePack.auditSafe &&
      baselinePack.federationScoped &&
      baselinePack.conflictPreserving,
    "Baseline pack must preserve every constitutional flag."
  );
  assert(
    baselinePack.exitCode === 1,
    "Baseline pack must exit 1 (alpha_required roles unfilled)."
  );

  // Findings must include at least one ALPHA_REQUIRED_ROLE_UNFILLED.
  assert(
    baselinePack.findings.some(
      (f) => f.category === "ALPHA_REQUIRED_ROLE_UNFILLED"
    ),
    "Baseline pack must surface ALPHA_REQUIRED_ROLE_UNFILLED finding(s)."
  );
  // No binding-rule findings should fire on the canonical registry.
  assert(
    !baselinePack.findings.some(
      (f) =>
        f.category === "BINDING_AI_PERMITTED" ||
        f.category === "BINDING_SELF_CLEAR_ALLOWED" ||
        f.category === "BINDING_QUORUM_INVALID" ||
        f.category === "BINDING_UNKNOWN_ROLE"
    ),
    "Canonical registry must not emit binding-rule findings."
  );
  // Coverage must hold for every clearable module we covered.
  for (const r of baselinePack.moduleResolutions) {
    if (r.intent === "alpha_required" && r.bindingCount === 0) {
      // Coverage hole would emit MODULE_BINDING_COVERAGE_MISSING.
      // We tolerate alpha_required modules with no binding here only
      // if they are not authority-clearing (e.g. read-only governance
      // composition modules). The finding fires either way and is
      // surfaced. We don't fail the smoke test on coverage gaps —
      // we just confirm the finding is emitted.
      assert(
        baselinePack.findings.some(
          (f) =>
            f.category === "MODULE_BINDING_COVERAGE_MISSING" &&
            f.subjectModuleId === r.moduleId
        ),
        `Coverage gap on ${r.moduleId} must emit MODULE_BINDING_COVERAGE_MISSING.`
      );
    }
  }

  // Every finding resolves to REQUIRES_HUMAN_REVIEW.
  for (const finding of baselinePack.findings) {
    assert(
      finding.resolution === "REQUIRES_HUMAN_REVIEW",
      `Finding ${finding.findingId} must resolve to REQUIRES_HUMAN_REVIEW.`
    );
    assert(
      finding.evidenceReplayRef.length > 0,
      `Finding ${finding.findingId} must carry an evidence replay reference.`
    );
    assert(
      finding.doctrineRefs.length > 0,
      `Finding ${finding.findingId} must reference doctrine.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: fill every alpha_required role. exit code must drop
  // to 0 (alpha set is covered + roles filled + no AI + no self-clear).
  // ────────────────────────────────────────────────────────────────────
  const allAlphaRolesFilled = composeHumanAuthorityRegistry({
    reviewerRole: "Qualified Governance Reviewer",
    filledRoles: HUMAN_AUTHORITY_ROLE_REGISTRY.map((r) => ({
      roleId: r.roleId,
      filledByCount: 2,
      recordedBy: "Chief Governance Authority",
      recordedAt: "2026-06-04T00:00:00Z",
    })),
  });
  assert(
    allAlphaRolesFilled.exitCode === 0,
    "Pack with every role filled must exit 0."
  );
  assert(
    allAlphaRolesFilled.summary.modulesAuthorityFail === 0,
    "Pack with every role filled must have zero authority-FAIL modules."
  );
  assert(
    allAlphaRolesFilled.summary.modulesAuthorityPass > 0,
    "Pack with every role filled must report some authority-PASS modules."
  );

  // ────────────────────────────────────────────────────────────────────
  // §2 verdict-resolution semantics: alpha_required + roles filled
  // resolves to PASS; intentionally_held + roles filled stays
  // intentionally_held (the build-self-report consumer is responsible
  // for translating it to BLOCKED_BY_DESIGN).
  // ────────────────────────────────────────────────────────────────────
  const intentionallyHeld = allAlphaRolesFilled.moduleResolutions.filter(
    (r) => r.intent === "intentionally_held"
  );
  for (const r of intentionallyHeld) {
    if (r.bindingCount > 0) {
      assert(
        r.status === "PASS" || r.status === "WARN",
        `Intentionally-held module ${r.moduleId} with binding must be PASS or WARN (never FAIL when roles filled).`
      );
    }
  }
  const alphaRequired = allAlphaRolesFilled.moduleResolutions.filter(
    (r) => r.intent === "alpha_required" && r.bindingCount > 0
  );
  for (const r of alphaRequired) {
    assert(
      r.status === "PASS",
      `Alpha-required module ${r.moduleId} with binding + roles filled must be PASS, got ${r.status}.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // moduleHumanAuthorityResolutionFor consumer helper (used by
  // Build Self-Report).
  // ────────────────────────────────────────────────────────────────────
  const applicationsManifest = moduleManifests.find(
    (m) => m.id === "applications"
  );
  assert(
    applicationsManifest !== undefined,
    "applications module manifest must exist for resolver test."
  );
  const applicationsIntent = deriveModuleIntent(applicationsManifest);
  assert(
    applicationsIntent === "alpha_required",
    `applications must be alpha_required, got ${applicationsIntent}.`
  );
  const applicationsResolutionUnfilled =
    moduleHumanAuthorityResolutionFor(applicationsManifest, []);
  assert(
    applicationsResolutionUnfilled.status === "FAIL",
    "applications with no filled roles must be FAIL."
  );
  const applicationsResolutionFilled = moduleHumanAuthorityResolutionFor(
    applicationsManifest,
    HUMAN_AUTHORITY_ROLE_REGISTRY.map((r) => ({
      roleId: r.roleId,
      filledByCount: 2,
      recordedBy: "Chief Governance Authority",
      recordedAt: "2026-06-04T00:00:00Z",
    }))
  );
  assert(
    applicationsResolutionFilled.status === "PASS",
    "applications with roles filled must be PASS."
  );

  // ────────────────────────────────────────────────────────────────────
  // Signals
  // ────────────────────────────────────────────────────────────────────
  assert(
    HUMAN_AUTHORITY_REGISTRY_SIGNAL_IDS.length === 4,
    "Runtime must declare exactly four governed signals."
  );
  const coverageSignal = allAlphaRolesFilled.v1Signals.find(
    (s) => s.id === "coverage_alignment"
  );
  assert(coverageSignal !== undefined, "coverage_alignment signal must exist.");
  const noAiSignal = allAlphaRolesFilled.v1Signals.find(
    (s) => s.id === "no_ai_alignment"
  );
  assert(noAiSignal !== undefined, "no_ai_alignment signal must exist.");
  assert(
    noAiSignal.status === "READY_FOR_REVIEW",
    "no_ai_alignment must be READY (every binding has ai_permitted = false)."
  );
  const sodSignal = allAlphaRolesFilled.v1Signals.find(
    (s) => s.id === "separation_of_duties_alignment"
  );
  assert(sodSignal !== undefined, "separation_of_duties_alignment must exist.");
  assert(
    sodSignal.status === "READY_FOR_REVIEW",
    "separation_of_duties_alignment must be READY."
  );

  // ────────────────────────────────────────────────────────────────────
  // Module manifest conformance
  // ────────────────────────────────────────────────────────────────────
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-human-authority-registry"
  );
  assert(
    moduleManifest !== undefined,
    "governance-human-authority-registry module manifest must be registered."
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
      "governance.human.authority.registry.verified"
    ),
    "Module must publish the verified event."
  );

  // ────────────────────────────────────────────────────────────────────
  // Event contract conformance
  // ────────────────────────────────────────────────────────────────────
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.human.authority.registry.verified"
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

  // ────────────────────────────────────────────────────────────────────
  // Handoff conformance
  // ────────────────────────────────────────────────────────────────────
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-human-authority-registry" ||
      handoff.toModuleId === "governance-human-authority-registry"
  );
  assert(
    handoffs.length >= 8,
    "Human Authority Registry module must declare at least eight governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
        specVersion: HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
        docRef: HUMAN_AUTHORITY_REGISTRY_DOC_REF,
        bindingCount: HUMAN_AUTHORITY_BINDINGS.length,
        roleCount: HUMAN_AUTHORITY_ROLE_REGISTRY.length,
        baselineExitCode: baselinePack.exitCode,
        baselineModulesPass: baselinePack.summary.modulesAuthorityPass,
        baselineModulesFail: baselinePack.summary.modulesAuthorityFail,
        baselineFindingCount: baselinePack.summary.findingCount,
        baselineCrossSourceConflictCount:
          baselinePack.summary.crossSourceConflictCount,
        filledExitCode: allAlphaRolesFilled.exitCode,
        filledModulesPass: allAlphaRolesFilled.summary.modulesAuthorityPass,
        filledModulesFail: allAlphaRolesFilled.summary.modulesAuthorityFail,
        filledFindingCount: allAlphaRolesFilled.summary.findingCount,
        handoffs: handoffs.length,
        message: "Human Authority Registry v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
