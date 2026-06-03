import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
} from "@/lib/governance/contentClaimsPolicy";
import {
  EventContract,
  eventContractRegistry,
  eventContractsForModule,
} from "@/lib/modules/eventContractRegistry";
import {
  ModuleHandoff,
  crossModuleHandoffMap,
  handoffsForModule,
} from "@/lib/modules/handoffMap";
import {
  ModuleManifest,
  getModuleManifest,
  moduleManifests,
} from "@/lib/modules/moduleRegistry";

/**
 * Governance Evidence Composition Engine
 *
 * Master Volume Governance:
 * - Vol I: keeps the engine subordinate to constitutional authority; packs
 *   describe accountable governance posture and never replace it.
 * - Vol II: blocks pack composition from becoming official certification,
 *   public verification, regulatory reliance, lender commitment, credit
 *   decision, environmental clearance, or payment authorization.
 * - Vol III: provides deterministic, replay-safe composition across module
 *   manifests, event contracts, handoff trails, audit anchors, replay
 *   verification refs, classification posture, observability events,
 *   content claims posture, and human authority mapping.
 * - Vol III-B: supplies runtime evidence, version lineage, classification,
 *   observability, and explainability-ready output.
 * - Vol IV: routes pack handoffs to the existing Module 16 Evidence Packet
 *   Workspace, Audit Replay Console, Reviews, Governance, and Module
 *   Readiness Control Tower.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries on every
 *   composed pack.
 * - Vol VI-VII: keeps the engine as a portable governed module with safe
 *   internal-facing translation and no external conformance claim.
 *
 * Safety boundary:
 * - Pack composition is review-bound and evidence-only.
 * - It does not create approval, official certification, public verification,
 *   regulatory reliance, lender commitment, credit decision, environmental
 *   clearance, payment authorization, official report publication, notice
 *   send, or live external action.
 * - Human authority mapping describes named, qualified review authorities;
 *   the engine does not grant authority.
 */

export const GOVERNANCE_EVIDENCE_ENGINE_VERSION =
  "governance-evidence-engine-v0.1.0";

export type EvidencePackInput = {
  packIntent?:
    | "AUDIT_PREP"
    | "REGULATOR_BRIEF"
    | "LENDER_REVIEW"
    | "BUILD_RECORD"
    | "INTERNAL_REVIEW"
    | "PROMOTION_REVIEW";
  applicationId?: string | null;
  borrowerIdMasked?: string | null;
  moduleIds?: string[];
  eventTypes?: string[];
  traceRefs?: string[];
  replayRefs?: string[];
  auditAnchorRefs?: string[];
  reviewerRole?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type EvidencePackModuleSummary = {
  moduleId: string;
  moduleNumber?: number;
  title: string;
  route: string;
  audience: ModuleManifest["audience"];
  claimsProfile: ModuleManifest["claimsProfile"];
  publicSurfaceAllowed: boolean;
  productionBlocked: boolean;
  replayRequired: boolean;
  requiredGovernance: string[];
  eventsPublished: string[];
  eventsConsumed: string[];
};

export type EvidencePackEventContractSummary = {
  eventType: string;
  producerModuleId: string;
  consumerModuleIds: string[];
  classificationLevel: EventContract["classificationLevel"];
  replayRequired: boolean;
  publicSurfaceAllowed: boolean;
  productionBlocked: boolean;
  payloadFields: string[];
  purpose: string;
};

export type EvidencePackHandoffSummary = {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  fromRoute: string;
  toRoute: string;
  eventType: string;
  humanReviewBoundary: boolean;
  productionBlocked: boolean;
};

export type EvidencePackHumanAuthority = {
  moduleId: string;
  moduleNumber?: number;
  title: string;
  route: string;
  requiredAuthority: string;
  approvalBoundary: string;
  currentPosture: string;
  gateBlocked: boolean;
};

export type EvidencePackAuditAnchor = {
  ref: string;
  type:
    | "trace"
    | "replay"
    | "audit_ledger"
    | "version_runtime"
    | "explainability";
  module?: string;
};

export type EvidencePackSummary = {
  moduleCount: number;
  eventContractCount: number;
  handoffCount: number;
  humanAuthorityCount: number;
  auditAnchorCount: number;
  productionBlockedModuleCount: number;
  replayRequiredModuleCount: number;
  publicSurfaceModuleCount: number;
};

export type EvidencePackResult = {
  runtimeVersion: string;
  generatedAt: string;
  packIntent: EvidencePackInput["packIntent"];
  applicationId: string | null;
  borrowerIdMasked: string | null;
  reviewerRole: string | null;
  summary: EvidencePackSummary;
  modules: EvidencePackModuleSummary[];
  eventContracts: EvidencePackEventContractSummary[];
  handoffs: EvidencePackHandoffSummary[];
  humanAuthorityMapping: EvidencePackHumanAuthority[];
  auditAnchors: EvidencePackAuditAnchor[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  recommendedReviewRoutes: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  evidenceOnly: true;
  noOfficialCertification: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
};

const PACK_INTENT_DEFAULT_MODULES: Record<
  NonNullable<EvidencePackInput["packIntent"]>,
  string[]
> = {
  AUDIT_PREP: [
    "audit-replay",
    "evidence-packets",
    "governance",
    "module-readiness",
    "reviews",
  ],
  REGULATOR_BRIEF: [
    "governance",
    "audit-replay",
    "evidence-packets",
    "production-regulatory-examination",
    "production-regulatory-response",
    "reviews",
  ],
  LENDER_REVIEW: [
    "lender-workflow",
    "lender-evidence",
    "evidence-packets",
    "reviews",
  ],
  BUILD_RECORD: [
    "build-preservation",
    "doctrine-gap-ledger",
    "evidence-packets",
    "governance",
    "module-readiness",
  ],
  INTERNAL_REVIEW: [
    "governance",
    "evidence-packets",
    "module-readiness",
    "reviews",
  ],
  PROMOTION_REVIEW: [
    "promotion",
    "controlled-promotion-activation",
    "evidence-packets",
    "module-readiness",
    "reviews",
  ],
};

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "official certification",
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

export const GOVERNANCE_EVIDENCE_DISCLOSURES = [
  "Governance evidence pack composition is review-bound and evidence-only.",
  "Composition does not create approval, eligibility, certification, public verification, or regulatory reliance.",
  "Composition does not create a lender commitment, credit decision, environmental clearance, or payment authorization.",
  "Composition does not publish an official report or send a borrower notice.",
  "Human authority mapping describes named, qualified review authorities. Composition does not grant authority.",
  "Pack output remains internal evidence unless separately promoted through governed controlled-promotion gates.",
  "Human review is required before any pack signal is treated as a decision.",
  ADVISORY_ONLY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS = [
  "no approval",
  "no official certification",
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

const RECOMMENDED_REVIEW_ROUTES = [
  "/evidence-packets",
  "/audit-replay",
  "/governance",
  "/reviews",
  "/module-readiness",
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

function summarizeManifest(manifest: ModuleManifest): EvidencePackModuleSummary {
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
    requiredGovernance: [...manifest.requiredGovernance],
    eventsPublished: [...manifest.eventsPublished],
    eventsConsumed: [...manifest.eventsConsumed],
  };
}

function summarizeEventContract(
  contract: EventContract
): EvidencePackEventContractSummary {
  return {
    eventType: contract.eventType,
    producerModuleId: contract.producerModuleId,
    consumerModuleIds: [...contract.consumerModuleIds],
    classificationLevel: contract.classificationLevel,
    replayRequired: contract.replayRequired,
    publicSurfaceAllowed: contract.publicSurfaceAllowed,
    productionBlocked: contract.productionBlocked,
    payloadFields: [...contract.payloadFields],
    purpose: contract.purpose,
  };
}

function summarizeHandoff(handoff: ModuleHandoff): EvidencePackHandoffSummary {
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

type HumanAuthoritySeed = {
  moduleId: string;
  requiredAuthority: string;
  approvalBoundary: string;
  currentPosture: string;
  gateBlocked: boolean;
};

const HUMAN_AUTHORITY_SEEDS: HumanAuthoritySeed[] = [
  {
    moduleId: "live-scraper-activation",
    requiredAuthority: "Source Promotion Authority + Legal/Compliance Reviewer",
    approvalBoundary:
      "Source-specific legal/ToS/licensing, credential, adapter, provenance, replay, rollback, incident, and monitoring approval.",
    currentPosture: "Blocked; live fetch remains disabled.",
    gateBlocked: true,
  },
  {
    moduleId: "source-legal-review",
    requiredAuthority: "Qualified Legal/Compliance Reviewer",
    approvalBoundary:
      "Legal/ToS/licensing, anti-bulk, retention, republication, and public-display scope review.",
    currentPosture: "Review-bound; no legal advice and no live source approval.",
    gateBlocked: false,
  },
  {
    moduleId: "source-promotion-packets",
    requiredAuthority: "Source Promotion Authority",
    approvalBoundary:
      "Promotion packet completeness, source legal review, credential vault, adapter, replay, provenance, failover, rollback, incident, and claims evidence.",
    currentPosture:
      "Blocked pending qualified human source promotion approval.",
    gateBlocked: true,
  },
  {
    moduleId: "source-production-readiness",
    requiredAuthority: "Source Production Owner + Compliance Reviewer",
    approvalBoundary:
      "Final source production readiness, kill switch, activation ceremony, live adapter, audit export, claims review, and source-specific approval.",
    currentPosture: "Blocked; production source activation not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "controlled-promotion-activation",
    requiredAuthority: "Controlled Promotion Board",
    approvalBoundary:
      "Promotion change record, risk signoff, source readiness, legal approval, activation ceremony, post-activation verification, and rollback controls.",
    currentPosture: "Blocked; activation not executed.",
    gateBlocked: true,
  },
  {
    moduleId: "production-portal-readiness",
    requiredAuthority: "Portal Launch Owner + Security/Compliance Reviewer",
    approvalBoundary:
      "Portable surface, auth, security, audit, claims, redaction, support, rollback, incident, and launch-hold evidence.",
    currentPosture: "Blocked; portal launch not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "production-launch-evidence",
    requiredAuthority: "Qualified Release Manager + Legal/Compliance Reviewer",
    approvalBoundary:
      "Go-live packet, backend/security/auth approvals, claims freeze, monitoring, rollback, incident, support, audit, and qualified release ceremony.",
    currentPosture: "Blocked; go-live not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "deployment-environment-readiness",
    requiredAuthority: "Deployment Owner + Security Owner",
    approvalBoundary:
      "Production secrets, HTTPS, DNS/CDN/TLS/WAF, migrations, backup/restore, monitoring, rollback, and deployment hold release.",
    currentPosture: "Blocked; deployment not executed.",
    gateBlocked: true,
  },
  {
    moduleId: "release-candidate-freeze",
    requiredAuthority: "Release Manager",
    approvalBoundary:
      "Release candidate freeze, change freeze, verification, content freeze, migration plan, rollback, incident, and go-live hold review.",
    currentPosture: "Blocked; release candidate not frozen.",
    gateBlocked: true,
  },
  {
    moduleId: "production-cutover-hold",
    requiredAuthority: "Cutover Authority + Release Manager",
    approvalBoundary:
      "Cutover sequence, final launch hold, deployment hold, freeze hold, secrets, migrations, DNS/CDN/TLS/WAF, monitoring, rollback, support, and incident approval.",
    currentPosture: "Blocked; cutover authority not granted.",
    gateBlocked: true,
  },
  {
    moduleId: "production-release-board",
    requiredAuthority: "Production Release Board",
    approvalBoundary:
      "Board quorum, release manager, security, compliance, operations, support, public-copy, incident, rollback, communication, and cutover authority review.",
    currentPosture: "Blocked; release board approval not granted.",
    gateBlocked: true,
  },
  {
    moduleId: "production-operations-monitoring",
    requiredAuthority: "Operations Owner + On-Call Lead",
    approvalBoundary:
      "Monitoring, alerting, SLOs, on-call roster, incident bridge, rollback drill, backup/restore, audit export, emergency hold, and kill-switch review.",
    currentPosture: "Blocked; monitoring activation not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "production-incident-response-readiness",
    requiredAuthority:
      "Incident Commander + Legal/Compliance Escalation Owner",
    approvalBoundary:
      "Incident roles, severity model, on-call escalation, rollback decision tree, audit/replay/data integrity, communications, regulatory/legal escalation, emergency hold, and kill-switch review.",
    currentPosture: "Blocked; incident response activation not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "production-support-communications-readiness",
    requiredAuthority: "Support Lead + Communications/Compliance Reviewer",
    approvalBoundary:
      "Support routing, customer-safe language, status page, notice/adverse-action boundary, accessibility/translation, data-rights handoff, escalation runbook, and audit/replay evidence.",
    currentPosture: "Blocked; support operations not activated.",
    gateBlocked: true,
  },
  {
    moduleId: "production-final-authority",
    requiredAuthority: "Constitutional Authority + Qualified Release Manager",
    approvalBoundary:
      "Final supremacy/no-conflict review, release manager approval, production exposure, privacy/redaction/data rights, claims, communications freeze, monitoring/incident/rollback, audit/replay/evidence, and explicit launch authority.",
    currentPosture: "Blocked; final authority not granted.",
    gateBlocked: true,
  },
  {
    moduleId: "production-activation-ceremony",
    requiredAuthority: "Dual-Control Activation Authority",
    approvalBoundary:
      "Dual-control quorum, credential vault release, deployment and migration sequence, monitoring/post-activation verification, rollback, emergency hold, communications freeze, and audit/replay evidence.",
    currentPosture: "Blocked; activation ceremony not executed.",
    gateBlocked: true,
  },
  {
    moduleId: "production-post-activation-verification",
    requiredAuthority: "Watch-Window Owner + Operations Lead",
    approvalBoundary:
      "Verification runbook, watch-window ownership, synthetic health checks, public surface check, audit/replay export, monitoring/SLOs, rollback/emergency hold, support/communications, privacy/redaction/data-rights, and source boundary review.",
    currentPosture: "Blocked; production health not certified.",
    gateBlocked: true,
  },
  {
    moduleId: "production-reliance-verification",
    requiredAuthority: "Reliance Authority + Legal/Compliance Reviewer",
    approvalBoundary:
      "Public verification infrastructure, claims, DTOs, external recipients, audit/replay, privacy/redaction/data rights, source authority, report/notice/payment/legal/live-action boundaries, and reliance authority review.",
    currentPosture:
      "Blocked; public verification and official reliance not authorized.",
    gateBlocked: true,
  },
  {
    moduleId: "production-regulatory-examination",
    requiredAuthority:
      "Regulatory Response Owner + Legal/Compliance Reviewer",
    approvalBoundary:
      "Examination scope, archive completeness, retention/legal hold, audit/replay export, privacy/redaction/public records, regulatory communication, and source/report/notice/payment/legal/live-action boundaries.",
    currentPosture:
      "Blocked; regulator submission and archive certification not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "production-regulatory-response",
    requiredAuthority:
      "Regulatory Response Owner + Corrective Action Owner + Legal/Compliance Reviewer",
    approvalBoundary:
      "Examiner finding intake, response package, corrective-action plan, remediation evidence, legal/compliance language, audit/replay response evidence, privacy/redaction/public records, and source/report/notice/payment/legal/live-action boundaries.",
    currentPosture:
      "Blocked; official response, corrective-action commitment, and remediation execution not approved.",
    gateBlocked: true,
  },
  {
    moduleId: "build-preservation",
    requiredAuthority: "Governance Archivist + Release Manager",
    approvalBoundary:
      "Checkpoint evidence pack, ignored-sensitive-file verification, tree drift resolution, backend verification, production build evidence, and preservation of all production authority blocks.",
    currentPosture:
      "Evidence-only; checkpoint archived without production authority.",
    gateBlocked: false,
  },
  {
    moduleId: "doctrine-gap-ledger",
    requiredAuthority:
      "Constitutional Authority + Release Manager + Public Surface Governance Owner + Claims/Compliance Reviewer + Source Intelligence Governance Owner + Public DTO Owner",
    approvalBoundary:
      "Named gap ownership, route mapping, blocked reason, required evidence, promotion condition, ticket reference, current Master Volume version evidence, and controlled-promotion review.",
    currentPosture:
      "Review-bound; the three remaining gaps are named and blocked pending qualified controlled promotion.",
    gateBlocked: false,
  },
];

function buildHumanAuthorityMapping(
  scopedModuleIds: Set<string>
): EvidencePackHumanAuthority[] {
  const out: EvidencePackHumanAuthority[] = [];

  for (const seed of HUMAN_AUTHORITY_SEEDS) {
    if (!scopedModuleIds.has(seed.moduleId)) {
      continue;
    }

    const manifest = getModuleManifest(seed.moduleId);

    if (!manifest) {
      continue;
    }

    out.push({
      moduleId: manifest.id,
      moduleNumber: manifest.moduleNumber,
      title: manifest.title,
      route: manifest.route,
      requiredAuthority: seed.requiredAuthority,
      approvalBoundary: seed.approvalBoundary,
      currentPosture: seed.currentPosture,
      gateBlocked: seed.gateBlocked,
    });
  }

  return out;
}

function resolveScopedModuleIds(input: EvidencePackInput): string[] {
  const explicit = Array.isArray(input.moduleIds)
    ? input.moduleIds.filter((id) => typeof id === "string" && id.trim().length > 0)
    : [];

  if (explicit.length > 0) {
    return unique(explicit);
  }

  if (input.packIntent && PACK_INTENT_DEFAULT_MODULES[input.packIntent]) {
    return unique(PACK_INTENT_DEFAULT_MODULES[input.packIntent]);
  }

  return unique(["governance", "evidence-packets", "module-readiness"]);
}

function expandModulesByEventTypes(
  baseIds: Set<string>,
  eventTypes: string[]
): Set<string> {
  if (eventTypes.length === 0) {
    return baseIds;
  }

  const next = new Set(baseIds);

  for (const eventType of eventTypes) {
    for (const contract of eventContractRegistry) {
      if (contract.eventType !== eventType) {
        continue;
      }

      next.add(contract.producerModuleId);

      for (const consumerId of contract.consumerModuleIds) {
        next.add(consumerId);
      }
    }
  }

  return next;
}

function buildAuditAnchors(input: EvidencePackInput): EvidencePackAuditAnchor[] {
  const anchors: EvidencePackAuditAnchor[] = [];

  for (const ref of input.traceRefs ?? []) {
    if (typeof ref === "string" && ref.trim().length > 0) {
      anchors.push({ ref, type: "trace" });
    }
  }

  for (const ref of input.replayRefs ?? []) {
    if (typeof ref === "string" && ref.trim().length > 0) {
      anchors.push({ ref, type: "replay" });
    }
  }

  for (const ref of input.auditAnchorRefs ?? []) {
    if (typeof ref === "string" && ref.trim().length > 0) {
      anchors.push({ ref, type: "audit_ledger" });
    }
  }

  return unique(anchors);
}

export function composeGovernanceEvidencePack(
  input: EvidencePackInput = {}
): EvidencePackResult {
  const scopedModuleIds = new Set(resolveScopedModuleIds(input));
  const eventTypes = Array.isArray(input.eventTypes)
    ? input.eventTypes.filter(
        (eventType) =>
          typeof eventType === "string" && eventType.trim().length > 0
      )
    : [];
  const expandedModuleIds = expandModulesByEventTypes(
    scopedModuleIds,
    eventTypes
  );

  const modules = moduleManifests
    .filter((manifest) => expandedModuleIds.has(manifest.id))
    .map(summarizeManifest);

  const contractKeys = new Set<string>();
  const eventContracts: EvidencePackEventContractSummary[] = [];

  for (const manifest of moduleManifests) {
    if (!expandedModuleIds.has(manifest.id)) {
      continue;
    }

    const contracts = eventContractsForModule(manifest.id);

    for (const contract of contracts) {
      if (contractKeys.has(contract.eventType)) {
        continue;
      }

      contractKeys.add(contract.eventType);
      eventContracts.push(summarizeEventContract(contract));
    }
  }

  for (const eventType of eventTypes) {
    if (contractKeys.has(eventType)) {
      continue;
    }

    const contract = eventContractRegistry.find(
      (entry) => entry.eventType === eventType
    );

    if (contract) {
      contractKeys.add(contract.eventType);
      eventContracts.push(summarizeEventContract(contract));
    }
  }

  const handoffKeys = new Set<string>();
  const handoffs: EvidencePackHandoffSummary[] = [];

  for (const manifest of moduleManifests) {
    if (!expandedModuleIds.has(manifest.id)) {
      continue;
    }

    const moduleHandoffs = handoffsForModule(manifest.id);

    for (const handoff of moduleHandoffs) {
      if (handoffKeys.has(handoff.id)) {
        continue;
      }

      if (
        !expandedModuleIds.has(handoff.fromModuleId) &&
        !expandedModuleIds.has(handoff.toModuleId)
      ) {
        continue;
      }

      handoffKeys.add(handoff.id);
      handoffs.push(summarizeHandoff(handoff));
    }
  }

  // Ensure every module's published or consumed cross-module handoff that
  // crosses the scope is included even if `handoffsForModule` missed an edge.
  for (const handoff of crossModuleHandoffMap) {
    if (handoffKeys.has(handoff.id)) {
      continue;
    }

    if (
      expandedModuleIds.has(handoff.fromModuleId) &&
      expandedModuleIds.has(handoff.toModuleId)
    ) {
      handoffKeys.add(handoff.id);
      handoffs.push(summarizeHandoff(handoff));
    }
  }

  const humanAuthorityMapping = buildHumanAuthorityMapping(expandedModuleIds);
  const auditAnchors = buildAuditAnchors(input);

  const recommendedReviewRoutes = unique([
    ...modules.map((module) => module.route),
    ...RECOMMENDED_REVIEW_ROUTES,
  ]);

  const summary: EvidencePackSummary = {
    moduleCount: modules.length,
    eventContractCount: eventContracts.length,
    handoffCount: handoffs.length,
    humanAuthorityCount: humanAuthorityMapping.length,
    auditAnchorCount: auditAnchors.length,
    productionBlockedModuleCount: modules.filter(
      (module) => module.productionBlocked
    ).length,
    replayRequiredModuleCount: modules.filter(
      (module) => module.replayRequired
    ).length,
    publicSurfaceModuleCount: modules.filter(
      (module) => module.publicSurfaceAllowed
    ).length,
  };

  return {
    runtimeVersion: GOVERNANCE_EVIDENCE_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    packIntent: input.packIntent,
    applicationId: input.applicationId ?? null,
    borrowerIdMasked: input.borrowerIdMasked ?? null,
    reviewerRole: input.reviewerRole ?? null,
    summary,
    modules,
    eventContracts,
    handoffs,
    humanAuthorityMapping,
    auditAnchors,
    disclosures: unique([...GOVERNANCE_EVIDENCE_DISCLOSURES]),
    productionRestrictions: unique([
      ...GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    recommendedReviewRoutes,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    evidenceOnly: true,
    noOfficialCertification: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
  };
}
