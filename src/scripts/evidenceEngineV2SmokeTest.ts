import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_VERSION } from "@/lib/governance/evidenceEngine";
import {
  GOVERNANCE_EVIDENCE_ENGINE_V2_DIMENSION_IDS,
  GOVERNANCE_EVIDENCE_ENGINE_V2_DISCLOSURES,
  GOVERNANCE_EVIDENCE_ENGINE_V2_PRODUCTION_RESTRICTIONS,
  GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
  composeGovernanceEvidenceEngineV2,
  governanceEvidenceEngineV2Lineage,
} from "@/lib/governance/evidenceEngineV2Runtime";
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
    GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION ===
      "governance-evidence-engine-v2-runtime-v0.1.0",
    "Evidence Engine v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = governanceEvidenceEngineV2Lineage();
  assert(
    lineage.runtimeVersion === GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
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
    lineage.legacyEvidenceEngineVersion === GOVERNANCE_EVIDENCE_ENGINE_VERSION,
    "Lineage legacyEvidenceEngineVersion must equal v1 evidence engine version."
  );

  // Default composition.
  const defaultPack = composeGovernanceEvidenceEngineV2({});

  assert(
    defaultPack.runtimeVersion === GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.evidenceOnly &&
      defaultPack.evidenceEngineV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noOfficialCertification &&
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
    "Evidence Engine v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2DimensionCount ===
      GOVERNANCE_EVIDENCE_ENGINE_V2_DIMENSION_IDS.length,
    "Default pack must compose all three canonical v2 dimensions."
  );
  assert(
    defaultPack.summary.legacyModuleCount > 0,
    "Default pack must surface legacy v1 modules via the compatibility bridge."
  );

  // Composition with declared customer types.
  const pack = composeGovernanceEvidenceEngineV2({
    packIntent: "INTERNAL_REVIEW",
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerIdMasked: "borr-***-001",
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
    "Pack must surface at least three customer type coverage entries for the declared archetypes."
  );
  assert(
    pack.summary.capitalProgramCoverageCount > 0,
    "Pack must surface Capital Graph-backed program coverage."
  );
  assert(
    pack.summary.v2EntryCount > 0,
    "Pack must compose at least one v2 evidence entry."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      GOVERNANCE_EVIDENCE_ENGINE_V2_DIMENSION_IDS.includes(dimension.id)
    ),
    "Every composed v2 dimension must use a canonical v2 dimension id."
  );
  assert(
    pack.v2Dimensions.every((dimension) =>
      dimension.entries.every((entry) =>
        entry.blockedClaims.includes("approval")
      )
    ),
    "Every v2 entry must propagate the approval-blocked claim."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0,
    "Pack must preserve at least one cross-source conflict as first-class evidence (upstream AI v2 conflict propagation)."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.governanceEvidenceEngineVersion ===
      GOVERNANCE_EVIDENCE_ENGINE_VERSION &&
      pack.legacyBridge.advancedIntelligenceV2Version ===
        ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 evidence engine + AI v2 version seals."
  );
  assert(
    pack.legacyPack.runtimeVersion === GOVERNANCE_EVIDENCE_ENGINE_VERSION,
    "Legacy v1 evidence pack must be embedded with v1 runtime version."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Evidence Engine v2 output is advisory evidence, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous customer eligibility determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous evidence determination"
      ) &&
      pack.productionRestrictions.includes("no official certification") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, eligibility, evidence determination, official certification, and source certainty."
  );
  assert(
    GOVERNANCE_EVIDENCE_ENGINE_V2_DISCLOSURES.includes(
      "When the legacy v1 evidence engine and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    GOVERNANCE_EVIDENCE_ENGINE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous evidence determination"
    ),
    "Production restriction constants must block autonomous evidence determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-evidence-engine-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-evidence-engine-v2 module manifest must be registered."
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
      "governance.evidence.engine.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.advanced.intelligence.v2.composed"
    ),
    "Module must consume upstream Advanced Intelligence v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.evidence.engine.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.evidence.engine.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-evidence-engine-v2" ||
      handoff.toModuleId === "governance-evidence-engine-v2"
  );
  assert(
    handoffs.length >= 14,
    "Evidence Engine v2 module must have at least fourteen governed handoff routes."
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
        handoff.toModuleId === "governance-advanced-intelligence-v2"
    ),
    "Module must hand off to Advanced Intelligence v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-evidence-engine"
    ),
    "Module must hand off to legacy v1 evidence engine for paired review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
        advancedIntelligenceV2Version: lineage.advancedIntelligenceV2Version,
        lenderWorkflowV2Version: lineage.lenderWorkflowV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyEvidenceEngineVersion: lineage.legacyEvidenceEngineVersion,
        v2DimensionCount: pack.summary.v2DimensionCount,
        v2EntryCount: pack.summary.v2EntryCount,
        legacyModuleCount: pack.summary.legacyModuleCount,
        legacyEventContractCount: pack.summary.legacyEventContractCount,
        legacyHandoffCount: pack.summary.legacyHandoffCount,
        legacyHumanAuthorityCount: pack.summary.legacyHumanAuthorityCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        customerTypeCoverageCount: pack.summary.customerTypeCoverageCount,
        capitalProgramCoverageCount: pack.summary.capitalProgramCoverageCount,
        advancedIntelligenceV2DomainCount:
          pack.summary.advancedIntelligenceV2DomainCount,
        handoffs: handoffs.length,
        message: "Evidence Engine v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
