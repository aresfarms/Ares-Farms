import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import {
  DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES,
  DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS,
  DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
  DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS,
  DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS,
  composeDocumentEvidenceReconciliation,
  documentEvidenceReconciliationLineage,
} from "@/lib/platform/authorities/evidence";
import { EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION } from "@/lib/evidence-resolution/evidenceResolutionWorkflowRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { READINESS_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/readiness/readinessAssessmentV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION ===
      "document-evidence-reconciliation-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );

  const lineage = documentEvidenceReconciliationLineage();
  assert(
    lineage.runtimeVersion === DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.evidenceResolutionWorkflowVersion ===
      EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
    "Lineage must seal Evidence Resolution Workflow v1."
  );
  assert(
    lineage.readinessAssessmentV2Version ===
      READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage must seal Readiness Assessment v2."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage must seal Borrower Onboarding Core v2."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal Capital Graph Registry size."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 1: Tax return income lower than operating cash flow
  // because of depreciation/deductions → UNRESOLVED_VARIANCE with
  // clarification requested.
  // ────────────────────────────────────────────────────────────────────
  const scenario1 = composeDocumentEvidenceReconciliation({
    taxReturns: [
      {
        documentRef: "doc://tax/2024",
        period: { year: 2024 },
        reportedGrossRevenue: 1000000,
        reportedNetIncome: 100000,
        declaredDepreciation: 60000,
        declaredDeductions: 40000,
      },
    ],
    profitAndLossStatements: [
      {
        documentRef: "doc://pl/2024",
        period: { year: 2024 },
        reportedRevenue: 1050000,
        reportedOperatingExpenses: 850000,
        reportedOperatingCashFlow: 200000,
      },
    ],
  });
  const s1Unresolved = scenario1.findings.find(
    (f) =>
      f.category === "TAX_RETURN_VS_OPERATING_CASH_FLOW" &&
      f.resolutionStatus === "UNRESOLVED_VARIANCE"
  );
  assert(
    s1Unresolved !== undefined,
    "Scenario 1 must produce an UNRESOLVED_VARIANCE finding for tax-vs-OCF with depreciation/deductions declared."
  );
  assert(
    s1Unresolved.reviewerRole === "BORROWER_INTAKE_REVIEWER",
    "Scenario 1 unresolved finding must route to BORROWER_INTAKE_REVIEWER for clarification."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 2: P&L revenue conflicts with tax return revenue by >25% →
  // MATERIAL_CONFLICT, humanReviewFlag true.
  // ────────────────────────────────────────────────────────────────────
  const scenario2 = composeDocumentEvidenceReconciliation({
    taxReturns: [
      {
        documentRef: "doc://tax/2024",
        period: { year: 2024 },
        reportedGrossRevenue: 1000000,
        reportedNetIncome: 100000,
      },
    ],
    profitAndLossStatements: [
      {
        documentRef: "doc://pl/2024",
        period: { year: 2024 },
        reportedRevenue: 1500000,
        reportedOperatingExpenses: 1200000,
        reportedOperatingCashFlow: 300000,
      },
    ],
  });
  const s2Material = scenario2.findings.find(
    (f) =>
      f.category === "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE" &&
      f.resolutionStatus === "MATERIAL_CONFLICT"
  );
  assert(
    s2Material !== undefined,
    "Scenario 2 must produce a MATERIAL_CONFLICT finding for P&L vs tax revenue."
  );
  assert(
    s2Material.humanReviewFlag === true,
    "Scenario 2 MATERIAL_CONFLICT must carry humanReviewFlag = true."
  );
  assert(
    s2Material.reviewerRole === "QUALIFIED_GOVERNANCE_REVIEWER",
    "Scenario 2 MATERIAL_CONFLICT must route to QUALIFIED_GOVERNANCE_REVIEWER."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 3: Missing rent roll for income property → INCOMPLETE.
  // ────────────────────────────────────────────────────────────────────
  const scenario3 = composeDocumentEvidenceReconciliation({
    intendedUses: ["rental income property"],
  });
  const s3Incomplete = scenario3.findings.find(
    (f) =>
      f.category === "RENT_ROLL_PRESENCE" &&
      f.resolutionStatus === "INCOMPLETE"
  );
  assert(
    s3Incomplete !== undefined,
    "Scenario 3 must produce an INCOMPLETE finding for missing rent roll."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 4: Property ownership mismatch → THIRD_PARTY_VERIFICATION
  // _RECOMMENDED.
  // ────────────────────────────────────────────────────────────────────
  const scenario4 = composeDocumentEvidenceReconciliation({
    propertyOwnership: {
      borrowerDeclaredOwner: "Smith Family Trust",
      externalRecordsOwner: "John Smith",
      externalRecordsSource: "county-recorder",
      parcelOrAddress: "123 Main St, Anytown USA",
    },
  });
  const s4ThirdParty = scenario4.findings.find(
    (f) =>
      f.category === "PROPERTY_OWNERSHIP_RECORD" &&
      f.resolutionStatus === "THIRD_PARTY_VERIFICATION_RECOMMENDED"
  );
  assert(
    s4ThirdParty !== undefined,
    "Scenario 4 must produce a THIRD_PARTY_VERIFICATION_RECOMMENDED finding for ownership mismatch."
  );
  assert(
    s4ThirdParty.reviewerRole === "THIRD_PARTY_RECORDS_AUTHORITY",
    "Scenario 4 must route to THIRD_PARTY_RECORDS_AUTHORITY."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 5: Environmental report references missing appendix →
  // CLARIFICATION_REQUESTED.
  // ────────────────────────────────────────────────────────────────────
  const scenario5 = composeDocumentEvidenceReconciliation({
    environmentalReports: [
      {
        documentRef: "doc://env/phase-1-esa",
        reportType: "PHASE_I_ESA",
        referencedAppendixIds: ["appendix-A", "appendix-B", "appendix-C"],
        providedAppendixIds: ["appendix-A"],
      },
    ],
  });
  const s5Clarification = scenario5.findings.find(
    (f) =>
      f.category === "ENVIRONMENTAL_REPORT_APPENDIX_REFERENCE" &&
      f.resolutionStatus === "CLARIFICATION_REQUESTED"
  );
  assert(
    s5Clarification !== undefined,
    "Scenario 5 must produce a CLARIFICATION_REQUESTED finding for missing appendix items."
  );
  assert(
    s5Clarification.conflictingOrMissingItems.length === 2,
    "Scenario 5 must list both missing appendix items."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 6: Conflicting borrower-provided documents with no
  // explanation → HUMAN_REVIEW_REQUIRED.
  // ────────────────────────────────────────────────────────────────────
  const scenario6 = composeDocumentEvidenceReconciliation({
    taxReturns: [
      {
        documentRef: "doc://tax/2024",
        period: { year: 2024 },
        reportedGrossRevenue: 1000000,
        reportedNetIncome: 100000,
      },
    ],
    profitAndLossStatements: [
      {
        documentRef: "doc://pl/2024",
        period: { year: 2024 },
        reportedRevenue: 1500000,
        reportedOperatingExpenses: 1200000,
        reportedOperatingCashFlow: 300000,
      },
    ],
    // borrowerExplanationNote NOT provided
  });
  const s6HumanReview = scenario6.findings.find(
    (f) =>
      f.category === "BORROWER_PROVIDED_DOCUMENT_CONFLICT" &&
      f.resolutionStatus === "HUMAN_REVIEW_REQUIRED"
  );
  assert(
    s6HumanReview !== undefined,
    "Scenario 6 must produce a HUMAN_REVIEW_REQUIRED finding when borrower has unresolved variance and no explanation note."
  );
  assert(
    s6HumanReview.humanReviewFlag === true,
    "Scenario 6 HUMAN_REVIEW_REQUIRED finding must carry humanReviewFlag = true."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario 7: Fully consistent document packet → CONSISTENT (and
  // a FULLY_CONSISTENT_PACKET wrap-up finding).
  // ────────────────────────────────────────────────────────────────────
  const scenario7 = composeDocumentEvidenceReconciliation({
    taxReturns: [
      {
        documentRef: "doc://tax/2024",
        period: { year: 2024 },
        reportedGrossRevenue: 1000000,
        reportedNetIncome: 180000,
      },
    ],
    profitAndLossStatements: [
      {
        documentRef: "doc://pl/2024",
        period: { year: 2024 },
        reportedRevenue: 1010000,
        reportedOperatingExpenses: 830000,
        reportedOperatingCashFlow: 180000,
      },
    ],
    propertyOwnership: {
      borrowerDeclaredOwner: "John Smith",
      externalRecordsOwner: "John Smith",
      externalRecordsSource: "county-recorder",
      parcelOrAddress: "123 Main St, Anytown USA",
    },
  });
  const s7AllConsistent = scenario7.findings.every(
    (f) => f.resolutionStatus === "CONSISTENT"
  );
  assert(
    s7AllConsistent,
    "Scenario 7 must produce only CONSISTENT findings."
  );
  assert(
    scenario7.findings.some(
      (f) => f.category === "FULLY_CONSISTENT_PACKET"
    ),
    "Scenario 7 must include the FULLY_CONSISTENT_PACKET wrap-up finding."
  );

  // ────────────────────────────────────────────────────────────────────
  // Constitutional posture across every scenario.
  // ────────────────────────────────────────────────────────────────────
  for (const result of [
    scenario1,
    scenario2,
    scenario3,
    scenario4,
    scenario5,
    scenario6,
    scenario7,
  ]) {
    assert(
      result.productionBlocked &&
        result.humanReviewRequired &&
        result.advisoryOnly &&
        result.documentEvidenceReconciliationInternalOnly &&
        result.uncertaintyPreserved &&
        result.conflictLineagePreserved &&
        result.noFraudAccusation &&
        result.noDocumentFakenessAccusation &&
        result.noBorrowerLyingAccusation &&
        result.noLegalConclusion &&
        result.noUnderwritingDecision &&
        result.noAutomaticDenial &&
        result.noConflictHiding &&
        result.noAutonomousLending &&
        result.noAutonomousEligibility &&
        result.noAutonomousPathway &&
        result.noAutonomousOpportunity &&
        result.noAutonomousIntelligence &&
        result.noAutonomousEvidence &&
        result.noAutonomousCertification &&
        result.noAutonomousOnboarding &&
        result.noAutonomousReadiness &&
        result.noAutonomousEnvironmentalIntake &&
        result.noAutonomousEnvironmentalCompliance &&
        result.noAutonomousEnvironmentalRiskAssessment &&
        result.noAutonomousEnvironmentalEscalation &&
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
      "Every result must preserve the full constitutional flag set."
    );
    assert(
      result.summary.fraudAccusationRiskCount === 0,
      "No finding should flag fraud-accusation risk."
    );
    assert(
      result.summary.documentFakenessAccusationRiskCount === 0,
      "No finding should flag document-fakeness-accusation risk."
    );
    assert(
      result.summary.underwritingDecisionRiskCount === 0,
      "No finding should flag underwriting-decision risk."
    );
    assert(
      result.summary.legalConclusionRiskCount === 0,
      "No finding should flag legal-conclusion risk."
    );
    for (const finding of result.findings) {
      assert(
        finding.uncertaintyPreservedFlag === true,
        `Finding ${finding.findingId} must preserve uncertainty.`
      );
      assert(
        finding.conflictLineagePreservedFlag === true,
        `Finding ${finding.findingId} must preserve conflict lineage.`
      );
      const haystack = (
        finding.plainEnglishExplanation +
        " " +
        finding.whyItMatters +
        " " +
        finding.whatAdditionalInformationMayResolveIt +
        " " +
        finding.nextRecommendedAction
      ).toLowerCase();
      // The most dangerous tokens must never appear in affirmative
      // position.
      assert(
        !/\bfraud\b/.test(haystack),
        `Finding ${finding.findingId} must not contain the word "fraud".`
      );
      assert(
        !/\bfake document\b/.test(haystack) &&
          !/\bfake documents\b/.test(haystack),
        `Finding ${finding.findingId} must not say "fake document"/"fake documents".`
      );
      assert(
        !/\blying\b/.test(haystack) && !/\blied\b/.test(haystack),
        `Finding ${finding.findingId} must not say borrower is "lying" or "lied".`
      );
      assert(
        !/\bdenied\b/.test(haystack),
        `Finding ${finding.findingId} must not contain the word "denied".`
      );
      assert(
        !/\brejected\b/.test(haystack),
        `Finding ${finding.findingId} must not contain the word "rejected".`
      );
      // No finding should ever auto-convert to denial: explanation
      // and next-recommended-action must be present.
      assert(
        finding.plainEnglishExplanation.length > 0,
        `Finding ${finding.findingId} must carry a plain-English explanation.`
      );
      assert(
        finding.nextRecommendedAction.length > 0,
        `Finding ${finding.findingId} must carry a next-recommended-action.`
      );
      // Classification + redaction posture.
      assert(
        finding.classificationLevel === "RESTRICTED",
        `Finding ${finding.findingId} must be classification RESTRICTED.`
      );
      assert(
        finding.redactionRequired === true,
        `Finding ${finding.findingId} must require redaction.`
      );
    }
  }

  // Material conflicts must produce a HUMAN_REVIEW routing.
  for (const result of [scenario2, scenario6]) {
    const materialOrHumanReview = result.findings.filter(
      (f) =>
        f.resolutionStatus === "MATERIAL_CONFLICT" ||
        f.resolutionStatus === "HUMAN_REVIEW_REQUIRED"
    );
    assert(
      materialOrHumanReview.every((f) => f.humanReviewFlag === true),
      "Every MATERIAL_CONFLICT / HUMAN_REVIEW_REQUIRED finding must set humanReviewFlag = true."
    );
  }

  // Disclosure + production restriction posture.
  assert(
    DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES.some((d) =>
      d.includes("Unreconciled evidence is not denial")
    ),
    "Disclosures must include 'Unreconciled evidence is not denial.'"
  );
  assert(
    DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS.includes(
      "no denial"
    ) &&
      DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS.includes(
        "no fraud accusation"
      ) &&
      DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS.includes(
        "no underwriting decision"
      ) &&
      DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS.includes(
        "no legal conclusion"
      ),
    "Production restrictions must block denial, fraud accusation, underwriting decision, and legal conclusion."
  );

  // Banned token sanity.
  assert(
    DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS.includes("fraud"),
    "Banned tokens must include 'fraud'."
  );
  assert(
    DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS.includes("fake document"),
    "Banned tokens must include 'fake document'."
  );
  assert(
    DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS.includes("lying"),
    "Banned tokens must include 'lying'."
  );
  assert(
    DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS.includes(
      "underwriting decision"
    ),
    "Banned tokens must include 'underwriting decision'."
  );
  assert(
    DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS.includes(
      "legal conclusion"
    ),
    "Banned tokens must include 'legal conclusion'."
  );

  // Signal id set.
  assert(
    DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS.length === 4,
    "Runtime must declare exactly four governed reconciliation signals."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-document-evidence-reconciliation"
  );
  assert(
    moduleManifest !== undefined,
    "governance-document-evidence-reconciliation module manifest must be registered."
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
      "governance.document.evidence.reconciliation.evaluated"
    ),
    "Module must publish the evaluated event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.evidence.resolution.workflow.composed"
    ),
    "Module must consume upstream Evidence Resolution Workflow v1 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType ===
      "governance.document.evidence.reconciliation.evaluated"
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
      handoff.fromModuleId === "governance-document-evidence-reconciliation" ||
      handoff.toModuleId === "governance-document-evidence-reconciliation"
  );
  assert(
    handoffs.length >= 12,
    "Document Evidence Reconciliation module must declare at least twelve governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (h) => h.toModuleId === "governance-evidence-resolution-workflow"
    ),
    "Module must hand off to Evidence Resolution Workflow v1."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
        evidenceResolutionWorkflowVersion:
          lineage.evidenceResolutionWorkflowVersion,
        readinessAssessmentV2Version: lineage.readinessAssessmentV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        scenario1Unresolved: scenario1.summary.unresolvedVarianceCount,
        scenario2MaterialConflict: scenario2.summary.materialConflictCount,
        scenario3Incomplete: scenario3.summary.incompleteCount,
        scenario4ThirdParty:
          scenario4.summary.thirdPartyVerificationRecommendedCount,
        scenario5Clarification:
          scenario5.summary.clarificationRequestedCount,
        scenario6HumanReview: scenario6.summary.humanReviewRequiredCount,
        scenario7Consistent: scenario7.summary.consistentCount,
        handoffs: handoffs.length,
        message: "Document Evidence Reconciliation v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
