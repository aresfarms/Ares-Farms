import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { LENDER_WORKFLOW_RUNTIME_VERSION } from "@/lib/lender/workflowRuntime";
import {
  LENDER_WORKFLOW_V2_DISCLOSURES,
  LENDER_WORKFLOW_V2_PRODUCTION_RESTRICTIONS,
  LENDER_WORKFLOW_V2_RUNTIME_VERSION,
  composeLenderWorkflowV2,
  lenderWorkflowV2Lineage,
} from "@/lib/lender/workflowV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Lender Workflow v2 Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical lender-coordination composition
 *   over Opportunity Discovery v2 (Build 17), Financing Pathway Engine v2
 *   (Build 16), Revenue Intelligence v2 (Build 15), Customer Type Registry
 *   (Build 14), and Capital Graph (Build 13).
 * - Vol II: keeps the composed pack from becoming customer eligibility
 *   determination, pathway authority, opportunity authority, credit
 *   decision, underwriting decision, lender commitment, or program
 *   approval.
 * - Vol III: validates deterministic composition with explicit version
 *   lineage chaining v2 → OD v2 → FPE v2 → RI v2 → Customer Type → Capital
 *   Graph → legacy v1 lender workflow.
 * - Vol III-B: confirms human-review-required posture and governed
 *   evidence.
 * - Vol IV: confirms governed handoffs to upstream canonical modules plus
 *   downstream lender-facing surfaces and consumers.
 * - Vol V: confirms canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and coordination-only boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw borrower / sponsor /
 *   property records, no live external fetch, no source-certainty claim.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    LENDER_WORKFLOW_V2_RUNTIME_VERSION === "lender-workflow-v2-runtime-v0.1.0",
    "Lender Workflow v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = lenderWorkflowV2Lineage();
  assert(
    lineage.runtimeVersion === LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
  );
  assert(
    lineage.opportunityDiscoveryV2Version ===
      OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage opportunityDiscoveryV2Version must equal the canonical OD v2 version."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage financingPathwayEngineV2Version must equal the canonical FPE v2 version."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage revenueIntelligenceV2Version must equal the canonical RI v2 version."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal the Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal the Capital Graph Registry size."
  );
  assert(
    lineage.legacyLenderWorkflowVersion === LENDER_WORKFLOW_RUNTIME_VERSION,
    "Lineage legacyLenderWorkflowVersion must equal the v1 lender workflow version."
  );

  // Default composition with no applications.
  const defaultPack = composeLenderWorkflowV2({});

  assert(
    defaultPack.runtimeVersion === LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.coordinationOnly &&
      defaultPack.lenderWorkflowV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noUnderwritingReliance &&
      defaultPack.noLenderCommitment &&
      defaultPack.noOfficialCreditDecision &&
      defaultPack.noBorrowerNoticeSend &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Lender Workflow v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.applicationCount === 0,
    "Default pack must return zero applications when none are provided."
  );

  // Composition with a populated application set.
  const pack = composeLenderWorkflowV2({
    reviewerRole: "Qualified Governance Reviewer",
    lenderId: "lender-smoke",
    partnerWorkflowId: "partner-smoke",
    applications: [
      {
        applicationId: "app-001",
        borrowerId: "borrower-001",
        status: "REVIEW_IN_PROGRESS",
        intakeReadinessPercent: 88,
        documentsRequested: 6,
        documentsReceived: 5,
        documentsPendingReview: 1,
        overlayCount: 2,
        overlayReviewedCount: 1,
        evidencePacketReady: false,
        borrowerPacketReady: true,
        declaredCustomerTypes: ["beginning farmer", "rural small business"],
        intendedUses: [
          "specialty crops",
          "energy efficiency",
          "operating capital",
        ],
        jurisdiction: { federal: true, state: "MD" },
        location: { country: "US", state: "MD" },
        farmTypes: ["specialty crops"],
        goals: ["operating capital"],
        acreage: 40,
        requestedAmount: 250000,
      },
      {
        applicationId: "app-002",
        borrowerId: "borrower-002",
        status: "PACKET_READY_FOR_REVIEW",
        intakeReadinessPercent: 96,
        documentsRequested: 6,
        documentsReceived: 6,
        documentsPendingReview: 0,
        overlayCount: 1,
        overlayReviewedCount: 1,
        evidencePacketReady: true,
        borrowerPacketReady: true,
        declaredCustomerTypes: ["utility customer"],
        intendedUses: ["energy efficiency"],
        jurisdiction: { federal: true, state: "VA" },
        location: { country: "US", state: "VA" },
        farmTypes: [],
        goals: ["infrastructure"],
        acreage: null,
        requestedAmount: 500000,
      },
    ],
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.applicationCount === 2,
    "Pack must report the two provided applications."
  );
  assert(
    pack.applicationBriefings.length === 2,
    "Pack must produce a briefing for each application."
  );
  assert(
    pack.summary.applicationsWithCustomerProfilesCount >= 1,
    "At least one application briefing must include matched customer profiles."
  );
  assert(
    pack.summary.totalGrantCardCount > 0,
    "Pack must compose at least one Capital Graph-backed grant card across briefings."
  );
  assert(
    pack.applicationBriefings.every((briefing) =>
      briefing.blockedClaims.includes("approval")
    ),
    "Every briefing must propagate the approval-blocked claim."
  );
  assert(
    pack.applicationBriefings.every((briefing) =>
      typeof briefing.queueItem.applicationId === "string"
    ),
    "Every briefing must carry a queue item application id."
  );

  // Legacy section bridge.
  assert(
    pack.legacySections.length > 0,
    "Pack must expose v1 lender workflow sections via the compatibility bridge."
  );
  assert(
    pack.legacyBridge.legacySectionCount === pack.legacySections.length,
    "Legacy bridge section count must match exposed sections."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0 ||
      pack.summary.conflictSignalCount > 0,
    "Pack must preserve at least one conflict signal or cross-source conflict as first-class evidence."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Lender Workflow v2 output is advisory coordination evidence, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous customer eligibility determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous pathway determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous opportunity determination"
      ) &&
      pack.productionRestrictions.includes("no underwriting decision") &&
      pack.productionRestrictions.includes("no lender commitment") &&
      pack.productionRestrictions.includes("no borrower notice send") &&
      pack.productionRestrictions.includes("no source certainty") &&
      pack.productionRestrictions.includes("no live external action"),
    "Production restrictions must block lending, eligibility, pathway, opportunity, underwriting, commitment, notice send, source certainty, and live external action."
  );
  assert(
    LENDER_WORKFLOW_V2_DISCLOSURES.includes(
      "When Opportunity Discovery v2 composition and the legacy v1 lender workflow disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    LENDER_WORKFLOW_V2_PRODUCTION_RESTRICTIONS.includes(
      "no borrower notice send"
    ),
    "Production restriction constants must block borrower notice send."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-lender-workflow-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-lender-workflow-v2 module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Module must remain production-blocked and replay-required."
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
      "governance.lender.workflow.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.opportunity.discovery.v2.composed"
    ),
    "Module must consume upstream Opportunity Discovery v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.lender.workflow.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.lender.workflow.v2.composed contract must be registered."
  );
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
      handoff.fromModuleId === "governance-lender-workflow-v2" ||
      handoff.toModuleId === "governance-lender-workflow-v2"
  );
  assert(
    handoffs.length >= 20,
    "Lender Workflow v2 module must have at least twenty governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-opportunity-discovery-v2"
    ),
    "Module must hand off to Opportunity Discovery v2 for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-financing-pathway-engine-v2"
    ),
    "Module must hand off to Financing Pathway Engine v2 for paired composition review."
  );
  assert(
    handoffs.some((handoff) => handoff.toModuleId === "lender-workflow"),
    "Module must hand off to legacy v1 lender workflow for paired coordination."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyLenderWorkflowVersion: lineage.legacyLenderWorkflowVersion,
        applicationCount: pack.summary.applicationCount,
        applicationsWithProfilesCount:
          pack.summary.applicationsWithCustomerProfilesCount,
        totalGrantCardCount: pack.summary.totalGrantCardCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        sovereignCardCount: pack.summary.sovereignCardCount,
        participantCardCount: pack.summary.participantCardCount,
        publicCardCount: pack.summary.publicCardCount,
        readyForReviewCount: pack.summary.readyForReviewCount,
        evidencePendingCount: pack.summary.evidencePendingCount,
        overlayReviewPendingCount: pack.summary.overlayReviewPendingCount,
        intakeInProgressCount: pack.summary.intakeInProgressCount,
        onHoldCount: pack.summary.onHoldCount,
        legacySectionCount: pack.legacyBridge.legacySectionCount,
        handoffs: handoffs.length,
        message: "Lender Workflow v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
