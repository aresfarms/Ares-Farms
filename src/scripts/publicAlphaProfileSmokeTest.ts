import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  PUBLIC_ALPHA_DEFINITION_DOC_REF,
  PUBLIC_ALPHA_DEFINITION_VERSION,
  PUBLIC_ALPHA_ENTRY_CRITERIA,
  PUBLIC_ALPHA_EXIT_CRITERIA,
  PUBLIC_ALPHA_OFF_CAPABILITIES,
  PUBLIC_ALPHA_ON_CAPABILITIES,
  PUBLIC_ALPHA_OPEN_DECISIONS,
  PUBLIC_ALPHA_PROFILE_DISCLOSURES,
  PUBLIC_ALPHA_PROFILE_PRODUCTION_RESTRICTIONS,
  PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
  PUBLIC_ALPHA_PROFILE_SIGNAL_IDS,
  composePublicAlphaProfile,
  publicAlphaProfileLineage,
} from "@/lib/public-alpha/publicAlphaProfileRuntime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION ===
      "public-alpha-profile-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    PUBLIC_ALPHA_DEFINITION_VERSION === "public-alpha-definition-v1.0",
    "Definition version must match v1.0 seal."
  );
  assert(
    PUBLIC_ALPHA_DEFINITION_DOC_REF ===
      "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md",
    "Definition doc ref must point at the canonical doctrine doc."
  );

  const lineage = publicAlphaProfileLineage();
  assert(
    lineage.runtimeVersion === PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
    "Lineage runtime version must equal canonical."
  );
  assert(
    lineage.definitionVersion === PUBLIC_ALPHA_DEFINITION_VERSION,
    "Lineage definition version must equal canonical."
  );
  assert(
    lineage.onCapabilityCount === PUBLIC_ALPHA_ON_CAPABILITIES.length,
    "Lineage onCapabilityCount must equal ON capability registry size."
  );
  assert(
    lineage.offCapabilityCount === PUBLIC_ALPHA_OFF_CAPABILITIES.length,
    "Lineage offCapabilityCount must equal OFF capability registry size."
  );
  assert(
    lineage.entryCriterionCount === PUBLIC_ALPHA_ENTRY_CRITERIA.length,
    "Lineage entryCriterionCount must equal entry criteria registry size."
  );
  assert(
    lineage.exitCriterionCount === PUBLIC_ALPHA_EXIT_CRITERIA.length,
    "Lineage exitCriterionCount must equal exit criteria registry size."
  );
  assert(
    lineage.openDecisionCount === PUBLIC_ALPHA_OPEN_DECISIONS.length,
    "Lineage openDecisionCount must equal open decision registry size."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: default run with no decision sign-offs. Alpha entry
  // must be PENDING_SIGNOFF (because §9 decisions are not yet
  // recorded) AND/OR FAIL (because Module 44/45 do not yet exist).
  // ────────────────────────────────────────────────────────────────────
  const noSignoffPack = composePublicAlphaProfile({
    reviewerRole: "Qualified Governance Reviewer",
    selfReportInput: { commit: "pap-smoke" },
  });

  assert(
    noSignoffPack.productionBlocked &&
      noSignoffPack.humanReviewRequired &&
      noSignoffPack.advisoryOnly &&
      noSignoffPack.publicAlphaProfileInternalOnly &&
      noSignoffPack.noAlphaEntryAuthorization &&
      noSignoffPack.noInformationSale &&
      noSignoffPack.noSilentSubmission &&
      noSignoffPack.noSecretDistribution &&
      noSignoffPack.noMarketingLead &&
      noSignoffPack.noFraudAccusation &&
      noSignoffPack.noDenial &&
      noSignoffPack.noRejection &&
      noSignoffPack.noApproval &&
      noSignoffPack.noPreapproval &&
      noSignoffPack.noLenderCommitment &&
      noSignoffPack.noLegalReliance &&
      noSignoffPack.noPublicVerification &&
      noSignoffPack.noRegulatoryReliance &&
      noSignoffPack.noLiveExternalAction &&
      noSignoffPack.noSourceCertainty &&
      noSignoffPack.noNoticeSend &&
      noSignoffPack.replaySafe &&
      noSignoffPack.auditSafe &&
      noSignoffPack.federationScoped &&
      noSignoffPack.conflictPreserving,
    "Default pack must preserve every constitutional flag."
  );
  assert(
    noSignoffPack.alphaEntryAllowed === "FAIL" ||
      noSignoffPack.alphaEntryAllowed === "PENDING_SIGNOFF",
    "Default pack alpha_entry_allowed must be FAIL or PENDING_SIGNOFF (never PASS without sign-off)."
  );
  assert(
    noSignoffPack.summary.openDecisionsPendingSignoff ===
      PUBLIC_ALPHA_OPEN_DECISIONS.length,
    "Default pack must report every §9 decision as PENDING_SIGNOFF."
  );
  assert(
    noSignoffPack.openDecisionsEvaluation.every(
      (d) => d.status === "PENDING_SIGNOFF"
    ),
    "Default pack must mark every §9 decision PENDING_SIGNOFF."
  );

  // Every finding resolves to REQUIRES_HUMAN_REVIEW.
  for (const finding of noSignoffPack.findings) {
    assert(
      finding.resolution === "REQUIRES_HUMAN_REVIEW",
      `Finding ${finding.findingId} must resolve to REQUIRES_HUMAN_REVIEW.`
    );
    assert(
      finding.evidenceReplayRef.length > 0,
      `Finding ${finding.findingId} must carry an evidence replay reference.`
    );
    assert(
      finding.doctrineSectionRef.length > 0,
      `Finding ${finding.findingId} must reference a doctrine section.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: all §9 decisions signed off but Modules 44/45 still
  // missing — alpha_entry_allowed must remain FAIL or
  // PENDING_SIGNOFF (still not PASS) because Module 44/45 entry
  // criteria report PENDING_SIGNOFF.
  // ────────────────────────────────────────────────────────────────────
  const allSignoffsPack = composePublicAlphaProfile({
    selfReportInput: { commit: "pap-smoke-full-signoff" },
    decisionSignoffs: PUBLIC_ALPHA_OPEN_DECISIONS.map((d) => ({
      decisionId: d.id,
      recorded_value: "(test)",
      recorded_by: "Qualified Governance Reviewer",
      recorded_at: "2026-06-04T00:00:00Z",
    })),
  });
  assert(
    allSignoffsPack.summary.openDecisionsRecorded ===
      PUBLIC_ALPHA_OPEN_DECISIONS.length,
    "All-signoffs pack must report every §9 decision as RECORDED."
  );
  assert(
    allSignoffsPack.alphaEntryAllowed === "FAIL" ||
      allSignoffsPack.alphaEntryAllowed === "PENDING_SIGNOFF",
    "All-signoffs pack must still not be PASS until Modules 44/45 land."
  );

  // ────────────────────────────────────────────────────────────────────
  // Disclosures + production restrictions.
  // ────────────────────────────────────────────────────────────────────
  assert(
    PUBLIC_ALPHA_PROFILE_DISCLOSURES.some((d) =>
      d.toLowerCase().includes("does not authorize alpha entry")
    ),
    "Disclosures must include 'does not authorize Alpha entry'."
  );
  assert(
    PUBLIC_ALPHA_PROFILE_PRODUCTION_RESTRICTIONS.includes(
      "no Alpha entry authorization"
    ),
    "Production restrictions must block Alpha entry authorization."
  );

  // Registry sanity.
  const onIds = PUBLIC_ALPHA_ON_CAPABILITIES.map((c) => c.id);
  assert(onIds.includes("application_intake"), "§3 must include application_intake.");
  assert(onIds.includes("human_review_and_transition"), "§3 must include human review.");
  assert(onIds.includes("append_only_audit_replay"), "§3 must include audit/replay.");
  const offIds = PUBLIC_ALPHA_OFF_CAPABILITIES.map((c) => c.id);
  assert(offIds.includes("payment_capture"), "§4 must include payment capture.");
  assert(
    offIds.includes("live_scraper_or_live_fetch"),
    "§4 must include live scraper / live fetch."
  );
  assert(
    offIds.includes("regulatory_examination_submission_or_response"),
    "§4 must include regulatory examination submission/response."
  );
  const entryIds = PUBLIC_ALPHA_ENTRY_CRITERIA.map((e) => e.id);
  assert(
    entryIds.includes("self_report_exit_code_zero_for_alpha_set"),
    "§6 must include self-report exit code 0."
  );
  assert(
    entryIds.includes("module_44_disclosure_audit_green"),
    "§6 must include Module 44 disclosure audit."
  );
  assert(
    entryIds.includes("module_45_human_authority_assigned"),
    "§6 must include Module 45 human authority."
  );
  const exitIds = PUBLIC_ALPHA_EXIT_CRITERIA.map((e) => e.id);
  assert(
    exitIds.includes("cohort_end_to_end_zero_reliance_incidents"),
    "§7 must include cohort end-to-end zero reliance."
  );
  const decisionIds = PUBLIC_ALPHA_OPEN_DECISIONS.map((d) => d.id);
  assert(
    decisionIds.includes("sustained_window_duration"),
    "§9 must include sustained window duration."
  );
  assert(
    decisionIds.includes("named_governance_authority"),
    "§9 must include named governance authority."
  );

  // Signals.
  assert(
    PUBLIC_ALPHA_PROFILE_SIGNAL_IDS.length === 4,
    "Runtime must declare exactly four governed Alpha-profile signals."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-public-alpha-profile"
  );
  assert(
    moduleManifest !== undefined,
    "governance-public-alpha-profile module manifest must be registered."
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
      "governance.public.alpha.profile.evaluated"
    ),
    "Module must publish the evaluated event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.public.alpha.profile.evaluated"
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
      handoff.fromModuleId === "governance-public-alpha-profile" ||
      handoff.toModuleId === "governance-public-alpha-profile"
  );
  assert(
    handoffs.length >= 8,
    "Public Alpha Profile module must declare at least eight governed handoff routes."
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
        runtimeVersion: PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
        definitionVersion: PUBLIC_ALPHA_DEFINITION_VERSION,
        definitionDocRef: PUBLIC_ALPHA_DEFINITION_DOC_REF,
        onCapabilityCount: lineage.onCapabilityCount,
        offCapabilityCount: lineage.offCapabilityCount,
        entryCriterionCount: lineage.entryCriterionCount,
        exitCriterionCount: lineage.exitCriterionCount,
        openDecisionCount: lineage.openDecisionCount,
        noSignoffAlphaEntryAllowed: noSignoffPack.alphaEntryAllowed,
        noSignoffOpenDecisionsPending:
          noSignoffPack.summary.openDecisionsPendingSignoff,
        noSignoffOnCapabilitiesPass: noSignoffPack.summary.onCapabilitiesPass,
        noSignoffOffCapabilitiesBlocked:
          noSignoffPack.summary.offCapabilitiesPassOrBlockedByDesign,
        noSignoffEntryCriteriaPass: noSignoffPack.summary.entryCriteriaPass,
        noSignoffFindingCount: noSignoffPack.summary.findingCount,
        noSignoffCrossSourceConflictCount:
          noSignoffPack.summary.crossSourceConflictCount,
        allSignoffsAlphaEntryAllowed: allSignoffsPack.alphaEntryAllowed,
        allSignoffsOpenDecisionsRecorded:
          allSignoffsPack.summary.openDecisionsRecorded,
        handoffs: handoffs.length,
        message: "Public Alpha Profile v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
