import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CERTIFICATION_ENGINE_V2_RUNTIME_VERSION } from "@/lib/certification/engineV2Runtime";
import {
  CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
  CONNECTOR_DIMENSION_IDS,
} from "@/lib/connectors/certificationRuntime";
import {
  CONNECTOR_CERTIFICATION_V2_DIMENSION_IDS,
  CONNECTOR_CERTIFICATION_V2_DISCLOSURES,
  CONNECTOR_CERTIFICATION_V2_PRODUCTION_RESTRICTIONS,
  CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
  composeConnectorCertificationV2,
  connectorCertificationV2Lineage,
} from "@/lib/connectors/certificationV2Runtime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION } from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION } from "@/lib/registry/frameworkV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION ===
      "connector-certification-v2-runtime-v0.1.0",
    "Connector Certification v2 runtime version must match canonical v0.1.0 seal."
  );

  const lineage = connectorCertificationV2Lineage();
  assert(
    lineage.runtimeVersion === CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.registryFrameworkV2Version === REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    "Lineage registryFrameworkV2Version must equal canonical RF v2."
  );
  assert(
    lineage.certificationEngineV2Version === CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    "Lineage certificationEngineV2Version must equal canonical CE v2."
  );
  assert(
    lineage.evidenceEngineV2Version === GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    "Lineage evidenceEngineV2Version must equal canonical EE v2."
  );
  assert(
    lineage.advancedIntelligenceV2Version === ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage advancedIntelligenceV2Version must equal canonical AI v2."
  );
  assert(
    lineage.lenderWorkflowV2Version === LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    "Lineage lenderWorkflowV2Version must equal canonical LWF v2."
  );
  assert(
    lineage.opportunityDiscoveryV2Version === OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage opportunityDiscoveryV2Version must equal canonical OD v2."
  );
  assert(
    lineage.financingPathwayEngineV2Version === FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage financingPathwayEngineV2Version must equal canonical FPE v2."
  );
  assert(
    lineage.revenueIntelligenceV2Version === REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage revenueIntelligenceV2Version must equal canonical RI v2."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal Capital Graph Registry size."
  );
  assert(
    lineage.legacyConnectorCertificationVersion === CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
    "Lineage legacyConnectorCertificationVersion must equal v1 connector certification version."
  );
  assert(
    lineage.legacyV1DimensionCount === CONNECTOR_DIMENSION_IDS.length,
    "Lineage legacyV1DimensionCount must equal v1 dimension count."
  );

  // Default composition.
  const defaultPack = composeConnectorCertificationV2({});

  assert(
    defaultPack.runtimeVersion === CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
    "Default pack must emit canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.internalCertificationOnly &&
      defaultPack.connectorCertificationV2InternalOnly &&
      defaultPack.liveExecutionBlocked &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noAutonomousRegistry &&
      defaultPack.noAutonomousConnectorActivation &&
      defaultPack.noExternalPromotion &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLenderCommitment &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Connector Certification v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2DimensionCount ===
      CONNECTOR_CERTIFICATION_V2_DIMENSION_IDS.length,
    "Default pack must compose all three canonical v2 alignment dimensions."
  );

  // Composition with declared customer types + sample connector.
  const pack = composeConnectorCertificationV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerContext: {
      declaredCustomerTypes: ["beginning farmer", "rural small business"],
      intendedUses: ["specialty crops", "energy efficiency"],
      jurisdiction: { federal: true, state: "MD" },
    },
    scope: { sovereignFederationAllowed: false },
    legacy: [
      {
        connectorId: "conn-smoke-001",
        connectorName: "Smoke test connector",
        sourceAuthorityTier: "authority-tier-1",
        liveExecutionRequested: false,
        dimensions: {
          review: {
            status: "REVIEW_PENDING",
            readinessPercent: 75,
            checkpointsComplete: 3,
            totalCheckpoints: 4,
          },
          certification_evidence: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 90,
            checkpointsComplete: 9,
            totalCheckpoints: 10,
          },
        },
      },
    ],
  });

  assert(
    pack.summary.capitalProgramCoverageCount > 0 &&
      pack.summary.customerTypeCoverageCount > 0 &&
      pack.summary.capitalCategoryCoverageCount > 0,
    "Pack must surface Capital Graph + Customer Type + Capital Category coverage from RF v2."
  );
  assert(
    pack.summary.v1ConnectorCount === 1,
    "Pack must surface the provided legacy connector."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      CONNECTOR_CERTIFICATION_V2_DIMENSION_IDS.includes(dimension.id)
    ),
    "Every composed v2 dimension must use a canonical v2 dimension id."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      dimension.blockedClaims.includes("live external action")
    ),
    "Every v2 dimension must propagate the live-external-action-blocked claim."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.connectorCertificationVersion ===
      CONNECTOR_CERTIFICATION_RUNTIME_VERSION &&
      pack.legacyBridge.registryFrameworkV2Version ===
        REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 connector cert + RF v2 version seals."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Connector Certification v2 output is advisory internal-certification posture, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes("no live external action") &&
      pack.productionRestrictions.includes(
        "no autonomous connector activation determination"
      ) &&
      pack.productionRestrictions.includes("no external promotion") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, live external action, autonomous connector activation, external promotion, and source certainty."
  );
  assert(
    CONNECTOR_CERTIFICATION_V2_DISCLOSURES.includes(
      "Live external connector execution remains blocked until qualified approval through the Source Promotion Authority, the Controlled Promotion Board, the Live Scraper Activation Gate, and any other gates named in the participant role registry."
    ),
    "Disclosure constants must include the live-execution-gate language."
  );
  assert(
    CONNECTOR_CERTIFICATION_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous connector activation determination"
    ),
    "Production restriction constants must block autonomous connector activation determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-connector-certification-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-connector-certification-v2 module manifest must be registered."
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
      "governance.connector.certification.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.registry.framework.v2.composed"
    ),
    "Module must consume upstream Registry Framework v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.connector.certification.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.connector.certification.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-connector-certification-v2" ||
      handoff.toModuleId === "governance-connector-certification-v2"
  );
  assert(
    handoffs.length >= 17,
    "Connector Certification v2 module must have at least seventeen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-registry-framework-v2"
    ),
    "Module must hand off to Registry Framework v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-connector-certification"
    ),
    "Module must hand off to legacy v1 connector certification for paired review."
  );
  assert(
    handoffs.some((handoff) => handoff.toModuleId === "live-scraper-activation"),
    "Module must hand off to live-scraper-activation gate."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
        registryFrameworkV2Version: lineage.registryFrameworkV2Version,
        certificationEngineV2Version: lineage.certificationEngineV2Version,
        evidenceEngineV2Version: lineage.evidenceEngineV2Version,
        advancedIntelligenceV2Version: lineage.advancedIntelligenceV2Version,
        lenderWorkflowV2Version: lineage.lenderWorkflowV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyConnectorCertificationVersion:
          lineage.legacyConnectorCertificationVersion,
        legacyV1DimensionCount: lineage.legacyV1DimensionCount,
        v2DimensionCount: pack.summary.v2DimensionCount,
        v2CertifiedCount: pack.summary.v2CertifiedCount,
        v2PendingCount: pack.summary.v2PendingCount,
        v2BlockedCount: pack.summary.v2BlockedCount,
        v2NotStartedCount: pack.summary.v2NotStartedCount,
        v2OverallReadinessPercent: pack.summary.v2OverallReadinessPercent,
        v1ConnectorCount: pack.summary.v1ConnectorCount,
        v1CertifiedConnectorCount: pack.summary.v1CertifiedConnectorCount,
        v1BlockedConnectorCount: pack.summary.v1BlockedConnectorCount,
        v1LiveExecutionBlockedCount: pack.summary.v1LiveExecutionBlockedCount,
        v1OverallReadinessPercent: pack.summary.v1OverallReadinessPercent,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        capitalProgramCoverageCount: pack.summary.capitalProgramCoverageCount,
        customerTypeCoverageCount: pack.summary.customerTypeCoverageCount,
        capitalCategoryCoverageCount: pack.summary.capitalCategoryCoverageCount,
        handoffs: handoffs.length,
        message: "Connector Certification v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
