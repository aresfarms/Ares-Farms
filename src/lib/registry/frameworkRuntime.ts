import {
  EventContract,
  eventContractRegistry,
} from "@/lib/modules/eventContractRegistry";
import {
  ModuleHandoff,
  crossModuleHandoffMap,
} from "@/lib/modules/handoffMap";
import {
  ModuleManifest,
  moduleManifests,
  publicSurfaceManifests,
} from "@/lib/modules/moduleRegistry";
import {
  SOURCE_AUTHORITY_REGISTRY,
  SOURCE_INTELLIGENCE_VERSION,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Registry Framework Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps the framework subordinate to constitutional authority;
 *   registries describe accountable platform state and never replace
 *   external promotion, public verification, or regulatory reliance.
 * - Vol II: blocks the framework from claiming external promotion,
 *   public verification, regulatory reliance, lender commitment, or legal
 *   reliance.
 * - Vol III: provides deterministic, replay-safe composition over the
 *   canonical module manifest registry, event contract registry, handoff
 *   map, public surface gateway, source authority registry, controlled
 *   promotion gates, and participant role registry.
 * - Vol III-B: supplies runtime evidence with version lineage,
 *   classification, observability, and explainability-ready posture.
 * - Vol IV: routes framework handoffs to the Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Module Readiness Control Tower, Audit Replay Console, Governance,
 *   Reviews, and the Controlled Promotion Activation Gate.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI-VII: keeps the framework internal-only; no portable external
 *   conformance or verification claim is created.
 *
 * Safety boundary:
 * - Registry output is internal evidence only.
 * - It does not create external promotion, public verification,
 *   regulatory reliance, lender commitment, environmental clearance,
 *   payment authorization, official report publication, notice send,
 *   live external action, or legal reliance.
 * - Registry output remains internal evidence unless separately promoted
 *   through governed controlled-promotion gates.
 */

export const REGISTRY_FRAMEWORK_RUNTIME_VERSION =
  "registry-framework-runtime-v0.1.0";

export type RegistryCatalogId =
  | "modules"
  | "public_surfaces"
  | "event_contracts"
  | "handoffs"
  | "source_authorities"
  | "controlled_promotion"
  | "participant_roles";

export type RegistryFrameworkInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  scope?: {
    catalogIds?: RegistryCatalogId[];
    audience?: ModuleManifest["audience"][number];
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type RegistryModuleSummary = {
  moduleId: string;
  moduleNumber?: number;
  title: string;
  route: string;
  audience: ModuleManifest["audience"];
  claimsProfile: ModuleManifest["claimsProfile"];
  publicSurfaceAllowed: boolean;
  productionBlocked: boolean;
  replayRequired: boolean;
  permissionCount: number;
  dataDependencyCount: number;
  requiredGovernance: string[];
};

export type RegistryEventContractSummary = {
  eventType: string;
  producerModuleId: string;
  consumerCount: number;
  classificationLevel: EventContract["classificationLevel"];
  replayRequired: boolean;
  publicSurfaceAllowed: boolean;
  productionBlocked: boolean;
};

export type RegistryHandoffSummary = {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  fromRoute: string;
  toRoute: string;
  eventType: string;
  humanReviewBoundary: boolean;
  productionBlocked: boolean;
};

export type RegistrySourceAuthoritySummary = {
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  authorityTier: string;
  institutionalReliability: string;
  classificationLevel: string;
  connectorCertificationStatus: string;
  jurisdictionCount: number;
};

export type RegistryControlledPromotionSummary = {
  moduleId: string;
  moduleNumber?: number;
  title: string;
  route: string;
  productionBlocked: boolean;
  replayRequired: boolean;
  description: string;
  governanceTags: string[];
};

export type RegistryParticipantRoleSummary = {
  roleId: string;
  label: string;
  scope: string;
  authoritySource: string;
  reviewBoundary: string;
};

export type RegistryCatalogStatus = {
  id: RegistryCatalogId;
  label: string;
  entryCount: number;
  productionBlocked: boolean;
  versionRef: string;
  reviewRoute: string;
  notes: string[];
};

export type RegistryFrameworkSummary = {
  catalogCount: number;
  totalEntryCount: number;
  productionBlockedEntryCount: number;
  publicSurfaceEntryCount: number;
  internalOnlyEntryCount: number;
};

export type RegistryFrameworkResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  summary: RegistryFrameworkSummary;
  catalogs: RegistryCatalogStatus[];
  modules: RegistryModuleSummary[];
  publicSurfaces: RegistryModuleSummary[];
  eventContracts: RegistryEventContractSummary[];
  handoffs: RegistryHandoffSummary[];
  sourceAuthorities: RegistrySourceAuthoritySummary[];
  controlledPromotion: RegistryControlledPromotionSummary[];
  participantRoles: RegistryParticipantRoleSummary[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  internalRegistryOnly: true;
  noExternalPromotion: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "external promotion",
  "public verification",
  "regulatory reliance",
  "lender commitment",
  "credit decision",
  "environmental clearance",
  "payment authorization",
  "official report publication",
  "live external action",
  "legal reliance",
] as const;

export const REGISTRY_FRAMEWORK_DISCLOSURES = [
  "Registry framework output is internal evidence only.",
  "Registry framework output does not create external promotion, public verification, regulatory reliance, lender commitment, or legal reliance.",
  "Registry framework output remains internal evidence unless separately promoted through governed controlled-promotion gates.",
  "Participant role registry describes named, qualified review authorities. The framework does not grant authority.",
  "Human review is required before any registry signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS = [
  "no external promotion",
  "no public verification",
  "no regulatory reliance",
  "no lender commitment",
  "no credit decision",
  "no environmental clearance",
  "no payment authorization",
  "no official report publication",
  "no notice send",
  "no live external action",
  "no legal reliance",
] as const;

const CONTROLLED_PROMOTION_MODULE_IDS = [
  "promotion",
  "controlled-promotion-activation",
  "source-legal-review",
  "source-promotion-packets",
  "source-production-readiness",
  "live-scraper-activation",
  "production-portal-readiness",
  "production-launch-evidence",
  "deployment-environment-readiness",
  "release-candidate-freeze",
  "production-cutover-hold",
  "production-release-board",
  "production-final-authority",
  "production-activation-ceremony",
  "production-reliance-verification",
] as const;

const PARTICIPANT_ROLE_SEEDS: RegistryParticipantRoleSummary[] = [
  {
    roleId: "constitutional-authority",
    label: "Constitutional Authority",
    scope: "Final supremacy, no-conflict review, and explicit launch authority across Master Volume governance.",
    authoritySource: "Vol I Constitutional Backbone",
    reviewBoundary:
      "Approves only the explicit launch authority steps that name it; does not approve compliance, legal, environmental, or external verification.",
  },
  {
    roleId: "qualified-release-manager",
    label: "Qualified Release Manager",
    scope: "Release packaging, freeze plan, deployment sequence, rollback, audit/replay export, and qualified release ceremony.",
    authoritySource: "Vol IV Operational Runbooks",
    reviewBoundary:
      "Coordinates release; does not grant lender, credit, regulatory, or public-verification authority.",
  },
  {
    roleId: "legal-compliance-reviewer",
    label: "Legal/Compliance Reviewer",
    scope: "Legal/ToS/licensing scope, regulatory communication scope, and content claims posture.",
    authoritySource: "Vol II Regulatory Governance",
    reviewBoundary:
      "Provides review-bound assessment; does not provide legal advice or grant legal reliance.",
  },
  {
    roleId: "source-promotion-authority",
    label: "Source Promotion Authority",
    scope: "Source promotion packet completeness, credential vault, adapter, replay, provenance, failover, rollback, incident, and claims evidence.",
    authoritySource: "Vol VI Source Intelligence Integration",
    reviewBoundary:
      "Approves controlled source promotion; does not authorize live external action without separate gate approval.",
  },
  {
    roleId: "controlled-promotion-board",
    label: "Controlled Promotion Board",
    scope: "Promotion change record, risk signoff, source readiness, legal approval, activation ceremony, post-activation verification, and rollback controls.",
    authoritySource: "Vol III-B Governance Runtime + Vol IV Operational Runbooks",
    reviewBoundary:
      "Board approval; remains review-bound until reliance authority and public verification gates separately approve.",
  },
  {
    roleId: "environmental-engineering-spoke",
    label: "Environmental Engineering Spoke",
    scope: "Environmental pathway, provider-license, fee-control, spoke-isolation, and audit-anchor review.",
    authoritySource: "Vol V Canonical Doctrines (ROLE-ARCH-001, REG-NEPA-001)",
    reviewBoundary:
      "Provides environmental review only; does not authorize environmental clearance, permit, or determination.",
  },
  {
    roleId: "banker-spoke",
    label: "Banker Spoke",
    scope: "Lender coordination intake, overlays, evidence orientation, and partner workflow coordination.",
    authoritySource: "Vol V Canonical Doctrines (ROLE-ARCH-001)",
    reviewBoundary:
      "Coordination only; no approval, eligibility, underwriting, credit decision, or lender commitment is created.",
  },
  {
    roleId: "operations-owner",
    label: "Operations Owner",
    scope: "Monitoring, alerting, SLOs, on-call roster, incident bridge, rollback drill, backup/restore, and emergency hold.",
    authoritySource: "Vol IV Operational Runbooks",
    reviewBoundary:
      "Operations review; does not authorize production launch or external public verification.",
  },
  {
    roleId: "incident-commander",
    label: "Incident Commander",
    scope: "Incident roles, severity model, on-call escalation, rollback decision tree, audit/replay/data integrity, communications, and emergency hold.",
    authoritySource: "Vol IV Operational Runbooks",
    reviewBoundary:
      "Manages incident response; does not authorize regulatory or legal reliance.",
  },
  {
    roleId: "reliance-authority",
    label: "Reliance Authority",
    scope: "Public verification infrastructure, claims, DTOs, external recipients, audit/replay, privacy/redaction/data rights, and source authority.",
    authoritySource: "Vol II Regulatory Governance + Vol V Canonical Doctrines",
    reviewBoundary:
      "Reviews reliance posture; public verification and official reliance remain blocked until both this authority and the public verification gate separately approve.",
  },
  {
    roleId: "regulatory-response-owner",
    label: "Regulatory Response Owner",
    scope: "Examination scope, archive completeness, retention/legal hold, audit/replay export, privacy/redaction/public records, and regulatory communication.",
    authoritySource: "Vol II Regulatory Governance",
    reviewBoundary:
      "Coordinates regulatory response; remains review-bound until separate reliance authority approves official communication.",
  },
  {
    roleId: "governance-archivist",
    label: "Governance Archivist",
    scope: "Checkpoint evidence pack, ignored-sensitive-file verification, tree drift resolution, backend verification, and production build evidence.",
    authoritySource: "Vol IV Operational Runbooks + Vol V Canonical Doctrines",
    reviewBoundary:
      "Evidence preservation only; does not authorize production launch or external promotion.",
  },
] as const;

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const key =
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
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

function summarizeModule(manifest: ModuleManifest): RegistryModuleSummary {
  return {
    moduleId: manifest.id,
    moduleNumber: manifest.moduleNumber,
    title: manifest.title,
    route: manifest.route,
    audience: manifest.audience,
    claimsProfile: manifest.claimsProfile,
    publicSurfaceAllowed: manifest.publicSurfaceAllowed,
    productionBlocked: manifest.productionBlocked,
    replayRequired: manifest.replayRequired,
    permissionCount: manifest.permissions.length,
    dataDependencyCount: manifest.dataDependencies.length,
    requiredGovernance: [...manifest.requiredGovernance],
  };
}

function summarizeEventContract(
  contract: EventContract
): RegistryEventContractSummary {
  return {
    eventType: contract.eventType,
    producerModuleId: contract.producerModuleId,
    consumerCount: contract.consumerModuleIds.length,
    classificationLevel: contract.classificationLevel,
    replayRequired: contract.replayRequired,
    publicSurfaceAllowed: contract.publicSurfaceAllowed,
    productionBlocked: contract.productionBlocked,
  };
}

function summarizeHandoff(handoff: ModuleHandoff): RegistryHandoffSummary {
  return {
    id: handoff.id,
    fromModuleId: handoff.fromModuleId,
    toModuleId: handoff.toModuleId,
    fromRoute: handoff.fromRoute,
    toRoute: handoff.toRoute,
    eventType: handoff.eventType,
    humanReviewBoundary: handoff.humanReviewBoundary,
    productionBlocked: handoff.productionBlocked,
  };
}

function buildSourceAuthoritySummaries(): RegistrySourceAuthoritySummary[] {
  return SOURCE_AUTHORITY_REGISTRY.map((source) => ({
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    sourceCategory: source.sourceCategory,
    authorityTier: source.sourceAuthorityTier,
    institutionalReliability: source.institutionalReliability,
    classificationLevel: source.classificationLevel,
    connectorCertificationStatus: source.connectorCertificationStatus,
    jurisdictionCount: source.jurisdictionScope.length,
  }));
}

function buildControlledPromotionSummaries(): RegistryControlledPromotionSummary[] {
  const out: RegistryControlledPromotionSummary[] = [];

  for (const id of CONTROLLED_PROMOTION_MODULE_IDS) {
    const manifest = moduleManifests.find((entry) => entry.id === id);

    if (!manifest) {
      continue;
    }

    out.push({
      moduleId: manifest.id,
      moduleNumber: manifest.moduleNumber,
      title: manifest.title,
      route: manifest.route,
      productionBlocked: manifest.productionBlocked,
      replayRequired: manifest.replayRequired,
      description: manifest.description,
      governanceTags: [...manifest.requiredGovernance],
    });
  }

  return out;
}

function shouldIncludeCatalog(
  id: RegistryCatalogId,
  scope: RegistryFrameworkInput["scope"]
): boolean {
  if (!scope || !Array.isArray(scope.catalogIds) || scope.catalogIds.length === 0) {
    return true;
  }

  return scope.catalogIds.includes(id);
}

function filterModulesByAudience(
  modules: ModuleManifest[],
  scope: RegistryFrameworkInput["scope"]
): ModuleManifest[] {
  const audience = scope?.audience;

  if (!audience) {
    return modules;
  }

  return modules.filter((module) => module.audience.includes(audience));
}

function buildCatalogStatuses(
  scope: RegistryFrameworkInput["scope"],
  counts: {
    modules: number;
    publicSurfaces: number;
    eventContracts: number;
    handoffs: number;
    sourceAuthorities: number;
    controlledPromotion: number;
    participantRoles: number;
  }
): RegistryCatalogStatus[] {
  const all: RegistryCatalogStatus[] = [
    {
      id: "modules",
      label: "Module manifest registry",
      entryCount: counts.modules,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/module-readiness",
      notes: [
        "Registers every governed module with audience, claims profile, replay, and production-block posture.",
      ],
    },
    {
      id: "public_surfaces",
      label: "Public surface gateway",
      entryCount: counts.publicSurfaces,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/trust",
      notes: [
        "Public-safe translation layer only. Public surfaces remain review-bound and not external verification.",
      ],
    },
    {
      id: "event_contracts",
      label: "Cross-module event contract registry",
      entryCount: counts.eventContracts,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/governance/evidence-engine",
      notes: [
        "Producer/consumer contracts with classification, replay, and production-block posture.",
      ],
    },
    {
      id: "handoffs",
      label: "Cross-module handoff map",
      entryCount: counts.handoffs,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/governance/evidence-engine",
      notes: [
        "Replay-required and human-review-bound handoffs between governed modules.",
      ],
    },
    {
      id: "source_authorities",
      label: "Source authority registry",
      entryCount: counts.sourceAuthorities,
      productionBlocked: true,
      versionRef: SOURCE_INTELLIGENCE_VERSION,
      reviewRoute: "/source-ingestion",
      notes: [
        "Source authority, provenance, replay, and classification posture without live external action.",
      ],
    },
    {
      id: "controlled_promotion",
      label: "Controlled promotion gate registry",
      entryCount: counts.controlledPromotion,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/promotion",
      notes: [
        "Named promotion gates with module-number, required authority, and blocked posture.",
      ],
    },
    {
      id: "participant_roles",
      label: "Participant role registry",
      entryCount: counts.participantRoles,
      productionBlocked: true,
      versionRef: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      reviewRoute: "/governance/certification-engine",
      notes: [
        "Named, qualified review authorities sourced from the Master Volume series. The framework does not grant authority.",
      ],
    },
  ];

  return all.filter((catalog) => shouldIncludeCatalog(catalog.id, scope));
}

export function evaluateRegistryFramework(
  input: RegistryFrameworkInput = {}
): RegistryFrameworkResult {
  const scope = input.scope ?? null;

  const modules = shouldIncludeCatalog("modules", scope)
    ? filterModulesByAudience(moduleManifests, scope).map(summarizeModule)
    : [];

  const publicSurfaces = shouldIncludeCatalog("public_surfaces", scope)
    ? filterModulesByAudience(publicSurfaceManifests(), scope).map(
        summarizeModule
      )
    : [];

  const eventContracts = shouldIncludeCatalog("event_contracts", scope)
    ? eventContractRegistry.map(summarizeEventContract)
    : [];

  const handoffs = shouldIncludeCatalog("handoffs", scope)
    ? crossModuleHandoffMap.map(summarizeHandoff)
    : [];

  const sourceAuthorities = shouldIncludeCatalog("source_authorities", scope)
    ? buildSourceAuthoritySummaries()
    : [];

  const controlledPromotion = shouldIncludeCatalog(
    "controlled_promotion",
    scope
  )
    ? buildControlledPromotionSummaries()
    : [];

  const participantRoles = shouldIncludeCatalog("participant_roles", scope)
    ? [...PARTICIPANT_ROLE_SEEDS]
    : [];

  const catalogs = buildCatalogStatuses(scope, {
    modules: modules.length,
    publicSurfaces: publicSurfaces.length,
    eventContracts: eventContracts.length,
    handoffs: handoffs.length,
    sourceAuthorities: sourceAuthorities.length,
    controlledPromotion: controlledPromotion.length,
    participantRoles: participantRoles.length,
  });

  const totalEntryCount =
    modules.length +
    publicSurfaces.length +
    eventContracts.length +
    handoffs.length +
    sourceAuthorities.length +
    controlledPromotion.length +
    participantRoles.length;

  const summary: RegistryFrameworkSummary = {
    catalogCount: catalogs.length,
    totalEntryCount,
    productionBlockedEntryCount:
      modules.filter((module) => module.productionBlocked).length +
      controlledPromotion.filter((entry) => entry.productionBlocked).length +
      eventContracts.filter((contract) => contract.productionBlocked).length +
      handoffs.filter((handoff) => handoff.productionBlocked).length,
    publicSurfaceEntryCount: publicSurfaces.length,
    internalOnlyEntryCount:
      modules.filter((module) => !module.publicSurfaceAllowed).length +
      eventContracts.filter((contract) => !contract.publicSurfaceAllowed).length,
  };

  const recommendedReviewRoutes = unique([
    "/governance/evidence-engine",
    "/governance/certification-engine",
    "/governance",
    "/module-readiness",
    "/evidence-packets",
    "/audit-replay",
    "/reviews",
    "/promotion",
  ]);

  return {
    runtimeVersion: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    summary,
    catalogs,
    modules,
    publicSurfaces,
    eventContracts,
    handoffs,
    sourceAuthorities,
    controlledPromotion,
    participantRoles,
    recommendedReviewRoutes,
    disclosures: unique([...REGISTRY_FRAMEWORK_DISCLOSURES]),
    productionRestrictions: unique([
      ...REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    internalRegistryOnly: true,
    noExternalPromotion: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
  };
}
