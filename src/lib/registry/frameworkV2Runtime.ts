import {
  CAPITAL_GRAPH_REGISTRY,
  CAPITAL_CATEGORY_GOVERNANCE,
  CapitalCategoryId,
  CapitalProgram,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
  CertificationEngineV2Result,
  composeCertificationEngineV2,
} from "@/lib/certification/engineV2Runtime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
} from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION } from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import {
  REGISTRY_FRAMEWORK_DISCLOSURES,
  REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS,
  REGISTRY_FRAMEWORK_RUNTIME_VERSION,
  RegistryFrameworkInput,
  RegistryFrameworkResult,
  evaluateRegistryFramework,
} from "@/lib/registry/frameworkRuntime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Registry Framework v2 Runtime
 *
 * The eighth downstream consumer of the Capital Graph (Build 13)
 * and Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), Opportunity Discovery v2 (Build 17), Lender Workflow
 * v2 (Build 18), Advanced Intelligence v2 (Build 19), Evidence
 * Engine v2 (Build 20), and Certification Engine v2 (Build 21). It
 * produces a unified, deterministic, replay-safe, audit-safe,
 * conflict-preserving advisory registry-framework posture that
 * joins:
 *
 * - The legacy v1 `evaluateRegistryFramework` runtime (7 catalogs:
 *   modules, public_surfaces, event_contracts, handoffs,
 *   source_authorities, controlled_promotion, participant_roles)
 *   preserved as an additive compatibility bridge.
 * - Four new v2 governed registry catalogs derived from the
 *   canonical v2 stack:
 *     - `capital_program_catalog` — Capital Graph CapitalProgram
 *       entries with sponsor authority, federation scope, category,
 *       blocked claims, doctrine refs;
 *     - `customer_type_catalog` — Customer Type Registry entries
 *       with archetype, federation scope, eligible capital
 *       categories, review boundary;
 *     - `capital_category_catalog` — Capital Graph canonical 23-
 *       category taxonomy with governance posture;
 *     - `certification_posture_catalog` — Certification Engine v2
 *       per-dimension status, readiness, blocking gates, review
 *       signals.
 * - Cross-source conflict signals when (a) v2 catalogs exceed v1
 *   catalog coverage, (b) v1 catalogs report controlled-promotion
 *   blocks the v2 catalogs cannot evaluate, or (c) upstream
 *   Certification Engine v2 surfaced cross-source conflicts that
 *   propagate into this registry pack.
 *
 * Registry Framework v2 output is internal evidence only. It does
 * not create external promotion, public verification, regulatory
 * reliance, lender commitment, or legal reliance. Registry output
 * remains internal evidence unless separately promoted through
 * governed controlled-promotion gates.
 *
 * Master Volume Governance:
 * - Vol I: keeps the framework subordinate to constitutional
 *   authority.
 * - Vol II: blocks the framework from claiming external promotion,
 *   public verification, regulatory reliance, or legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   registry-framework-v2-runtime-v0.1.0 →
 *   certification-engine-v2-runtime-v0.1.0 →
 *   governance-evidence-engine-v2-runtime-v0.1.0 →
 *   advanced-intelligence-v2-runtime-v0.1.0 →
 *   lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   registry-framework-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification.
 * - Vol IV: routes governed handoffs to Certification Engine v2,
 *   Evidence Engine v2, Advanced Intelligence v2, Lender Workflow
 *   v2, Opportunity Discovery v2, Financing Pathway Engine v2,
 *   Revenue Intelligence v2, Customer Type Registry, Capital
 *   Graph, legacy v1 registry framework, evidence packets, audit
 *   replay, governance, reviews, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and internal-registry-only
 *   boundaries.
 * - Vol VI: keeps every composed catalog entry behind a public-safe
 *   DTO; no raw borrower / sponsor records, no live external fetch,
 *   no source-certainty claim.
 *
 * Safety boundary:
 * - Internal registry evidence only.
 * - No external promotion / public verification / regulatory
 *   reliance / autonomous customer eligibility / pathway /
 *   opportunity / intelligence / evidence / certification /
 *   registry determination, credit decision, lender commitment,
 *   payment authorization, or legal reliance.
 */

export const REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION =
  "registry-framework-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type RegistryFrameworkV2CatalogId =
  | "capital_program_catalog"
  | "customer_type_catalog"
  | "capital_category_catalog"
  | "certification_posture_catalog";

export type RegistryFrameworkV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerContext?: {
    declaredCustomerTypes?: string[];
    intendedUses?: string[];
    jurisdiction?: {
      federal?: boolean;
      state?: string | null;
      county?: string | null;
      utilityTerritory?: string | null;
    } | null;
  } | null;
  scope?: {
    v2Catalogs?: RegistryFrameworkV2CatalogId[];
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  legacy?: RegistryFrameworkInput["scope"];
  metadata?: Record<string, unknown> | null;
};

export type RegistryFrameworkV2Entry = {
  entryId: string;
  catalog: RegistryFrameworkV2CatalogId;
  title: string;
  summary: string;
  fields: Array<{ label: string; value: string }>;
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type RegistryFrameworkV2CatalogResult = {
  id: RegistryFrameworkV2CatalogId;
  label: string;
  entries: RegistryFrameworkV2Entry[];
  reviewRoute: string;
};

export type RegistryFrameworkV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type RegistryFrameworkV2LegacyBridge = {
  registryFrameworkVersion: string;
  legacyCatalogCount: number;
  legacyModuleCount: number;
  legacyPublicSurfaceCount: number;
  legacyEventContractCount: number;
  legacyHandoffCount: number;
  legacyTotalEntryCount: number;
  legacyProductionBlockedEntryCount: number;
  certificationEngineV2Version: string;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type RegistryFrameworkV2Summary = {
  v2CatalogCount: number;
  v2EntryCount: number;
  v2CapitalProgramEntryCount: number;
  v2CustomerTypeEntryCount: number;
  v2CapitalCategoryEntryCount: number;
  v2CertificationPostureEntryCount: number;
  legacyCatalogCount: number;
  legacyTotalEntryCount: number;
  legacyProductionBlockedEntryCount: number;
  crossSourceConflictCount: number;
  certificationV2OverallReadinessPercent: number;
  certificationV1OverallReadinessPercent: number;
};

export type RegistryFrameworkV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: RegistryFrameworkV2Summary;
  v2Catalogs: RegistryFrameworkV2CatalogResult[];
  legacyResult: RegistryFrameworkResult;
  crossSourceConflicts: RegistryFrameworkV2CrossSourceConflict[];
  legacyBridge: RegistryFrameworkV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  internalRegistryOnly: true;
  registryFrameworkV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousRegistry: true;
  noExternalPromotion: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Canonical disclosure / production-restriction posture
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "external promotion",
  "external certification",
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "autonomous certification determination",
  "autonomous registry determination",
  "public verification",
  "regulatory reliance",
  "lender commitment",
  "credit decision",
  "underwriting decision",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "payment authorization",
  "official report publication",
  "live external action",
  "source certainty",
  "legal reliance",
] as const;

export const REGISTRY_FRAMEWORK_V2_DISCLOSURES = [
  "Registry Framework v2 output is internal registry evidence, replay-safe, audit-safe, and conflict-preserving.",
  "Registry Framework v2 does not authorize external promotion, external certification, public verification, regulatory reliance, lender commitment, credit decision, official report publication, environmental clearance, carbon-credit issuance, or legal reliance.",
  "Registry Framework v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "Registry output remains internal evidence unless separately promoted through governed controlled-promotion gates.",
  "When the legacy v1 registry framework and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Four v2 governed catalogs (capital-program, customer-type, capital-category, certification-posture) inherit upstream CE v2 + EE v2 + Capital Graph + Customer Type doctrine refs and remain review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed registry signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const REGISTRY_FRAMEWORK_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
  "no autonomous registry determination",
  "no external promotion",
  "no external certification",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no tax-credit allocation",
  "no environmental clearance",
  "no carbon-credit issuance",
  "no guaranteed revenue",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

const V2_CATALOG_IDS: readonly RegistryFrameworkV2CatalogId[] = [
  "capital_program_catalog",
  "customer_type_catalog",
  "capital_category_catalog",
  "certification_posture_catalog",
];

const V2_CATALOG_LABELS: Record<RegistryFrameworkV2CatalogId, string> = {
  capital_program_catalog: "Capital Program Catalog",
  customer_type_catalog: "Customer Type Catalog",
  capital_category_catalog: "Capital Category Catalog",
  certification_posture_catalog: "Certification Posture Catalog",
};

const V2_CATALOG_REVIEW_ROUTES: Record<RegistryFrameworkV2CatalogId, string> = {
  capital_program_catalog: "/governance/capital-graph",
  customer_type_catalog: "/governance/customer-types",
  capital_category_catalog: "/governance/capital-graph",
  certification_posture_catalog: "/governance/certification-engine-v2",
};

// =============================================================================
// Composition helpers
// =============================================================================

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const key =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? value
        : JSON.stringify(value);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(value);
  }

  return out;
}

function programToEntry(program: CapitalProgram): RegistryFrameworkV2Entry {
  return {
    entryId: `rf-v2-program-${program.programId}`,
    catalog: "capital_program_catalog",
    title: program.programName,
    summary: `Capital program ${program.programId} (category ${program.categoryId}, sponsor ${program.sponsorAuthority}, federation ${program.federationScope}).`,
    fields: [
      { label: "program id", value: program.programId },
      { label: "category", value: program.categoryId },
      { label: "sponsor authority", value: program.sponsorAuthority },
      { label: "federation scope", value: program.federationScope },
      { label: "version", value: program.programVersion },
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS, ...program.blockedClaims],
    reviewRoute: V2_CATALOG_REVIEW_ROUTES.capital_program_catalog,
    doctrineRefs: [...program.doctrineRefs],
  };
}

function customerTypeToEntry(
  customerType: CustomerType
): RegistryFrameworkV2Entry {
  return {
    entryId: `rf-v2-customer-${customerType.typeId}`,
    catalog: "customer_type_catalog",
    title: customerType.label,
    summary: `Customer type ${customerType.typeId} (archetype ${customerType.archetype}, federation ${customerType.federationScope}, ${customerType.eligibleCapitalCategories.length} eligible capital categories).`,
    fields: [
      { label: "type id", value: customerType.typeId },
      { label: "archetype", value: customerType.archetype },
      { label: "federation scope", value: customerType.federationScope },
      {
        label: "eligible capital categories",
        value: customerType.eligibleCapitalCategories.join(","),
      },
      { label: "review boundary", value: customerType.reviewBoundary },
      { label: "version", value: customerType.customerTypeVersion },
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      ...customerType.blockedClaims,
    ],
    reviewRoute: V2_CATALOG_REVIEW_ROUTES.customer_type_catalog,
    doctrineRefs: [...customerType.doctrineRefs],
  };
}

function buildCapitalProgramCatalog(): RegistryFrameworkV2Entry[] {
  return CAPITAL_GRAPH_REGISTRY.map(programToEntry);
}

function buildCustomerTypeCatalog(): RegistryFrameworkV2Entry[] {
  return CUSTOMER_TYPE_REGISTRY.map(customerTypeToEntry);
}

function buildCapitalCategoryCatalog(): RegistryFrameworkV2Entry[] {
  return CAPITAL_CATEGORY_GOVERNANCE.map((category) => ({
    entryId: `rf-v2-category-${category.id}`,
    catalog: "capital_category_catalog" as const,
    title: category.label,
    summary: `Capital category ${category.id} — ${category.description}`,
    fields: [
      { label: "category id", value: category.id },
      { label: "label", value: category.label },
      {
        label: "description",
        value: category.description,
      },
      {
        label: "doctrine refs",
        value: category.doctrineRefs.join(" · "),
      },
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_CATALOG_REVIEW_ROUTES.capital_category_catalog,
    doctrineRefs: [...category.doctrineRefs],
  }));
}

function buildCertificationPostureCatalog(
  certificationResult: CertificationEngineV2Result
): RegistryFrameworkV2Entry[] {
  return certificationResult.v2Dimensions.map((dimension) => ({
    entryId: `rf-v2-certification-${dimension.id}`,
    catalog: "certification_posture_catalog" as const,
    title: dimension.label,
    summary: `Certification dimension ${dimension.id} status ${dimension.status} (readiness ${dimension.readinessPercent}%, coverage ${dimension.coverageCount}, evidence entries ${dimension.evidenceEntryCount}).`,
    fields: [
      { label: "status", value: dimension.status },
      {
        label: "readiness %",
        value: String(dimension.readinessPercent),
      },
      { label: "coverage count", value: String(dimension.coverageCount) },
      {
        label: "evidence entries",
        value: String(dimension.evidenceEntryCount),
      },
      {
        label: "blocking gates",
        value: dimension.blockingGates.join(" · ") || "(none)",
      },
      {
        label: "review signals",
        value: dimension.reviewSignals.join(" · ") || "(none)",
      },
    ],
    blockedClaims: [
      ...DEFAULT_BLOCKED_CLAIMS,
      ...dimension.blockedClaims,
    ],
    reviewRoute: V2_CATALOG_REVIEW_ROUTES.certification_posture_catalog,
    doctrineRefs: [...dimension.doctrineRefs],
  }));
}

const V2_CATALOG_BUILDERS: Record<
  RegistryFrameworkV2CatalogId,
  (
    certificationResult: CertificationEngineV2Result
  ) => RegistryFrameworkV2Entry[]
> = {
  capital_program_catalog: () => buildCapitalProgramCatalog(),
  customer_type_catalog: () => buildCustomerTypeCatalog(),
  capital_category_catalog: () => buildCapitalCategoryCatalog(),
  certification_posture_catalog: (certificationResult) =>
    buildCertificationPostureCatalog(certificationResult),
};

function buildLegacyInput(
  input: RegistryFrameworkV2Input
): RegistryFrameworkInput {
  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    scope: input.legacy ?? null,
    metadata: input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  v2EntryCount: number,
  legacyResult: RegistryFrameworkResult,
  certificationResult: CertificationEngineV2Result
): RegistryFrameworkV2CrossSourceConflict[] {
  const conflicts: RegistryFrameworkV2CrossSourceConflict[] = [];

  if (v2EntryCount === 0 && legacyResult.summary.totalEntryCount > 0) {
    conflicts.push({
      conflictId: "rf-v2-v2-empty-coverage",
      topic:
        "Canonical v2 stack returned no catalog entries while legacy v1 pack produced entries",
      description: `Legacy v1 registry framework reports ${legacyResult.summary.totalEntryCount} catalog entr(ies) but the v2 stack reports none; review whether the v2 scope is restricted.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/registry-framework-v2",
    });
  }

  if (certificationResult.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "rf-v2-upstream-certification-conflicts",
      topic:
        "Upstream Certification Engine v2 surfaced cross-source conflicts",
      description: `Certification Engine v2 composition surfaced ${certificationResult.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Registry Framework v2 evidence; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/registry-framework-v2",
    });
  }

  if (
    certificationResult.summary.v1BlockedCount > 0 &&
    legacyResult.summary.totalEntryCount > 0
  ) {
    conflicts.push({
      conflictId: "rf-v2-v1-certification-blocked",
      topic:
        "Upstream legacy v1 certification reports blocked-gate domains while registry catalogs remain populated",
      description: `Legacy v1 certification engine reports ${certificationResult.summary.v1BlockedCount} blocked-gate domain(s); registry catalogs should be reviewed for promotion eligibility before any controlled-promotion gate runs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/registry-framework-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeRegistryFrameworkV2(
  input: RegistryFrameworkV2Input = {}
): RegistryFrameworkV2Result {
  // 1. Compose Certification Engine v2 (which composes the full
  //    canonical v2 stack via Evidence Engine v2 at the borrower-
  //    context scope plus legacy v1 internal certification engine).
  const certificationResult: CertificationEngineV2Result =
    composeCertificationEngineV2({
      reviewerRole: input.reviewerRole ?? null,
      userId: input.userId ?? null,
      applicationId: input.applicationId ?? null,
      borrowerContext: input.borrowerContext ?? null,
      scope: input.scope
        ? {
            capitalCategoryIds: input.scope.capitalCategoryIds,
            sovereignFederationAllowed:
              input.scope.sovereignFederationAllowed === true,
          }
        : null,
      metadata: input.metadata ?? null,
    });

  // 2. Compose legacy v1 registry framework.
  const legacyResult = evaluateRegistryFramework(buildLegacyInput(input));

  // 3. Build v2 governed registry catalogs.
  const requestedV2Catalogs: readonly RegistryFrameworkV2CatalogId[] =
    input.scope?.v2Catalogs && input.scope.v2Catalogs.length > 0
      ? input.scope.v2Catalogs
      : V2_CATALOG_IDS;

  const v2Catalogs: RegistryFrameworkV2CatalogResult[] = requestedV2Catalogs
    .filter((id) => V2_CATALOG_IDS.includes(id))
    .map((id) => ({
      id,
      label: V2_CATALOG_LABELS[id],
      entries: V2_CATALOG_BUILDERS[id](certificationResult),
      reviewRoute: V2_CATALOG_REVIEW_ROUTES[id],
    }));

  const v2EntryCount = v2Catalogs.reduce(
    (sum, catalog) => sum + catalog.entries.length,
    0
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    v2EntryCount,
    legacyResult,
    certificationResult
  );

  // 5. Per-catalog counts.
  const findCatalogCount = (catalogId: RegistryFrameworkV2CatalogId) =>
    v2Catalogs.find((catalog) => catalog.id === catalogId)?.entries.length ?? 0;

  const summary: RegistryFrameworkV2Summary = {
    v2CatalogCount: v2Catalogs.length,
    v2EntryCount,
    v2CapitalProgramEntryCount: findCatalogCount("capital_program_catalog"),
    v2CustomerTypeEntryCount: findCatalogCount("customer_type_catalog"),
    v2CapitalCategoryEntryCount: findCatalogCount("capital_category_catalog"),
    v2CertificationPostureEntryCount: findCatalogCount(
      "certification_posture_catalog"
    ),
    legacyCatalogCount: legacyResult.catalogs.length,
    legacyTotalEntryCount: legacyResult.summary.totalEntryCount,
    legacyProductionBlockedEntryCount:
      legacyResult.summary.productionBlockedEntryCount,
    crossSourceConflictCount: crossSourceConflicts.length,
    certificationV2OverallReadinessPercent:
      certificationResult.summary.v2OverallReadinessPercent,
    certificationV1OverallReadinessPercent:
      certificationResult.summary.v1OverallReadinessPercent,
  };

  const recommendedReviewRoutes = unique([
    "/governance/registry-framework-v2",
    "/governance/certification-engine-v2",
    "/governance/evidence-engine-v2",
    "/governance/advanced-intelligence-v2",
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/governance/registry-framework",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Catalogs,
    legacyResult,
    crossSourceConflicts,
    legacyBridge: {
      registryFrameworkVersion: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      legacyCatalogCount: legacyResult.catalogs.length,
      legacyModuleCount: legacyResult.modules.length,
      legacyPublicSurfaceCount: legacyResult.publicSurfaces.length,
      legacyEventContractCount: legacyResult.eventContracts.length,
      legacyHandoffCount: legacyResult.handoffs.length,
      legacyTotalEntryCount: legacyResult.summary.totalEntryCount,
      legacyProductionBlockedEntryCount:
        legacyResult.summary.productionBlockedEntryCount,
      certificationEngineV2Version: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
      evidenceEngineV2Version: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
      advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
      lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version:
        OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...REGISTRY_FRAMEWORK_V2_DISCLOSURES,
      ...REGISTRY_FRAMEWORK_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...REGISTRY_FRAMEWORK_V2_PRODUCTION_RESTRICTIONS,
      ...REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    internalRegistryOnly: true,
    registryFrameworkV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousRegistry: true,
    noExternalPromotion: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function registryFrameworkV2Lineage(): {
  runtimeVersion: string;
  certificationEngineV2Version: string;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  capitalCategoryCount: number;
  legacyRegistryFrameworkVersion: string;
} {
  return {
    runtimeVersion: REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    certificationEngineV2Version: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    evidenceEngineV2Version: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    capitalCategoryCount: CAPITAL_CATEGORY_GOVERNANCE.length,
    legacyRegistryFrameworkVersion: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
  };
}

export const REGISTRY_FRAMEWORK_V2_CATALOG_IDS = V2_CATALOG_IDS;
