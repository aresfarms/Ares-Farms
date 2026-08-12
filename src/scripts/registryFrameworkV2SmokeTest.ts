import {
  CAPITAL_CATEGORY_GOVERNANCE,
  CAPITAL_GRAPH_REGISTRY,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CERTIFICATION_ENGINE_V2_RUNTIME_VERSION } from "@/lib/certification/engineV2Runtime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION } from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import { REGISTRY_FRAMEWORK_RUNTIME_VERSION } from "@/lib/registry/frameworkRuntime";
import {
  REGISTRY_FRAMEWORK_V2_CATALOG_IDS,
  REGISTRY_FRAMEWORK_V2_DISCLOSURES,
  REGISTRY_FRAMEWORK_V2_PRODUCTION_RESTRICTIONS,
  REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
  composeRegistryFrameworkV2,
  registryFrameworkV2Lineage,
} from "@/lib/registry/frameworkV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION ===
      "registry-framework-v2-runtime-v0.1.0",
    "Registry Framework v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = registryFrameworkV2Lineage();
  assert(
    lineage.runtimeVersion === REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.certificationEngineV2Version ===
      CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    "Lineage certificationEngineV2Version must equal canonical CE v2."
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
    lineage.capitalCategoryCount === CAPITAL_CATEGORY_GOVERNANCE.length,
    "Lineage capitalCategoryCount must equal Capital Category governance size."
  );
  assert(
    lineage.legacyRegistryFrameworkVersion ===
      REGISTRY_FRAMEWORK_RUNTIME_VERSION,
    "Lineage legacyRegistryFrameworkVersion must equal v1 registry framework version."
  );

  // Default composition.
  const defaultPack = composeRegistryFrameworkV2({});

  assert(
    defaultPack.runtimeVersion === REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.internalRegistryOnly &&
      defaultPack.registryFrameworkV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noAutonomousRegistry &&
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
    "Registry Framework v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2CatalogCount ===
      REGISTRY_FRAMEWORK_V2_CATALOG_IDS.length,
    "Default pack must compose all four canonical v2 catalogs."
  );
  assert(
    defaultPack.summary.legacyTotalEntryCount > 0,
    "Default pack must surface legacy v1 entries via the compatibility bridge."
  );
  assert(
    defaultPack.summary.v2CapitalProgramEntryCount ===
      CAPITAL_GRAPH_REGISTRY.length,
    "Default pack must expose every CapitalProgram registry entry."
  );
  assert(
    defaultPack.summary.v2CustomerTypeEntryCount ===
      CUSTOMER_TYPE_REGISTRY.length,
    "Default pack must expose every Customer Type registry entry."
  );
  assert(
    defaultPack.summary.v2CapitalCategoryEntryCount ===
      CAPITAL_CATEGORY_GOVERNANCE.length,
    "Default pack must expose every Capital Category governance entry."
  );

  // Composition with declared customer types.
  const pack = composeRegistryFrameworkV2({
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
    pack.summary.v2CertificationPostureEntryCount > 0,
    "Pack must expose certification posture entries derived from CE v2."
  );
  assert(
    pack.v2Catalogs.every((catalog) =>
      REGISTRY_FRAMEWORK_V2_CATALOG_IDS.includes(catalog.id)
    ),
    "Every composed v2 catalog must use a canonical v2 catalog id."
  );
  assert(
    pack.v2Catalogs.every((catalog) =>
      catalog.entries.every((entry) =>
        entry.blockedClaims.includes("external promotion")
      )
    ),
    "Every v2 entry must propagate the external-promotion-blocked claim."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.registryFrameworkVersion ===
      REGISTRY_FRAMEWORK_RUNTIME_VERSION &&
      pack.legacyBridge.certificationEngineV2Version ===
        CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 registry framework + CE v2 version seals."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Registry Framework v2 output is internal registry evidence, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes("no external promotion") &&
      pack.productionRestrictions.includes(
        "no autonomous registry determination"
      ) &&
      pack.productionRestrictions.includes("no public verification") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, external promotion, autonomous registry, public verification, and source certainty."
  );
  assert(
    REGISTRY_FRAMEWORK_V2_DISCLOSURES.includes(
      "When the legacy v1 registry framework and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    REGISTRY_FRAMEWORK_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous registry determination"
    ),
    "Production restriction constants must block autonomous registry determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-registry-framework-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-registry-framework-v2 module manifest must be registered."
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
      "governance.registry.framework.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.certification.engine.v2.composed"
    ),
    "Module must consume upstream Certification Engine v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.registry.framework.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.registry.framework.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-registry-framework-v2" ||
      handoff.toModuleId === "governance-registry-framework-v2"
  );
  assert(
    handoffs.length >= 14,
    "Registry Framework v2 module must have at least fourteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-certification-engine-v2"
    ),
    "Module must hand off to Certification Engine v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-registry-framework"
    ),
    "Module must hand off to legacy v1 registry framework for paired review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
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
        capitalCategoryCount: lineage.capitalCategoryCount,
        legacyRegistryFrameworkVersion: lineage.legacyRegistryFrameworkVersion,
        v2CatalogCount: pack.summary.v2CatalogCount,
        v2EntryCount: pack.summary.v2EntryCount,
        v2CapitalProgramEntryCount: pack.summary.v2CapitalProgramEntryCount,
        v2CustomerTypeEntryCount: pack.summary.v2CustomerTypeEntryCount,
        v2CapitalCategoryEntryCount: pack.summary.v2CapitalCategoryEntryCount,
        v2CertificationPostureEntryCount:
          pack.summary.v2CertificationPostureEntryCount,
        legacyCatalogCount: pack.summary.legacyCatalogCount,
        legacyTotalEntryCount: pack.summary.legacyTotalEntryCount,
        legacyProductionBlockedEntryCount:
          pack.summary.legacyProductionBlockedEntryCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        certificationV2OverallReadinessPercent:
          pack.summary.certificationV2OverallReadinessPercent,
        certificationV1OverallReadinessPercent:
          pack.summary.certificationV1OverallReadinessPercent,
        handoffs: handoffs.length,
        message: "Registry Framework v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
