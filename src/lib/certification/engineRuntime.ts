import {
  EvidencePackHumanAuthority,
  composeGovernanceEvidencePack,
} from "@/lib/governance/evidenceEngine";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Internal Certification Engine Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps the engine subordinate to constitutional authority; internal
 *   certification describes accountable internal posture and never replaces
 *   external review, public verification, or regulatory reliance.
 * - Vol II: blocks the engine from claiming external certification, public
 *   verification, regulatory reliance, lender commitment, or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition of module
 *   readiness, source posture, connector posture, and module conformance
 *   from canonical registries.
 * - Vol III-B: supplies runtime evidence with version lineage, classification,
 *   observability, and explainability-ready posture.
 * - Vol IV: routes internal certification handoffs to the Governance
 *   Evidence Engine, the Module 16 Evidence Packet Workspace, Module
 *   Readiness Control Tower, Audit Replay Console, Governance, and Reviews.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI-VII: keeps the engine internal-only; no portable external
 *   conformance or verification claim is created.
 *
 * Safety boundary:
 * - The engine produces internal certification posture only.
 * - No external certification, public verification, regulatory reliance,
 *   lender commitment, environmental clearance, payment authorization,
 *   official report publication, notice send, live external action, or
 *   legal reliance is created or implied.
 * - External certification claims remain blocked until the public
 *   verification and reliance gates are approved.
 */

export const CERTIFICATION_ENGINE_RUNTIME_VERSION =
  "certification-engine-runtime-v0.1.0";

export type CertificationDomainId =
  | "module_readiness"
  | "source_posture"
  | "connector_posture"
  | "module_conformance";

export type CertificationStatus =
  | "CERTIFIED_INTERNAL_REVIEW_BOUND"
  | "REVIEW_PENDING"
  | "BLOCKED_BY_GATE"
  | "NOT_STARTED";

export type CertificationDomainInput = {
  readinessPercent?: number | null;
  verifiedCount?: number | null;
  totalCount?: number | null;
  blockedGateCount?: number | null;
  pendingHumanAuthorityCount?: number | null;
  evidenceRefs?: string[];
};

export type CertificationEngineInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  scope?: {
    moduleIds?: string[];
  } | null;
  domains?: Partial<Record<CertificationDomainId, CertificationDomainInput>>;
  metadata?: Record<string, unknown> | null;
};

export type CertificationDomainResult = {
  id: CertificationDomainId;
  label: string;
  status: CertificationStatus;
  readinessPercent: number;
  verifiedCount: number;
  totalCount: number;
  blockedGateCount: number;
  pendingHumanAuthorityCount: number;
  evidenceRefs: string[];
  reviewSignals: string[];
  blockedClaims: string[];
  blockingGates: string[];
  reviewRoute: string;
  requiredHumanAuthorities: EvidencePackHumanAuthority[];
};

export type CertificationEngineSummary = {
  domainCount: number;
  certifiedDomainCount: number;
  pendingDomainCount: number;
  blockedDomainCount: number;
  notStartedDomainCount: number;
  overallReadinessPercent: number;
  pendingHumanAuthorityCount: number;
  blockingGateCount: number;
};

export type CertificationEngineResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: CertificationEngineSummary;
  domains: CertificationDomainResult[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  internalCertificationOnly: true;
  noExternalCertification: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "external certification",
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

export const CERTIFICATION_DISCLOSURES = [
  "Internal certification posture is review-bound and not an external certification.",
  "Internal certification posture does not create public verification, regulatory reliance, or legal reliance.",
  "Internal certification posture does not create a lender commitment, credit decision, environmental clearance, or payment authorization.",
  "External certification claims remain blocked until the public verification and reliance gates are approved.",
  "Human authority mapping describes named, qualified review authorities. The engine does not grant authority.",
  "Pack output remains internal evidence unless separately promoted through governed controlled-promotion gates.",
  "Human review is required before any internal certification signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CERTIFICATION_PRODUCTION_RESTRICTIONS = [
  "no external certification",
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

const SOURCE_POSTURE_GATE_MODULE_IDS = [
  "source-legal-review",
  "source-promotion-packets",
  "source-production-readiness",
  "controlled-promotion-activation",
  "live-scraper-activation",
] as const;

const CONNECTOR_POSTURE_GATE_MODULE_IDS = ["connectors"] as const;

const MODULE_CONFORMANCE_GATE_MODULE_IDS = [
  "module-readiness",
  "doctrine-gap-ledger",
  "build-preservation",
] as const;

const MODULE_READINESS_GATE_MODULE_IDS = [
  "module-readiness",
  "production-portal-readiness",
  "deployment-environment-readiness",
  "release-candidate-freeze",
  "production-cutover-hold",
  "production-release-board",
  "production-operations-monitoring",
  "production-incident-response-readiness",
  "production-support-communications-readiness",
  "production-final-authority",
  "production-activation-ceremony",
  "production-post-activation-verification",
  "production-reliance-verification",
  "production-regulatory-examination",
  "production-regulatory-response",
] as const;

const DOMAIN_LABELS: Record<CertificationDomainId, string> = {
  module_readiness: "Module readiness",
  source_posture: "Source posture",
  connector_posture: "Connector posture",
  module_conformance: "Module conformance",
};

const DOMAIN_REVIEW_ROUTES: Record<CertificationDomainId, string> = {
  module_readiness: "/module-readiness",
  source_posture: "/source-ingestion",
  connector_posture: "/connectors",
  module_conformance: "/governance/evidence-engine",
};

const DOMAIN_GATE_MODULE_IDS: Record<CertificationDomainId, readonly string[]> = {
  module_readiness: MODULE_READINESS_GATE_MODULE_IDS,
  source_posture: SOURCE_POSTURE_GATE_MODULE_IDS,
  connector_posture: CONNECTOR_POSTURE_GATE_MODULE_IDS,
  module_conformance: MODULE_CONFORMANCE_GATE_MODULE_IDS,
};

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

function clampCount(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.trunc(parsed);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function gatherDomainAuthorities(
  domainId: CertificationDomainId
): EvidencePackHumanAuthority[] {
  const gateModuleIds = DOMAIN_GATE_MODULE_IDS[domainId];

  if (!gateModuleIds || gateModuleIds.length === 0) {
    return [];
  }

  const evidencePack = composeGovernanceEvidencePack({
    packIntent: "INTERNAL_REVIEW",
    moduleIds: Array.from(gateModuleIds),
  });

  return evidencePack.humanAuthorityMapping;
}

function deriveStatus(
  readinessPercent: number,
  blockedGateCount: number,
  totalCount: number,
  pendingHumanAuthorityCount: number
): CertificationStatus {
  if (totalCount === 0 && readinessPercent === 0 && blockedGateCount === 0) {
    return "NOT_STARTED";
  }

  if (blockedGateCount > 0) {
    return "BLOCKED_BY_GATE";
  }

  if (readinessPercent >= 100 && pendingHumanAuthorityCount === 0) {
    return "CERTIFIED_INTERNAL_REVIEW_BOUND";
  }

  return "REVIEW_PENDING";
}

function buildBlockingGates(
  domainId: CertificationDomainId,
  authorities: EvidencePackHumanAuthority[]
): string[] {
  if (domainId === "module_readiness" || domainId === "source_posture") {
    return authorities
      .filter((authority) => authority.gateBlocked)
      .map((authority) => `${authority.title} (${authority.route})`);
  }

  if (domainId === "connector_posture") {
    return authorities
      .filter((authority) => authority.gateBlocked)
      .map((authority) => `${authority.title} (${authority.route})`);
  }

  return authorities
    .filter((authority) => authority.gateBlocked)
    .map((authority) => `${authority.title} (${authority.route})`);
}

function summarizeDomain(
  id: CertificationDomainId,
  input: CertificationDomainInput | undefined
): CertificationDomainResult {
  const authorities = gatherDomainAuthorities(id);
  const blockingGates = buildBlockingGates(id, authorities);
  const pendingHumanAuthorityCount = authorities.filter(
    (authority) => authority.gateBlocked
  ).length;
  const evidenceRefs = unique([
    ...(Array.isArray(input?.evidenceRefs) ? input?.evidenceRefs ?? [] : []),
    ...authorities.flatMap((authority) => [
      `module:${authority.moduleId}`,
      `route:${authority.route}`,
    ]),
  ]);

  const totalCount = clampCount(input?.totalCount);
  const verifiedCount = clampCount(input?.verifiedCount);
  const inputReadiness =
    typeof input?.readinessPercent === "number"
      ? clampPercent(input.readinessPercent)
      : totalCount > 0
        ? clampPercent((verifiedCount / Math.max(1, totalCount)) * 100)
        : 0;
  const blockedGateCount =
    typeof input?.blockedGateCount === "number"
      ? clampCount(input.blockedGateCount)
      : pendingHumanAuthorityCount;

  const pendingAuthority =
    typeof input?.pendingHumanAuthorityCount === "number"
      ? clampCount(input.pendingHumanAuthorityCount)
      : pendingHumanAuthorityCount;

  const status = deriveStatus(
    inputReadiness,
    blockedGateCount,
    totalCount,
    pendingAuthority
  );

  const reviewSignals: string[] = [
    "Internal certification is review-bound and not an external certification.",
  ];

  if (pendingAuthority > 0) {
    reviewSignals.push(
      `${pendingAuthority} qualified human authority gate(s) remain pending.`
    );
  }

  if (blockedGateCount > 0 && status !== "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    reviewSignals.push(
      `${blockedGateCount} promotion gate(s) remain blocked across this domain.`
    );
  }

  if (status === "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    reviewSignals.push(
      "Internal posture is certified review-bound. External certification remains blocked until the public verification and reliance gates are approved."
    );
  }

  if (inputReadiness < 100 && status === "REVIEW_PENDING") {
    reviewSignals.push(
      `Internal readiness for this domain is ${inputReadiness}%; additional review remains pending.`
    );
  }

  return {
    id,
    label: DOMAIN_LABELS[id],
    status,
    readinessPercent: inputReadiness,
    verifiedCount,
    totalCount,
    blockedGateCount,
    pendingHumanAuthorityCount: pendingAuthority,
    evidenceRefs,
    reviewSignals: unique(reviewSignals),
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    blockingGates,
    reviewRoute: DOMAIN_REVIEW_ROUTES[id],
    requiredHumanAuthorities: authorities,
  };
}

function summarizeEngine(
  domains: CertificationDomainResult[]
): CertificationEngineSummary {
  const certifiedDomainCount = domains.filter(
    (domain) => domain.status === "CERTIFIED_INTERNAL_REVIEW_BOUND"
  ).length;
  const pendingDomainCount = domains.filter(
    (domain) => domain.status === "REVIEW_PENDING"
  ).length;
  const blockedDomainCount = domains.filter(
    (domain) => domain.status === "BLOCKED_BY_GATE"
  ).length;
  const notStartedDomainCount = domains.filter(
    (domain) => domain.status === "NOT_STARTED"
  ).length;
  const pendingHumanAuthorityCount = domains.reduce(
    (sum, domain) => sum + domain.pendingHumanAuthorityCount,
    0
  );
  const blockingGateCount = domains.reduce(
    (sum, domain) => sum + domain.blockingGates.length,
    0
  );

  const totalWeight = domains.length;
  const weighted = domains.reduce(
    (sum, domain) => sum + domain.readinessPercent,
    0
  );
  const overallReadinessPercent = clampPercent(
    totalWeight === 0 ? 0 : weighted / totalWeight
  );

  return {
    domainCount: domains.length,
    certifiedDomainCount,
    pendingDomainCount,
    blockedDomainCount,
    notStartedDomainCount,
    overallReadinessPercent,
    pendingHumanAuthorityCount,
    blockingGateCount,
  };
}

export function evaluateInternalCertification(
  input: CertificationEngineInput = {}
): CertificationEngineResult {
  const domains: CertificationDomainResult[] = (
    [
      "module_readiness",
      "source_posture",
      "connector_posture",
      "module_conformance",
    ] as CertificationDomainId[]
  ).map((id) => summarizeDomain(id, input.domains?.[id]));

  const summary = summarizeEngine(domains);

  const recommendedReviewRoutes = unique([
    ...domains.map((domain) => domain.reviewRoute),
    "/governance/evidence-engine",
    "/governance",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
    "/reviews",
  ]);

  return {
    runtimeVersion: CERTIFICATION_ENGINE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    domains,
    recommendedReviewRoutes,
    disclosures: unique([...CERTIFICATION_DISCLOSURES]),
    productionRestrictions: unique([...CERTIFICATION_PRODUCTION_RESTRICTIONS]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    internalCertificationOnly: true,
    noExternalCertification: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
  };
}

// Exported for downstream registries and verification surfaces.
export const CERTIFICATION_DOMAIN_IDS: CertificationDomainId[] = [
  "module_readiness",
  "source_posture",
  "connector_posture",
  "module_conformance",
];

// Touch the canonical registries so certification posture remains version-locked.
export function certificationRegistryLineage(): {
  moduleCount: number;
  eventContractCount: number;
  handoffCount: number;
} {
  return {
    moduleCount: moduleManifests.length,
    eventContractCount: eventContractRegistry.length,
    handoffCount: crossModuleHandoffMap.length,
  };
}
