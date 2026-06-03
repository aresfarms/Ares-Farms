import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CERTIFICATION_DOMAIN_IDS,
  CERTIFICATION_ENGINE_RUNTIME_VERSION,
} from "@/lib/certification/engineRuntime";
import {
  CERTIFICATION_ENGINE_V2_DIMENSION_IDS,
  CERTIFICATION_ENGINE_V2_DISCLOSURES,
  CERTIFICATION_ENGINE_V2_PRODUCTION_RESTRICTIONS,
  CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
  certificationEngineV2Lineage,
  composeCertificationEngineV2,
} from "@/lib/certification/engineV2Runtime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION } from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    CERTIFICATION_ENGINE_V2_RUNTIME_VERSION ===
      "certification-engine-v2-runtime-v0.1.0",
    "Certification Engine v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = certificationEngineV2Lineage();
  assert(
    lineage.runtimeVersion === CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.evidenceEngineV2Version ===
      GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    "Lineage evidenceEngineV2Version must equal canonical EE v2."
  );
  assert(
    lineage.advancedIntelligenceV2Version ===
      ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage advancedIntelligenceV2Version must equal canonical AI v2."
  );
  assert(
    lineage.lenderWorkflowV2Version === LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    "Lineage lenderWorkflowV2Version must equal canonical LWF v2."
  );
  assert(
    lineage.opportunityDiscoveryV2Version ===
      OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage opportunityDiscoveryV2Version must equal canonical OD v2."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage financingPathwayEngineV2Version must equal canonical FPE v2."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
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
    lineage.legacyCertificationEngineVersion ===
      CERTIFICATION_ENGINE_RUNTIME_VERSION,
    "Lineage legacyCertificationEngineVersion must equal v1 certification engine version."
  );
  assert(
    lineage.legacyV1DomainCount === CERTIFICATION_DOMAIN_IDS.length,
    "Lineage legacyV1DomainCount must equal v1 domain count."
  );

  // Default composition.
  const defaultPack = composeCertificationEngineV2({});

  assert(
    defaultPack.runtimeVersion === CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.internalCertificationOnly &&
      defaultPack.certificationEngineV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noExternalCertification &&
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
    "Certification Engine v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2DimensionCount ===
      CERTIFICATION_ENGINE_V2_DIMENSION_IDS.length,
    "Default pack must compose all three canonical v2 dimensions."
  );
  assert(
    defaultPack.summary.v1DomainCount > 0,
    "Default pack must surface legacy v1 domains via the compatibility bridge."
  );

  // Composition with declared customer types.
  const pack = composeCertificationEngineV2({
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
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.customerTypeCoverageCount >= 3,
    "Pack must surface at least three customer type coverage entries."
  );
  assert(
    pack.summary.capitalProgramCoverageCount > 0,
    "Pack must surface Capital Graph-backed program coverage."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      CERTIFICATION_ENGINE_V2_DIMENSION_IDS.includes(dimension.id)
    ),
    "Every composed v2 dimension must use a canonical v2 dimension id."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      dimension.blockedClaims.includes("external certification")
    ),
    "Every v2 dimension must propagate the external-certification-blocked claim."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      ["CERTIFIED_INTERNAL_REVIEW_BOUND", "REVIEW_PENDING", "BLOCKED_BY_GATE", "NOT_STARTED"].includes(
        dimension.status
      )
    ),
    "Every dimension status must be one of the canonical certification statuses."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount >= 0,
    "Pack must report cross-source conflict count."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.certificationEngineVersion ===
      CERTIFICATION_ENGINE_RUNTIME_VERSION &&
      pack.legacyBridge.evidenceEngineV2Version ===
        GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 cert engine + EE v2 version seals."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Certification Engine v2 output is advisory internal-certification posture, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes("no external certification") &&
      pack.productionRestrictions.includes(
        "no autonomous certification determination"
      ) &&
      pack.productionRestrictions.includes("no public verification") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, external certification, autonomous certification, public verification, and source certainty."
  );
  assert(
    CERTIFICATION_ENGINE_V2_DISCLOSURES.includes(
      "When the legacy v1 certification engine and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    CERTIFICATION_ENGINE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous certification determination"
    ),
    "Production restriction constants must block autonomous certification determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-certification-engine-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-certification-engine-v2 module manifest must be registered."
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
      "governance.certification.engine.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.evidence.engine.v2.composed"
    ),
    "Module must consume upstream Evidence Engine v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.certification.engine.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.certification.engine.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-certification-engine-v2" ||
      handoff.toModuleId === "governance-certification-engine-v2"
  );
  assert(
    handoffs.length >= 14,
    "Certification Engine v2 module must have at least fourteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-evidence-engine-v2"
    ),
    "Module must hand off to Evidence Engine v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-certification-engine"
    ),
    "Module must hand off to legacy v1 certification engine for paired review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
        evidenceEngineV2Version: lineage.evidenceEngineV2Version,
        advancedIntelligenceV2Version: lineage.advancedIntelligenceV2Version,
        lenderWorkflowV2Version: lineage.lenderWorkflowV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyCertificationEngineVersion:
          lineage.legacyCertificationEngineVersion,
        legacyV1DomainCount: lineage.legacyV1DomainCount,
        v2DimensionCount: pack.summary.v2DimensionCount,
        v2CertifiedCount: pack.summary.v2CertifiedCount,
        v2PendingCount: pack.summary.v2PendingCount,
        v2BlockedCount: pack.summary.v2BlockedCount,
        v2NotStartedCount: pack.summary.v2NotStartedCount,
        v2OverallReadinessPercent: pack.summary.v2OverallReadinessPercent,
        v1DomainCount: pack.summary.v1DomainCount,
        v1CertifiedCount: pack.summary.v1CertifiedCount,
        v1PendingCount: pack.summary.v1PendingCount,
        v1BlockedCount: pack.summary.v1BlockedCount,
        v1OverallReadinessPercent: pack.summary.v1OverallReadinessPercent,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        customerTypeCoverageCount: pack.summary.customerTypeCoverageCount,
        capitalProgramCoverageCount: pack.summary.capitalProgramCoverageCount,
        handoffs: handoffs.length,
        message: "Certification Engine v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
