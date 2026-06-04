import {
  DATA_TRANSPARENCY_DOCTRINE_DOC_REF,
  DATA_TRANSPARENCY_DOCTRINE_VERSION,
  DATA_TRANSPARENCY_ESCALATION_STAGES,
  DATA_TRANSPARENCY_POSTURE_DISCLOSURES,
  DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS,
  DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
  DATA_TRANSPARENCY_POSTURE_SIGNAL_IDS,
  DATA_TRANSPARENCY_REQUIRED_EXPLANATION_TOPICS,
  composeDataTransparencyPosture,
  dataTransparencyPostureLineage,
} from "@/lib/transparency/dataTransparencyPostureRuntime";
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
    DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION ===
      "data-transparency-posture-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    DATA_TRANSPARENCY_DOCTRINE_VERSION ===
      "data-transparency-user-sovereignty-doctrine-v1.0",
    "Doctrine version must match v1.0 seal."
  );
  assert(
    DATA_TRANSPARENCY_DOCTRINE_DOC_REF ===
      "docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md",
    "Doctrine doc ref must point at the canonical doctrine doc."
  );

  // Lineage sanity.
  const lineage = dataTransparencyPostureLineage();
  assert(
    lineage.runtimeVersion === DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
    "Lineage runtime version must equal canonical runtime version."
  );
  assert(
    lineage.doctrineVersion === DATA_TRANSPARENCY_DOCTRINE_VERSION,
    "Lineage doctrine version must equal canonical doctrine version."
  );
  assert(
    lineage.moduleCount === moduleManifests.length,
    "Lineage moduleCount must equal the module registry size."
  );
  assert(
    lineage.eventContractCount === eventContractRegistry.length,
    "Lineage eventContractCount must equal the event contract registry size."
  );
  assert(
    lineage.handoffCount === crossModuleHandoffMap.length,
    "Lineage handoffCount must equal the handoff map size."
  );
  assert(
    lineage.escalationStageCount === 4,
    "Doctrine declares exactly four escalation stages."
  );
  assert(
    lineage.requiredExplanationTopicCount === 10,
    "Doctrine declares ten required explanation topics."
  );

  // ────────────────────────────────────────────────────────────────────
  // Audit composition.
  // ────────────────────────────────────────────────────────────────────
  const result = composeDataTransparencyPosture({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-dtp-smoke",
  });

  // Constitutional flags.
  assert(
    result.productionBlocked &&
      result.humanReviewRequired &&
      result.advisoryOnly &&
      result.dataTransparencyPostureInternalOnly &&
      result.userSovereigntyPreserved &&
      result.noSilentSubmission &&
      result.noSecretDistribution &&
      result.noMarketingLead &&
      result.noInformationSale &&
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
    "Audit pack must preserve every constitutional flag."
  );

  // Signal coverage.
  assert(
    result.v1Signals.length === DATA_TRANSPARENCY_POSTURE_SIGNAL_IDS.length,
    "Audit must compose all four governed transparency posture signals."
  );

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
      finding.reviewRoute === "/governance/data-transparency-posture",
      `Finding ${finding.findingId} must route to the governance audit page.`
    );
    assert(
      finding.doctrineRefs.includes(DATA_TRANSPARENCY_DOCTRINE_VERSION),
      `Finding ${finding.findingId} must carry the doctrine version ref.`
    );
    assert(
      finding.reviewerExplanation.length > 0,
      `Finding ${finding.findingId} must carry a reviewer explanation.`
    );
    assert(
      finding.topic.length > 0,
      `Finding ${finding.findingId} must carry a topic.`
    );
    assert(
      finding.doctrineSectionRef.length > 0,
      `Finding ${finding.findingId} must reference a doctrine section.`
    );
  }

  // Audit math sanity.
  assert(
    result.summary.modulesAudited === moduleManifests.length,
    "Audit must include every module manifest."
  );
  assert(
    result.summary.eventContractsAudited === eventContractRegistry.length,
    "Audit must include every event contract."
  );
  assert(
    result.summary.handoffsAudited === crossModuleHandoffMap.length,
    "Audit must include every handoff."
  );
  assert(
    result.summary.escalationStagesAudited === 4,
    "Audit must include four escalation stages."
  );
  assert(
    result.summary.borrowerTouchingModulesAudited > 0,
    "Audit must classify at least some modules as borrower-touching."
  );

  // Escalation stage coverage — all four stages should be represented
  // by at least one module in the current backbone.
  for (const stage of result.escalationStageAudits) {
    assert(
      stage.represented,
      `Escalation stage ${stage.stageId} must be represented by at least one module.`
    );
    assert(
      stage.representingModuleIds.length > 0,
      `Escalation stage ${stage.stageId} must declare at least one representing module.`
    );
  }
  assert(
    result.summary.escalationStagesMissing === 0,
    "All four doctrine-required escalation stages must be represented."
  );

  // No silent submission on handoffs (every handoff must already be
  // production-blocked + human-review-bound + replay-required, which
  // we asserted in the module conformance test).
  assert(
    result.summary.handoffsWithSilentSubmissionRisk === 0,
    "No handoff may surface silent-submission risk."
  );

  // The audit is expected to surface findings on the existing
  // modules — this is intentional. The smoke test asserts that
  // when findings exist, the corresponding cross-source conflicts
  // are surfaced.
  if (result.summary.modulesWithMissingTopics > 0) {
    assert(
      result.crossSourceConflicts.some(
        (c) => c.conflictId === "dtp-v1-explanation-topic-missing"
      ),
      "If any borrower-touching module lacks a doctrine topic, the explanation-topic-missing conflict must surface."
    );
  }
  if (
    result.summary.eventContractsWithSilentSubmissionRisk > 0 ||
    result.summary.handoffsWithSilentSubmissionRisk > 0
  ) {
    assert(
      result.crossSourceConflicts.some(
        (c) => c.conflictId === "dtp-v1-silent-submission-risk"
      ),
      "If any silent-submission risk exists, the corresponding conflict must surface."
    );
  }
  if (
    result.summary.modulesFailingReadability > 0 ||
    result.summary.eventContractsFailingReadability > 0
  ) {
    assert(
      result.crossSourceConflicts.some(
        (c) => c.conflictId === "dtp-v1-plain-english-readability-fail"
      ),
      "If any readability failure exists, the corresponding conflict must surface."
    );
  }

  // Doctrine version mismatch detection.
  const mismatchPack = composeDataTransparencyPosture({
    declaredDoctrineVersion: "data-transparency-user-sovereignty-doctrine-v0.0.1",
  });
  assert(
    mismatchPack.crossSourceConflicts.some(
      (c) => c.conflictId === "dtp-v1-doctrine-version-mismatch"
    ),
    "Caller-declared doctrine-version mismatch must surface the mismatch conflict."
  );

  // User packet sanity.
  assert(
    result.userPacket.userVisibleSummary.toLowerCase().includes("belongs to you"),
    "User packet must affirm that user information belongs to the user."
  );
  assert(
    result.userPacket.whatWillFurlongDo.length >= 10,
    "User packet must enumerate every 'Furlong will' obligation from the doctrine."
  );
  assert(
    result.userPacket.whatWillFurlongNotDo.length >= 12,
    "User packet must enumerate every 'Furlong will not' prohibition from the doctrine."
  );
  assert(
    result.userPacket.escalationStages.length === 4,
    "User packet must list all four escalation stages."
  );
  assert(
    result.userPacket.escalationStages.every(
      (stage) => stage.userActionRequired === true
    ),
    "Every escalation stage in the user packet must require explicit user action."
  );
  assert(
    result.userPacket.userRights.includes("REQUEST_EXPLANATION") &&
      result.userPacket.userRights.includes("REQUEST_DELETION") &&
      result.userPacket.userRights.includes("REQUEST_EXPORT") &&
      result.userPacket.userRights.includes("REQUEST_HUMAN_REVIEW") &&
      result.userPacket.userRights.includes("REQUEST_HOLD_ON_ESCALATION"),
    "User packet must include all five canonical user rights."
  );
  assert(
    result.userPacket.classificationLevel === "RESTRICTED",
    "User packet must be classification RESTRICTED."
  );

  // Disclosures and production restrictions.
  assert(
    DATA_TRANSPARENCY_POSTURE_DISCLOSURES.some((d) =>
      d.toLowerCase().includes("your information belongs to you")
    ),
    "Disclosures must affirm 'Your information belongs to you'."
  );
  assert(
    DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS.includes(
      "no information sale"
    ) &&
      DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS.includes(
        "no silent submission"
      ) &&
      DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS.includes(
        "no marketing lead generation"
      ),
    "Production restrictions must block information sale, silent submission, and marketing lead generation."
  );

  // Escalation stages registry sanity.
  const stageIds = DATA_TRANSPARENCY_ESCALATION_STAGES.map((s) => s.id);
  assert(
    stageIds.includes("EXPLORATION") &&
      stageIds.includes("HUMAN_REVIEW") &&
      stageIds.includes("LENDER_ENGAGEMENT") &&
      stageIds.includes("APPLICATION_SUBMISSION"),
    "Doctrine declares the four canonical escalation stages."
  );

  // Required explanation topics registry sanity.
  const topicIds = DATA_TRANSPARENCY_REQUIRED_EXPLANATION_TOPICS.map(
    (t) => t.id
  );
  assert(
    topicIds.includes("why_information_is_requested") &&
      topicIds.includes("how_information_is_used") &&
      topicIds.includes("who_can_see_information") &&
      topicIds.includes("when_information_is_shared") &&
      topicIds.includes("when_information_is_retained") &&
      topicIds.includes("when_information_can_be_deleted") &&
      topicIds.includes("when_information_can_be_exported"),
    "Doctrine declares the seven canonical explanation topics + lineage / traceability."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-data-transparency-posture"
  );
  assert(
    moduleManifest !== undefined,
    "governance-data-transparency-posture module manifest must be registered."
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
    moduleManifest.audience.includes("internal"),
    "Module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.data.transparency.posture.audited"
    ),
    "Module must publish the audited event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.data.transparency.posture.audited"
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
      handoff.fromModuleId === "governance-data-transparency-posture" ||
      handoff.toModuleId === "governance-data-transparency-posture"
  );
  assert(
    handoffs.length >= 8,
    "Data Transparency Posture module must declare at least eight governed handoff routes."
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
        runtimeVersion: DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
        doctrineVersion: DATA_TRANSPARENCY_DOCTRINE_VERSION,
        doctrineDocRef: DATA_TRANSPARENCY_DOCTRINE_DOC_REF,
        modulesAudited: result.summary.modulesAudited,
        borrowerTouchingModulesAudited:
          result.summary.borrowerTouchingModulesAudited,
        eventContractsAudited: result.summary.eventContractsAudited,
        handoffsAudited: result.summary.handoffsAudited,
        escalationStagesAudited: result.summary.escalationStagesAudited,
        escalationStagesMissing: result.summary.escalationStagesMissing,
        modulesWithMissingTopics: result.summary.modulesWithMissingTopics,
        modulesFailingReadability: result.summary.modulesFailingReadability,
        eventContractsWithSilentSubmissionRisk:
          result.summary.eventContractsWithSilentSubmissionRisk,
        eventContractsFailingReadability:
          result.summary.eventContractsFailingReadability,
        handoffsWithSilentSubmissionRisk:
          result.summary.handoffsWithSilentSubmissionRisk,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        v1OverallReadinessPercent: result.summary.v1OverallReadinessPercent,
        handoffs: handoffs.length,
        message: "Data Transparency Posture v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
