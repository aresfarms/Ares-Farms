import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  ADVANCED_INTELLIGENCE_DOMAIN_IDS,
  ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
} from "@/lib/intelligence/advancedIntelligenceRuntime";
import {
  ADVANCED_INTELLIGENCE_V2_DISCLOSURES,
  ADVANCED_INTELLIGENCE_V2_DOMAIN_IDS,
  ADVANCED_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS,
  ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
  advancedIntelligenceV2Lineage,
  composeAdvancedIntelligenceV2,
} from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Advanced Intelligence v2 Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical intelligence composition over
 *   Lender Workflow v2 (Build 18), Opportunity Discovery v2 (Build 17),
 *   Financing Pathway Engine v2 (Build 16), Revenue Intelligence v2
 *   (Build 15), Customer Type Registry (Build 14), and Capital Graph
 *   (Build 13).
 * - Vol II: keeps the composed pack from becoming intelligence,
 *   opportunity, pathway, eligibility, credit, or program determination.
 * - Vol III: validates deterministic composition with explicit version
 *   lineage chaining v2 → LWF v2 → OD v2 → FPE v2 → RI v2 → Customer
 *   Type → Capital Graph → legacy v1 advanced intelligence.
 * - Vol III-B: confirms human-review-required posture and governed
 *   evidence.
 * - Vol IV: confirms governed handoffs across upstream canonical
 *   modules plus downstream consumers.
 * - Vol V: confirms canonical claims governance, controlled disclosure,
 *   replay, audit, portability, advisory-only boundaries.
 * - Vol VI: confirms public-safe DTO posture; no live external fetch,
 *   no source-certainty claim.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION ===
      "advanced-intelligence-v2-runtime-v0.1.0",
    "Advanced Intelligence v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = advancedIntelligenceV2Lineage();
  assert(
    lineage.runtimeVersion === ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
  );
  assert(
    lineage.lenderWorkflowV2Version === LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    "Lineage lenderWorkflowV2Version must equal the canonical LWF v2 version."
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
    lineage.legacyAdvancedIntelligenceVersion ===
      ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
    "Lineage legacyAdvancedIntelligenceVersion must equal the v1 advanced intelligence version."
  );
  assert(
    lineage.legacyV1DomainCount === ADVANCED_INTELLIGENCE_DOMAIN_IDS.length,
    "Lineage legacyV1DomainCount must equal the v1 domain count."
  );

  // Default composition.
  const defaultPack = composeAdvancedIntelligenceV2({});

  assert(
    defaultPack.runtimeVersion === ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.advancedIntelligenceV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Advanced Intelligence v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2DomainCount ===
      ADVANCED_INTELLIGENCE_V2_DOMAIN_IDS.length,
    "Default pack must compose all four canonical v2 domains."
  );
  assert(
    defaultPack.summary.v1DomainCount > 0,
    "Default pack must surface legacy v1 domains via the compatibility bridge."
  );

  // Composition with declared customer types.
  const pack = composeAdvancedIntelligenceV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerContext: {
      declaredCustomerTypes: [
        "beginning farmer",
        "rural small business",
        "utility customer",
      ],
      intendedUses: [
        "specialty crops",
        "energy efficiency",
        "operating capital",
      ],
      jurisdiction: { federal: true, state: "MD" },
    },
    scope: {
      sovereignFederationAllowed: false,
      state: "MD",
    },
  });

  assert(
    pack.summary.customerTypeCoverageCount >= 3,
    "Pack must surface at least three customer type coverage entries for the declared archetypes."
  );
  assert(
    pack.summary.capitalProgramCoverageCount > 0,
    "Pack must surface Capital Graph-backed program coverage."
  );
  assert(
    pack.summary.v2InsightCount > 0,
    "Pack must compose at least one v2 governed insight."
  );
  assert(
    pack.v2Domains.every((domain) =>
      ADVANCED_INTELLIGENCE_V2_DOMAIN_IDS.includes(domain.id)
    ),
    "Every composed v2 domain must use a canonical v2 domain id."
  );
  assert(
    pack.v2Domains.every((domain) =>
      domain.insights.every((insight) =>
        insight.blockedClaims.includes("approval")
      )
    ),
    "Every v2 insight must propagate the approval-blocked claim."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0 ||
      pack.summary.conflictCount > 0,
    "Pack must preserve at least one conflict signal or cross-source conflict as first-class evidence."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.advancedIntelligenceVersion ===
      ADVANCED_INTELLIGENCE_RUNTIME_VERSION &&
      pack.legacyBridge.lenderWorkflowV2Version ===
        LENDER_WORKFLOW_V2_RUNTIME_VERSION &&
      pack.legacyBridge.opportunityDiscoveryV2Version ===
        OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION &&
      pack.legacyBridge.financingPathwayEngineV2Version ===
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION &&
      pack.legacyBridge.revenueIntelligenceV2Version ===
        REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose all upstream and legacy version seals."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Advanced Intelligence v2 output is advisory, replay-safe, audit-safe, and conflict-preserving."
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
      pack.productionRestrictions.includes(
        "no autonomous intelligence determination"
      ) &&
      pack.productionRestrictions.includes("no source certainty") &&
      pack.productionRestrictions.includes("no live external action"),
    "Production restrictions must block lending, eligibility, pathway, opportunity, intelligence, source certainty, and live external action."
  );
  assert(
    ADVANCED_INTELLIGENCE_V2_DISCLOSURES.includes(
      "When the legacy v1 advanced intelligence and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    ADVANCED_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous intelligence determination"
    ),
    "Production restriction constants must block autonomous intelligence determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-advanced-intelligence-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-advanced-intelligence-v2 module manifest must be registered."
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
      "governance.advanced.intelligence.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.lender.workflow.v2.composed"
    ),
    "Module must consume upstream Lender Workflow v2 event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.opportunity.discovery.v2.composed"
    ),
    "Module must consume upstream Opportunity Discovery v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.advanced.intelligence.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.advanced.intelligence.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-advanced-intelligence-v2" ||
      handoff.toModuleId === "governance-advanced-intelligence-v2"
  );
  assert(
    handoffs.length >= 18,
    "Advanced Intelligence v2 module must have at least eighteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-lender-workflow-v2"
    ),
    "Module must hand off to Lender Workflow v2."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-opportunity-discovery-v2"
    ),
    "Module must hand off to Opportunity Discovery v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-advanced-intelligence"
    ),
    "Module must hand off to legacy v1 advanced intelligence for paired review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
        lenderWorkflowV2Version: lineage.lenderWorkflowV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyAdvancedIntelligenceVersion:
          lineage.legacyAdvancedIntelligenceVersion,
        legacyV1DomainCount: lineage.legacyV1DomainCount,
        v2DomainCount: pack.summary.v2DomainCount,
        v1DomainCount: pack.summary.v1DomainCount,
        totalInsightCount: pack.summary.totalInsightCount,
        v2InsightCount: pack.summary.v2InsightCount,
        v1InsightCount: pack.summary.v1InsightCount,
        conflictCount: pack.summary.conflictCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        customerTypeCoverageCount: pack.summary.customerTypeCoverageCount,
        capitalProgramCoverageCount: pack.summary.capitalProgramCoverageCount,
        handoffs: handoffs.length,
        message: "Advanced Intelligence v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
