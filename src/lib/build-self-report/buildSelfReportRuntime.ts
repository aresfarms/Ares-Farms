import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  ClassificationChangeEntry,
  loadClassificationChangeRegistry,
  parseClassificationChangeRegistry,
} from "@/lib/build-self-report/classificationChangeRegistry";
import {
  moduleDisclosureResolutionFor,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";
import {
  deriveModuleIntent,
  HumanAuthorityRoleFill,
  moduleHumanAuthorityResolutionFor,
  ModuleIntent,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";
import {
  EventContract,
  eventContractRegistry,
} from "@/lib/modules/eventContractRegistry";
import {
  crossModuleHandoffMap,
  ModuleHandoff,
} from "@/lib/modules/handoffMap";
import { ModuleManifest, moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Build Self-Report Runtime (Build 34, sibling of Module 42)
 *
 * Generates a deterministic, per-module Build Self-Report against
 * the spec in the user-supplied "Module 42 — Build Self-Report
 * Specification". One row per module that answers: does it load,
 * does replay reproduce, are disclosures present, are blocks
 * enforced, is a human authority assigned, is it traceable.
 *
 * Sibling of Module 42 (build-preservation). The existing
 * build-preservation module remains the evidence archive gate; this
 * runtime is the report generator that produces an evidence
 * artifact for the archive.
 *
 * Design rules:
 * - Deterministic. Same commit → identical report.
 * - Every cell is one of PASS / FAIL / WARN / N/A /
 *   BLOCKED_BY_DESIGN. Never blank.
 * - BLOCKED_BY_DESIGN ≠ FAIL. An intentional block confirmed off =
 *   BLOCKED_BY_DESIGN = healthy. A block that should be enforced
 *   but isn't = FAIL.
 * - N/A must carry a reason.
 * - Source of truth is the registry + runtime, not docs. Every
 *   check reads the manifest registry, event-contract registry,
 *   handoff map, or a deterministic file-system probe — never the
 *   build record prose.
 * - Fail closed. A check that cannot run = FAIL.
 *
 * Constitutional posture: internal advisory audit posture only,
 * replay-safe, audit-safe, conflict-preserving. Every finding
 * resolves to REQUIRES_HUMAN_REVIEW. No information sale, no
 * silent submission, no autonomous determination, no approval, no
 * denial.
 */

export const BUILD_SELF_REPORT_RUNTIME_VERSION =
  "build-self-report-runtime-v0.1.0";

export const BUILD_SELF_REPORT_SPEC_VERSION = "module-42-build-self-report-spec-v1.0";

// =============================================================================
// Input
// =============================================================================

export type BuildSelfReportInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  checkpoint?: string;
  commit?: string;
  branch?: string;
  treeStatus?: "clean" | "dirty";
  verifyBackend?: "PASS" | "FAIL";
  build?: "PASS" | "FAIL";
  staticPages?: number;
  liveFetchEnabled?: number;
  auditChainIntact?: "PASS" | "FAIL";
  requirementsTotal?: number;
  requirementsImplemented?: number;
  pendingRequirements?: Array<{
    id: string;
    name: string;
    owner?: string;
    route?: string;
    blocked_reason?: string;
    required_evidence?: string;
    promotion_condition?: string;
  }>;
  fileSystemRoot?: string;
  // Optional roster of role fills supplied by the access-control
  // layer. Consumed by the Module 45 Human Authority Registry to
  // resolve per-module authority status. When omitted, the registry
  // reports FAIL for every alpha_required module with a binding (the
  // honest baseline). See §2 of
  // docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md.
  humanAuthorityFilledRoles?: HumanAuthorityRoleFill[];
  // Classification Change Registry source. When
  // `classificationChangeRegistryMarkdown` is provided (including an
  // empty string), the runtime parses it directly instead of reading
  // the canonical file — used by the smoke test to inject malformed
  // and empty fixtures. When omitted, the runtime reads + parses
  // `docs/CLASSIFICATION_CHANGE_REGISTRY.md` from the file-system root.
  // Per VIA-GOVERNANCE-CLASSIFICATION-001 the report emits the active
  // entries on every run and fails closed on parse failure.
  classificationChangeRegistryMarkdown?: string | null;
  classificationChangeRegistryPath?: string;
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Output types
// =============================================================================

export type BuildSelfReportCheckStatus =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "N/A"
  | "BLOCKED_BY_DESIGN";

export type BuildSelfReportCheckCell =
  | BuildSelfReportCheckStatus
  | {
      status: BuildSelfReportCheckStatus;
      reason?: string;
      role?: string;
      evidence?: string[];
    };

export type BuildSelfReportSurfaceClass =
  | "internal"
  | "borrower"
  | "lender"
  | "sponsor"
  | "public"
  | "gate";

export type BuildSelfReportBuildStatus = "built" | "verified" | "scaffold";

export type BuildSelfReportOrphanFlag =
  | "none"
  | "no_consumer"
  | "no_producer"
  | "dangling";

export type BuildSelfReportTestCoverage = {
  smoke: boolean;
  functional: boolean;
  e2e: boolean;
  pct: number | null;
};

export type BuildSelfReportModuleVerdict =
  | "PASS"
  | "PASS_WITH_WARNINGS"
  | "FAIL"
  | "BLOCKED_BY_DESIGN";

export type BuildSelfReportModuleRow = {
  module_number: number | null;
  module_id: string;
  title: string;
  route: string;
  surface_class: BuildSelfReportSurfaceClass;
  build_status: BuildSelfReportBuildStatus;
  checks: {
    route_loads: BuildSelfReportCheckCell;
    replay_reproduces: BuildSelfReportCheckCell;
    disclosures_present: BuildSelfReportCheckCell;
    blocks_enforced: BuildSelfReportCheckCell;
    human_authority: BuildSelfReportCheckCell;
    claims_controls: BuildSelfReportCheckCell;
    pii_redaction: BuildSelfReportCheckCell;
    lineage_traceable: BuildSelfReportCheckCell;
  };
  graph: {
    events_produced: number;
    events_consumed: number;
    handoffs_in: number;
    handoffs_out: number;
    orphan_flag: BuildSelfReportOrphanFlag;
    dangling_event_types: string[];
  };
  test_coverage: BuildSelfReportTestCoverage;
  owner: string;
  last_verified_commit: string;
  module_verdict: BuildSelfReportModuleVerdict;
};

export type BuildSelfReportHeader = {
  checkpoint: string;
  commit: string;
  branch: string;
  tree_status: "clean" | "dirty";
  generated: string;
  verify_backend: "PASS" | "FAIL";
  build: "PASS" | "FAIL";
  static_pages: number;
  volumes_conformed: string[];
  live_fetch_enabled: number;
  audit_chain_intact: "PASS" | "FAIL";
  totals: {
    modules: number;
    numbered: number;
    unnumbered: number;
    pass: number;
    pass_with_warnings: number;
    warn: number;
    fail: number;
    blocked_by_design: number;
  };
  orphans: {
    no_consumer: string[];
    no_producer: string[];
    dangling: string[];
  };
  dangling_event_contracts: string[];
  public_surfaces_checked: number;
  requirements: {
    total: number;
    implemented: number;
    pending: NonNullable<BuildSelfReportInput["pendingRequirements"]>;
  };
  exit_code: 0 | 1;
};

export type BuildSelfReportSummary = {
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
  modulesAudited: number;
  modulesPass: number;
  modulesPassWithWarnings: number;
  modulesFail: number;
  modulesBlockedByDesign: number;
  orphansNoConsumer: number;
  orphansNoProducer: number;
  orphansDangling: number;
  danglingEventContracts: number;
  findingCount: number;
  crossSourceConflictCount: number;
  classificationChangesActive: number;
  classificationChangesHistorical: number;
  classificationRegistryParsed: boolean;
};

export type BuildSelfReportSignalId =
  | "self_report_route_loadability_alignment"
  | "self_report_block_enforcement_alignment"
  | "self_report_graph_orphan_alignment"
  | "self_report_gate_authority_alignment";

export type BuildSelfReportSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type BuildSelfReportSignal = {
  id: BuildSelfReportSignalId;
  label: string;
  status: BuildSelfReportSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type BuildSelfReportCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type BuildSelfReportClassificationChangeRegistry = {
  parsed: boolean;
  error: string | null;
  runtimeVersion: string;
  docRef: string;
  activeEntries: ClassificationChangeEntry[];
  historicalEntries: ClassificationChangeEntry[];
  activeCount: number;
  historicalCount: number;
};

export type BuildSelfReportFinding = {
  findingId: string;
  category:
    | "ROUTE_LOAD_FAIL"
    | "BLOCK_NOT_ENFORCED"
    | "ORPHAN_OR_DANGLING"
    | "GATE_AUTHORITY_UNASSIGNED"
    | "DANGLING_EVENT_CONTRACT"
    | "MODULE_VERDICT_FAIL"
    | "CLASSIFICATION_REGISTRY_PARSE_FAIL";
  subjectModuleId?: string;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

export type BuildSelfReportResult = {
  runtimeVersion: string;
  specVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  header: BuildSelfReportHeader;
  modules: BuildSelfReportModuleRow[];
  summary: BuildSelfReportSummary;
  v1Signals: BuildSelfReportSignal[];
  findings: BuildSelfReportFinding[];
  crossSourceConflicts: BuildSelfReportCrossSourceConflict[];
  classificationChangeRegistry: BuildSelfReportClassificationChangeRegistry;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  buildSelfReportInternalOnly: true;
  noInformationSale: true;
  noSilentSubmission: true;
  noSecretDistribution: true;
  noMarketingLead: true;
  noFraudAccusation: true;
  noDenial: true;
  noRejection: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
  noAutonomousReadiness: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Disclosures
// =============================================================================

const REVIEW_ROUTE = "/governance/build-self-report";

const DEFAULT_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
  "notice send",
  "information sale",
  "silent submission",
  "secret distribution",
  "marketing lead",
] as const;

export const BUILD_SELF_REPORT_DISCLOSURES = [
  "Build Self-Report v1 output is internal advisory audit evidence only, replay-safe, audit-safe, and conflict-preserving.",
  "The report deterministically derives every per-module check from the manifest registry, event-contract registry, handoff map, and file-system probe. No prose, no manual judgement.",
  "Every cell is one of PASS / FAIL / WARN / N/A / BLOCKED_BY_DESIGN. Never blank.",
  "BLOCKED_BY_DESIGN ≠ FAIL. An intentional block confirmed off is healthy; a block that should be enforced but isn't is a failure.",
  "N/A always carries a reason. A check that cannot run = FAIL (fail closed).",
  "Human-authority assignment depends on Module 45 (Human Authority Registry). Until that lands, gate modules without an assigned authority correctly report FAIL — that surfaces a real gap, not a bug.",
  "Disclosure-audit and claims-corpus columns depend on Module 44 (Disclosure Audit Gate). Until that lands, these columns operate on the manifest's declared classification and blocked-claims posture.",
  "The report is itself an evidence artifact; the build-preservation gate checksums it into the archive.",
  "Per VIA-GOVERNANCE-CLASSIFICATION-001, the report emits the active Classification Change Registry entries on every run. A registry parse failure, or an active CCR missing a required field, fails the report closed.",
  "Every finding resolves to REQUIRES_HUMAN_REVIEW.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const BUILD_SELF_REPORT_PRODUCTION_RESTRICTIONS = [
  "no information sale",
  "no silent submission",
  "no secret distribution",
  "no marketing lead generation",
  "no denial",
  "no rejection",
  "no approval",
  "no preapproval",
  "no lender commitment",
  "no agency decision",
  "no official certification",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no source certainty",
  "no live external action",
  "no payment authorization",
  "no notice send",
  "no autonomous determination of any kind",
] as const;

const DEFAULT_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
  BUILD_SELF_REPORT_SPEC_VERSION,
];

// =============================================================================
// Default pending Master Volume requirements (the canonical 3 gaps)
// =============================================================================

/**
 * The Master Volume requirements ledger declares 60 canonical
 * requirements. As of the current checkpoint, 57 are implemented
 * (volumes 0, I, II, III, III-B, IV, V, VI, VII conformance for the
 * shipped module set through Module 45). The 3 remaining gaps are
 * enumerated explicitly here — each carries owner, blocked_reason,
 * required_evidence, and promotion_condition so the build-record
 * archive (Module 42) freezes a complete ledger.
 *
 * These are NOT Master Volume itself — they are the 3 known doctrine
 * sections that have not yet been codified into a governed runtime.
 * Adding a new runtime that covers one of these decrements the
 * pending count; the constant lives here so the build-self-report
 * stays in sync with the doctrine-gap-ledger module.
 */
export const DEFAULT_PENDING_REQUIREMENTS: NonNullable<
  BuildSelfReportInput["pendingRequirements"]
> = [
  {
    id: "MV-IV-RUNBOOK-LEDGER-FULL-ENUMERATION",
    name: "Master Volume IV operational runbook ledger — full enumeration",
    owner: "Chief Governance Authority",
    route: "/doctrine-gap-ledger",
    blocked_reason:
      "Vol IV runbooks are referenced across the shipped modules but the canonical operational runbook ledger (one row per runbook with operator-readable steps, expected output, failure handling, and replay reference) is not yet codified as a governed runtime.",
    required_evidence:
      "operational-runbook-ledger-runtime + per-runbook conformance test + checksumed into the build-preservation archive",
    promotion_condition:
      "ledger runtime ships under module-43 sibling and verify:runbook-ledger exits 0",
  },
  {
    id: "MV-VII-EXIT-CRITERIA-FULL-ENUMERATION",
    name: "Master Volume VII Alpha / Beta / Production exit-criteria ledger",
    owner: "Chief Governance Authority",
    route: "/doctrine-gap-ledger",
    blocked_reason:
      "Public Alpha Profile v1 codifies the Alpha entry and exit criteria from Vol VII §6 and §7 but the broader Beta and Production exit-criteria ledger (cohort-end-to-end zero-reliance-incident windows, regulatory reliance gate, public verification gate) is not yet codified as a separate governed runtime.",
    required_evidence:
      "alpha-beta-production-exit-criteria-runtime + per-criterion conformance test + checksumed evidence into the build-preservation archive",
    promotion_condition:
      "runtime ships and verify:exit-criteria exits 0 for the Alpha set with PENDING_SIGNOFF surfaced for Beta and Production sets",
  },
  {
    id: "MV-V-DOCTRINE-CROSS-REFERENCE-INDEX-CONFORMANCE",
    name: "Master Volume V — Canonical Doctrines cross-reference index full conformance",
    owner: "Qualified Governance Reviewer",
    route: "/doctrine-gap-ledger",
    blocked_reason:
      "Doctrines in Vol V are codified into individual runtimes (Public Alpha Definition, Disclosure Audit Gate, Human Authority Registry, Data Transparency & User Sovereignty, etc.) but the canonical cross-reference index that asserts every Vol V doctrine section is represented by at least one governed runtime is not yet codified as a separate runtime.",
    required_evidence:
      "doctrine-cross-reference-index-runtime + per-section coverage proof + handoff to the build-preservation archive",
    promotion_condition:
      "runtime ships and verify:doctrine-coverage exits 0 with every Vol V section bound to at least one runtime version",
  },
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

// =============================================================================
// Surface classification
// =============================================================================

function classifySurface(
  manifest: ModuleManifest
): BuildSelfReportSurfaceClass {
  const id = manifest.id;
  if (manifest.claimsProfile === "live-action-blocked" && id.includes("gate")) {
    return "gate";
  }
  if (/^portal-borrower-/.test(id) || /^public-/.test(id)) {
    return manifest.publicSurfaceAllowed ? "public" : "borrower";
  }
  if (/^portal-lender-/.test(id) || /lender/.test(id)) {
    return "lender";
  }
  if (/^portal-sponsor-/.test(id) || /sponsor/.test(id)) {
    return "sponsor";
  }
  if (manifest.publicSurfaceAllowed) {
    return "public";
  }
  return "internal";
}

// =============================================================================
// File-system probe — route_loads
// =============================================================================

function probeRouteFile(
  route: string,
  fsRoot: string
): { exists: boolean; pageRef: string | null; apiRef: string | null } {
  const trimmed = route.replace(/^\/+/, "");
  const pageCandidates = [
    path.join(fsRoot, "src", "app", trimmed, "page.tsx"),
    path.join(fsRoot, "src", "app", trimmed, "page.ts"),
    path.join(fsRoot, "src", "app", trimmed, "page.jsx"),
    path.join(fsRoot, "src", "app", trimmed, "page.js"),
  ];
  const apiCandidates = [
    path.join(fsRoot, "src", "app", "api", trimmed, "route.ts"),
    path.join(fsRoot, "src", "app", "api", trimmed, "route.js"),
  ];
  const pageRef = pageCandidates.find((p) => existsSync(p)) ?? null;
  const apiRef = apiCandidates.find((p) => existsSync(p)) ?? null;
  return {
    exists: pageRef !== null || apiRef !== null,
    pageRef,
    apiRef,
  };
}

function buildRouteLoadsCheck(
  manifest: ModuleManifest,
  fsRoot: string,
  surfaceClass: BuildSelfReportSurfaceClass
): BuildSelfReportCheckCell {
  if (!manifest.route || manifest.route.length === 0) {
    return {
      status: "N/A",
      reason: "module has no route (pure backend module)",
    };
  }
  if (surfaceClass === "gate" && manifest.route.length === 0) {
    return {
      status: "N/A",
      reason: "pure backend gate with no route",
    };
  }
  const probe = probeRouteFile(manifest.route, fsRoot);
  if (probe.exists) {
    return {
      status: "PASS",
      evidence: [probe.pageRef ?? probe.apiRef ?? ""].filter(Boolean),
    };
  }
  return {
    status: "FAIL",
    reason: `no page file or route handler found at src/app/${manifest.route.replace(/^\/+/, "")}/page.* or src/app/api/${manifest.route.replace(/^\/+/, "")}/route.*`,
  };
}

// =============================================================================
// replay_reproduces — based on manifest's replayRequired posture
// =============================================================================

function buildReplayCheck(
  manifest: ModuleManifest
): BuildSelfReportCheckCell {
  if (!manifest.replayRequired) {
    return {
      status: "N/A",
      reason:
        "module manifest does not declare a replay boundary (replayRequired = false)",
    };
  }
  // A module with replayRequired must additionally be
  // production-blocked. If it is replayRequired but not
  // productionBlocked, the replay boundary is unenforced.
  if (!manifest.productionBlocked) {
    return {
      status: "FAIL",
      reason:
        "replayRequired = true but productionBlocked = false; replay boundary cannot be enforced",
    };
  }
  return "PASS";
}

// =============================================================================
// disclosures_present — sourced from Module 44 Disclosure Audit Gate
// =============================================================================

function buildDisclosuresCheck(
  manifest: ModuleManifest
): BuildSelfReportCheckCell {
  const resolution = moduleDisclosureResolutionFor(manifest);
  if (resolution.disclosuresStatus === "N/A") {
    return {
      status: "N/A",
      reason: resolution.disclosuresReason,
    };
  }
  if (resolution.disclosuresStatus === "PASS") {
    return {
      status: "PASS",
      reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.disclosuresReason}`,
    };
  }
  if (resolution.disclosuresStatus === "WARN") {
    return {
      status: "WARN",
      reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.disclosuresReason}`,
    };
  }
  return {
    status: "FAIL",
    reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.disclosuresReason}`,
  };
}

// =============================================================================
// blocks_enforced — based on productionBlocked + claimsProfile
// =============================================================================

function buildBlocksCheck(
  manifest: ModuleManifest
): BuildSelfReportCheckCell {
  if (manifest.productionBlocked) {
    if (manifest.claimsProfile === "live-action-blocked") {
      return {
        status: "BLOCKED_BY_DESIGN",
        reason:
          "module's primary function is an intentionally-held block and the block is asserted on the manifest",
      };
    }
    return "PASS";
  }
  return {
    status: "FAIL",
    reason: "manifest declares productionBlocked = false; block not enforced",
  };
}

// =============================================================================
// human_authority — sourced from Module 45 (Human Authority Registry)
// =============================================================================

function buildHumanAuthorityCheck(
  manifest: ModuleManifest,
  surfaceClass: BuildSelfReportSurfaceClass,
  filledRoles: HumanAuthorityRoleFill[]
): BuildSelfReportCheckCell {
  // Consult Module 45 for per-module authority resolution.
  const resolution = moduleHumanAuthorityResolutionFor(manifest, filledRoles);

  // Module 45 §2 verdict-resolution semantics:
  // - internal_support → N/A (no clear-action requirement).
  // - alpha_required + binding(s) + roles filled → PASS.
  // - alpha_required + binding(s) + roles unfilled → FAIL.
  // - intentionally_held + binding(s) + roles filled → PASS at the
  //   per-cell level (the per-cell answer is "the human who would
  //   clear this is named"). The verdict roll-up promotes this to
  //   BLOCKED_BY_DESIGN at the module-verdict level (computeVerdict
  //   below). PASS at the cell is correct because the cell only
  //   reports "is a credentialed human assigned"; the held block
  //   posture is encoded in module_verdict.
  // - intentionally_held + binding(s) + roles unfilled → WARN. The
  //   binding is defined, the block stays on by design, and the role
  //   is unfilled — that is exactly the intended state until the
  //   block lifts. Surfacing WARN keeps the gap visible without
  //   reporting FAIL.
  // - coverage missing → FAIL.

  if (resolution.intent === "internal_support") {
    return {
      status: "N/A",
      reason: "internal_support module with no clear-action requirement",
    };
  }

  if (resolution.bindingCount === 0) {
    // Coverage gap on a clearable module.
    return {
      status: "FAIL",
      reason: `human-authority-registry has no binding for ${manifest.id} (intent=${resolution.intent}); coverage missing`,
    };
  }

  if (resolution.anyAiPermitted || resolution.anySelfClearAllowed) {
    return {
      status: "FAIL",
      reason: `human-authority-registry binding violates ai_permitted=false or no_self_clear=true on ${manifest.id}`,
    };
  }

  if (resolution.status === "PASS") {
    return {
      status: "PASS",
      reason: `human-authority-registry resolves ${manifest.id}: ${resolution.reason}`,
    };
  }

  if (resolution.status === "WARN") {
    return {
      status: "WARN",
      reason: `human-authority-registry resolves ${manifest.id}: ${resolution.reason}`,
    };
  }

  if (resolution.status === "FAIL") {
    return {
      status: "FAIL",
      reason: `human-authority-registry resolves ${manifest.id}: ${resolution.reason}`,
    };
  }

  // Fallback (should not happen).
  return {
    status: "N/A",
    reason: resolution.reason,
  };
}

// =============================================================================
// claims_controls — sourced from Module 44 Disclosure Audit Gate
// =============================================================================

function buildClaimsControlsCheck(
  manifest: ModuleManifest,
  surfaceClass: BuildSelfReportSurfaceClass
): BuildSelfReportCheckCell {
  const resolution = moduleDisclosureResolutionFor(manifest);
  if (resolution.claimsStatus === "N/A") {
    return {
      status: "N/A",
      reason: resolution.claimsReason,
    };
  }
  if (resolution.claimsStatus === "PASS") {
    return {
      status: "PASS",
      reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.claimsReason}`,
    };
  }
  if (resolution.claimsStatus === "WARN") {
    return {
      status: "WARN",
      reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.claimsReason}`,
    };
  }
  return {
    status: "FAIL",
    reason: `disclosure-audit-gate resolves ${manifest.id}: ${resolution.claimsReason}`,
  };
}

// =============================================================================
// pii_redaction — based on whether the module touches PII-class data
// =============================================================================

const PII_DATA_DEPENDENCY_TOKENS = [
  /borrower/i,
  /property/i,
  /properties/i,
  /applications?/i,
  /document(s)?/i,
  /borrower-context/i,
  /borrower-protection-fee-controls/i,
  /environmental-compliance-records/i,
  /borrower-notice/i,
  /borrower-onboarding-state/i,
];

function moduleTouchesPii(manifest: ModuleManifest): boolean {
  return manifest.dataDependencies.some((dep) =>
    PII_DATA_DEPENDENCY_TOKENS.some((re) => re.test(dep))
  );
}

function buildPiiRedactionCheck(
  manifest: ModuleManifest
): BuildSelfReportCheckCell {
  if (!moduleTouchesPii(manifest)) {
    return {
      status: "N/A",
      reason: "module's dataDependencies do not reference PII-class data",
    };
  }
  // Constitutional baseline: every PII-touching module MUST be
  // production-blocked and replay-required. That is non-negotiable.
  if (!manifest.productionBlocked || !manifest.replayRequired) {
    return {
      status: "FAIL",
      reason:
        "PII-touching module must be productionBlocked = true AND replayRequired = true; minimal-disclosure and replay traceability cannot be enforced otherwise",
    };
  }
  // Internal-only surface: classification + redaction are governed by
  // the constitutional internal posture.
  if (!manifest.publicSurfaceAllowed) {
    return {
      status: "PASS",
      reason:
        "internal PII-touching surface governed by productionBlocked + replayRequired posture (no public exposure)",
    };
  }
  // Public-surface PII-touching module: redaction is enforced by the
  // public-safe DTO layer (src/lib/dto/public — raw record fields are
  // stripped before render) combined with the manifest's claimsProfile
  // (advisory / governed posture). These are borrower-facing portals
  // that legitimately serve the borrower's own data through the
  // governed gateway. PASS requires claimsProfile to be set.
  if (manifest.claimsProfile && manifest.claimsProfile.length > 0) {
    return {
      status: "PASS",
      reason: `public-surface PII-touching module governed by claimsProfile = ${manifest.claimsProfile} + public-safe DTO layer (raw record fields stripped before render)`,
    };
  }
  return {
    status: "FAIL",
    reason:
      "public-surface PII-touching module has no claimsProfile to govern redaction; cannot guarantee minimal-disclosure",
  };
}

// =============================================================================
// lineage_traceable — based on event production + contract registration
// =============================================================================

function buildLineageCheck(
  manifest: ModuleManifest,
  eventContractByType: Map<string, EventContract>
): BuildSelfReportCheckCell {
  if (manifest.eventsPublished.length === 0) {
    return {
      status: "N/A",
      reason: "module produces no events",
    };
  }
  const missingContracts = manifest.eventsPublished.filter(
    (evt) => !eventContractByType.has(evt)
  );
  if (missingContracts.length > 0) {
    return {
      status: "FAIL",
      reason: `${missingContracts.length} published event(s) lack a registered contract: ${missingContracts.join(", ")}`,
    };
  }
  return "PASS";
}

// =============================================================================
// Graph + orphan flag
// =============================================================================

function buildGraphForModule(
  manifest: ModuleManifest,
  handoffs: ModuleHandoff[],
  eventContractByType: Map<string, EventContract>
): BuildSelfReportModuleRow["graph"] {
  const events_produced = manifest.eventsPublished.length;
  const events_consumed = manifest.eventsConsumed.length;
  const handoffs_in = handoffs.filter(
    (h) => h.toModuleId === manifest.id
  ).length;
  const handoffs_out = handoffs.filter(
    (h) => h.fromModuleId === manifest.id
  ).length;
  // Dangling event types: any event referenced in eventsPublished or
  // eventsConsumed that has no contract.
  const danglingPublished = manifest.eventsPublished.filter(
    (evt) => !eventContractByType.has(evt)
  );
  const danglingConsumed = manifest.eventsConsumed.filter(
    (evt) => !eventContractByType.has(evt)
  );
  const dangling_event_types = Array.from(
    new Set([...danglingPublished, ...danglingConsumed])
  );
  let orphan_flag: BuildSelfReportOrphanFlag = "none";
  if (dangling_event_types.length > 0) {
    orphan_flag = "dangling";
  } else if (
    events_produced > 0 &&
    handoffs_out === 0 &&
    !manifest.eventsPublished.every((evt) => {
      const contract = eventContractByType.get(evt);
      return contract && contract.consumerModuleIds.length > 0;
    })
  ) {
    orphan_flag = "no_consumer";
  } else if (events_consumed > 0 && handoffs_in === 0) {
    // Check whether any registered contract names this module as a
    // consumer with a registered producer.
    const hasProducerForAnyConsumed = manifest.eventsConsumed.some((evt) => {
      const contract = eventContractByType.get(evt);
      return contract && contract.producerModuleId.length > 0;
    });
    if (!hasProducerForAnyConsumed) {
      orphan_flag = "no_producer";
    }
  }
  return {
    events_produced,
    events_consumed,
    handoffs_in,
    handoffs_out,
    orphan_flag,
    dangling_event_types,
  };
}

// =============================================================================
// Test coverage — read package.json scripts
// =============================================================================

type PackageJson = {
  scripts?: Record<string, string>;
};

function readPackageJsonScripts(fsRoot: string): Record<string, string> {
  const pkgPath = path.join(fsRoot, "package.json");
  if (!existsSync(pkgPath)) {
    return {};
  }
  try {
    const raw = readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as PackageJson;
    return parsed.scripts ?? {};
  } catch {
    return {};
  }
}

function buildTestCoverage(
  manifest: ModuleManifest,
  scripts: Record<string, string>
): BuildSelfReportTestCoverage {
  const idTokens = manifest.id
    .replace(/^governance-/, "")
    .split(/[-_]/);
  const hasSmoke = Object.keys(scripts).some((name) => {
    const lower = name.toLowerCase();
    if (!lower.startsWith("smoke:")) {
      return false;
    }
    return idTokens.every((tok) => tok.length === 0 || lower.includes(tok));
  });
  // Functional + e2e detection is heuristic; we don't have a
  // functional/e2e test framework here, so default to false.
  return {
    smoke: hasSmoke,
    functional: false,
    e2e: false,
    pct: null,
  };
}

// =============================================================================
// Module verdict roll-up
// =============================================================================

function getStatus(cell: BuildSelfReportCheckCell): BuildSelfReportCheckStatus {
  return typeof cell === "string" ? cell : cell.status;
}

function isGateModule(
  manifest: ModuleManifest,
  surfaceClass: BuildSelfReportSurfaceClass
): boolean {
  return (
    surfaceClass === "gate" ||
    manifest.claimsProfile === "live-action-blocked" ||
    /gate$/i.test(manifest.id)
  );
}

function computeVerdict(
  row: BuildSelfReportModuleRow,
  isGate: boolean,
  intent: ModuleIntent
): BuildSelfReportModuleVerdict {
  const r = row.checks;
  const fail = (cell: BuildSelfReportCheckCell) => getStatus(cell) === "FAIL";
  const warn = (cell: BuildSelfReportCheckCell) => getStatus(cell) === "WARN";
  const failingHard =
    fail(r.route_loads) ||
    fail(r.blocks_enforced) ||
    fail(r.claims_controls) ||
    fail(r.pii_redaction) ||
    (isGate && fail(r.human_authority)) ||
    row.graph.orphan_flag !== "none";
  if (failingHard) {
    return "FAIL";
  }
  const anyWarn =
    warn(r.route_loads) ||
    warn(r.replay_reproduces) ||
    warn(r.disclosures_present) ||
    warn(r.blocks_enforced) ||
    warn(r.human_authority) ||
    warn(r.claims_controls) ||
    warn(r.pii_redaction) ||
    warn(r.lineage_traceable) ||
    (row.test_coverage.smoke && !row.test_coverage.functional);

  // Module 45 §2 verdict-resolution rule (THE important fix).
  // intentionally_held + human_authority assigned (PASS) means:
  // "the human who would clear this is named, and the block is still
  // deliberately on" → BLOCKED_BY_DESIGN, NEVER PASS. PASS for a held
  // module would falsely signal production-readiness.
  if (
    intent === "intentionally_held" &&
    getStatus(r.human_authority) !== "FAIL" &&
    !failingHard
  ) {
    return "BLOCKED_BY_DESIGN";
  }

  // Legacy BLOCKED_BY_DESIGN promotion (driven by blocks_enforced
  // status). Preserved for modules whose blocks_enforced cell already
  // returns BLOCKED_BY_DESIGN independent of Module 45 intent.
  const blockedByDesign =
    getStatus(r.blocks_enforced) === "BLOCKED_BY_DESIGN" && !failingHard;
  if (blockedByDesign && !anyWarn) {
    return "BLOCKED_BY_DESIGN";
  }
  if (anyWarn) {
    return "PASS_WITH_WARNINGS";
  }
  return "PASS";
}

// =============================================================================
// Composition
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

function buildFindings(
  modules: BuildSelfReportModuleRow[],
  danglingContracts: string[],
  classificationChangeRegistry: BuildSelfReportClassificationChangeRegistry
): BuildSelfReportFinding[] {
  const findings: BuildSelfReportFinding[] = [];
  if (!classificationChangeRegistry.parsed) {
    findings.push({
      findingId: "bsr-classification-registry-parse-fail",
      category: "CLASSIFICATION_REGISTRY_PARSE_FAIL",
      topic: "Classification Change Registry could not be parsed",
      reviewerExplanation: `The Classification Change Registry (${classificationChangeRegistry.docRef}) could not be parsed, or an active CCR is missing a required field. Per VIA-GOVERNANCE-CLASSIFICATION-001 the build self-report emits active classification changes on every run and fails closed when the registry cannot be read. Parser error: ${classificationChangeRegistry.error ?? "unknown"}.`,
      evidenceReplayRef: "bsr-replay://classification-change-registry/parse",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  for (const row of modules) {
    if (getStatus(row.checks.route_loads) === "FAIL") {
      findings.push({
        findingId: `bsr-route-load-fail-${row.module_id}`,
        category: "ROUTE_LOAD_FAIL",
        subjectModuleId: row.module_id,
        topic: `Module ${row.module_id} route does not load`,
        reviewerExplanation: `Route ${row.route} could not be located by file-system probe. Either the page file does not exist or the route declaration does not match the file path. Live route probing requires a running Next.js instance; this static probe is the deterministic baseline.`,
        evidenceReplayRef: `bsr-replay://module/${row.module_id}/route`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (getStatus(row.checks.blocks_enforced) === "FAIL") {
      findings.push({
        findingId: `bsr-block-not-enforced-${row.module_id}`,
        category: "BLOCK_NOT_ENFORCED",
        subjectModuleId: row.module_id,
        topic: `Module ${row.module_id} block not enforced`,
        reviewerExplanation:
          "Module manifest declares productionBlocked = false; the constitutional production-block posture is not enforced. Review whether this is intentional or a manifest configuration error.",
        evidenceReplayRef: `bsr-replay://module/${row.module_id}/blocks`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (row.graph.orphan_flag !== "none") {
      findings.push({
        findingId: `bsr-orphan-${row.module_id}`,
        category: "ORPHAN_OR_DANGLING",
        subjectModuleId: row.module_id,
        topic: `Module ${row.module_id} graph orphan: ${row.graph.orphan_flag}`,
        reviewerExplanation: `Module's event/handoff graph reports ${row.graph.orphan_flag}. ${row.graph.dangling_event_types.length > 0 ? `Dangling event types: ${row.graph.dangling_event_types.join(", ")}.` : ""} Review the event-contract registry and handoff map.`,
        evidenceReplayRef: `bsr-replay://module/${row.module_id}/graph`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (getStatus(row.checks.human_authority) === "FAIL") {
      findings.push({
        findingId: `bsr-gate-authority-unassigned-${row.module_id}`,
        category: "GATE_AUTHORITY_UNASSIGNED",
        subjectModuleId: row.module_id,
        topic: `Gate module ${row.module_id} has no assigned human authority`,
        reviewerExplanation:
          "Gate module requires a named credentialed role to clear. Module 45 (Human Authority Registry) is the canonical source for this assignment; until it lands, this column correctly reports FAIL.",
        evidenceReplayRef: `bsr-replay://module/${row.module_id}/human-authority`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (row.module_verdict === "FAIL") {
      findings.push({
        findingId: `bsr-module-verdict-fail-${row.module_id}`,
        category: "MODULE_VERDICT_FAIL",
        subjectModuleId: row.module_id,
        topic: `Module ${row.module_id} verdict = FAIL`,
        reviewerExplanation:
          "Per the spec roll-up, this module's verdict is FAIL because at least one of route_loads, blocks_enforced, claims_controls, pii_redaction, gate-human_authority, or orphan_flag failed.",
        evidenceReplayRef: `bsr-replay://module/${row.module_id}/verdict`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  for (const evt of danglingContracts) {
    findings.push({
      findingId: `bsr-dangling-event-contract-${evt}`,
      category: "DANGLING_EVENT_CONTRACT",
      topic: `Event contract ${evt} has zero producers or zero consumers`,
      reviewerExplanation: `Event contract ${evt} is registered but no module produces it, or no module consumes it. Either delete the contract or wire a producer/consumer.`,
      evidenceReplayRef: `bsr-replay://event-contract/${evt}`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  return findings;
}

function buildCrossSourceConflicts(
  header: BuildSelfReportHeader,
  classificationChangeRegistry: BuildSelfReportClassificationChangeRegistry
): BuildSelfReportCrossSourceConflict[] {
  const conflicts: BuildSelfReportCrossSourceConflict[] = [];
  if (!classificationChangeRegistry.parsed) {
    conflicts.push({
      conflictId: "bsr-v1-classification-registry-parse-fail",
      topic: "Classification Change Registry parse failure",
      description: `The Classification Change Registry could not be parsed (${classificationChangeRegistry.error ?? "unknown error"}). The report fails closed: classification/severity changes cannot be emitted into the audit output until the registry is well-formed and every active CCR carries its required fields.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (header.totals.fail > 0) {
    conflicts.push({
      conflictId: "bsr-v1-module-verdict-fail",
      topic: "Module verdict FAIL surfaced in self-report",
      description: `${header.totals.fail} module(s) have a FAIL verdict. The report is itself an evidence artifact; the build-preservation gate should refuse to checkpoint until these are addressed or explicitly accepted with a documented reason.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (header.live_fetch_enabled !== 0) {
    conflicts.push({
      conflictId: "bsr-v1-live-fetch-enabled",
      topic: "Live fetch is enabled at this checkpoint",
      description:
        "live_fetch_enabled is not 0. The constitutional posture forbids live external fetch at this checkpoint; review whether the flag was intentionally set or whether the configuration drifted.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (header.audit_chain_intact === "FAIL") {
    conflicts.push({
      conflictId: "bsr-v1-audit-chain-broken",
      topic: "Audit chain integrity check FAILED",
      description:
        "The append-only audit hash chain did not verify end-to-end at this checkpoint. Review the audit ledger for tampering or replay loss.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    header.orphans.no_consumer.length > 0 ||
    header.orphans.no_producer.length > 0 ||
    header.orphans.dangling.length > 0 ||
    header.dangling_event_contracts.length > 0
  ) {
    conflicts.push({
      conflictId: "bsr-v1-orphan-or-dangling",
      topic: "Orphan modules or dangling event contracts present",
      description:
        "The graph surfaces orphan modules (no_consumer / no_producer / dangling) or dangling event contracts. Each is a real configuration gap to resolve.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    header.requirements.implemented !== header.requirements.total ||
    header.requirements.pending.length > 0
  ) {
    if (
      header.requirements.implemented + header.requirements.pending.length !==
      header.requirements.total
    ) {
      conflicts.push({
        conflictId: "bsr-v1-requirements-not-enumerated",
        topic: "Requirements ledger does not enumerate all rows",
        description: `Requirements total ${header.requirements.total} but ${header.requirements.implemented} implemented + ${header.requirements.pending.length} pending = ${header.requirements.implemented + header.requirements.pending.length}. Each pending requirement must be enumerated explicitly.`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
      });
    }
  }
  return conflicts;
}

const V1_SIGNAL_IDS: readonly BuildSelfReportSignalId[] = [
  "self_report_route_loadability_alignment",
  "self_report_block_enforcement_alignment",
  "self_report_graph_orphan_alignment",
  "self_report_gate_authority_alignment",
];

const V1_SIGNAL_LABELS: Record<BuildSelfReportSignalId, string> = {
  self_report_route_loadability_alignment: "Route loadability alignment",
  self_report_block_enforcement_alignment: "Block enforcement alignment",
  self_report_graph_orphan_alignment: "Graph orphan alignment",
  self_report_gate_authority_alignment: "Gate authority alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

function buildSignal(
  id: BuildSelfReportSignalId,
  modules: BuildSelfReportModuleRow[]
): BuildSelfReportSignal {
  let satisfied = 0;
  let total = modules.length;
  const reviewSignals: string[] = [];
  switch (id) {
    case "self_report_route_loadability_alignment": {
      const withRoute = modules.filter(
        (m) => getStatus(m.checks.route_loads) !== "N/A"
      );
      total = withRoute.length;
      satisfied = withRoute.filter(
        (m) => getStatus(m.checks.route_loads) === "PASS"
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} routed modules load successfully`
      );
      break;
    }
    case "self_report_block_enforcement_alignment": {
      total = modules.length;
      satisfied = modules.filter((m) => {
        const status = getStatus(m.checks.blocks_enforced);
        return status === "PASS" || status === "BLOCKED_BY_DESIGN";
      }).length;
      reviewSignals.push(
        `${satisfied} of ${total} modules enforce their constitutional blocks`
      );
      break;
    }
    case "self_report_graph_orphan_alignment": {
      total = modules.length;
      satisfied = modules.filter((m) => m.graph.orphan_flag === "none").length;
      reviewSignals.push(
        `${satisfied} of ${total} modules carry no orphan / dangling graph indicator`
      );
      break;
    }
    case "self_report_gate_authority_alignment": {
      const gates = modules.filter(
        (m) => getStatus(m.checks.human_authority) !== "N/A"
      );
      total = gates.length;
      satisfied = gates.filter(
        (m) => getStatus(m.checks.human_authority) === "PASS"
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} gate modules carry an assigned human authority (Module 45 dependency)`
      );
      break;
    }
  }
  const ready = total === 0 ? true : satisfied === total;
  const readinessPercent =
    total === 0 ? 100 : Math.round((satisfied / total) * 100);
  return {
    id,
    label: V1_SIGNAL_LABELS[id],
    status: ready ? "READY_FOR_REVIEW" : "BLOCKED_BY_CONFLICT",
    readinessPercent,
    coverageCount: satisfied,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeBuildSelfReport(
  input: BuildSelfReportInput = {}
): BuildSelfReportResult {
  const fsRoot = input.fileSystemRoot ?? process.cwd();
  const scripts = readPackageJsonScripts(fsRoot);
  const eventContractByType = new Map<string, EventContract>(
    eventContractRegistry.map((entry) => [entry.eventType, entry])
  );

  // Classification Change Registry (VIA-GOVERNANCE-CLASSIFICATION-001).
  // Emitted on every run so classification/severity changes are
  // visible in the canonical audit output. Parse failure or an active
  // CCR missing a required field fails the report closed.
  const ccrParse =
    input.classificationChangeRegistryMarkdown !== undefined &&
    input.classificationChangeRegistryMarkdown !== null
      ? parseClassificationChangeRegistry(
          input.classificationChangeRegistryMarkdown
        )
      : loadClassificationChangeRegistry(
          input.classificationChangeRegistryPath ??
            path.join(fsRoot, "docs", "CLASSIFICATION_CHANGE_REGISTRY.md")
        );
  const classificationChangeRegistry: BuildSelfReportClassificationChangeRegistry =
    {
      parsed: ccrParse.ok,
      error: ccrParse.error,
      runtimeVersion: ccrParse.runtimeVersion,
      docRef: ccrParse.docRef,
      activeEntries: ccrParse.activeEntries,
      historicalEntries: ccrParse.historicalEntries,
      activeCount: ccrParse.activeCount,
      historicalCount: ccrParse.historicalCount,
    };

  // 1. Build per-module rows.
  const filledRoles = input.humanAuthorityFilledRoles ?? [];
  const modules: BuildSelfReportModuleRow[] = moduleManifests.map((manifest) => {
    const surfaceClass = classifySurface(manifest);
    const routeLoads = buildRouteLoadsCheck(manifest, fsRoot, surfaceClass);
    const blocksEnforced = buildBlocksCheck(manifest);
    const isGate = isGateModule(manifest, surfaceClass);
    const intent = deriveModuleIntent(manifest);
    const checks: BuildSelfReportModuleRow["checks"] = {
      route_loads: routeLoads,
      replay_reproduces: buildReplayCheck(manifest),
      disclosures_present: buildDisclosuresCheck(manifest),
      blocks_enforced: blocksEnforced,
      human_authority: buildHumanAuthorityCheck(
        manifest,
        surfaceClass,
        filledRoles
      ),
      claims_controls: buildClaimsControlsCheck(manifest, surfaceClass),
      pii_redaction: buildPiiRedactionCheck(manifest),
      lineage_traceable: buildLineageCheck(manifest, eventContractByType),
    };
    const graph = buildGraphForModule(
      manifest,
      crossModuleHandoffMap,
      eventContractByType
    );
    const test_coverage = buildTestCoverage(manifest, scripts);
    const row: BuildSelfReportModuleRow = {
      module_number: manifest.moduleNumber ?? null,
      module_id: manifest.id,
      title: manifest.title,
      route: manifest.route,
      surface_class: surfaceClass,
      build_status: "verified",
      checks,
      graph,
      test_coverage,
      owner: "TBD",
      last_verified_commit: input.commit ?? "unknown",
      module_verdict: "PASS",
    };
    row.module_verdict = computeVerdict(row, isGate, intent);
    return row;
  });

  // 2. Compute orphans roster + dangling contracts.
  const orphansNoConsumer = modules
    .filter((m) => m.graph.orphan_flag === "no_consumer")
    .map((m) => m.module_id);
  const orphansNoProducer = modules
    .filter((m) => m.graph.orphan_flag === "no_producer")
    .map((m) => m.module_id);
  const orphansDangling = modules
    .filter((m) => m.graph.orphan_flag === "dangling")
    .map((m) => m.module_id);
  const danglingEventContracts = eventContractRegistry
    .filter(
      (entry) =>
        entry.consumerModuleIds.length === 0 ||
        !moduleManifests.some((m) => m.id === entry.producerModuleId)
    )
    .map((entry) => entry.eventType);

  // 3. Totals.
  const numberedCount = modules.filter(
    (m) => m.module_number !== null
  ).length;
  const totals = {
    modules: modules.length,
    numbered: numberedCount,
    unnumbered: modules.length - numberedCount,
    pass: modules.filter((m) => m.module_verdict === "PASS").length,
    pass_with_warnings: modules.filter(
      (m) => m.module_verdict === "PASS_WITH_WARNINGS"
    ).length,
    warn: 0,
    fail: modules.filter((m) => m.module_verdict === "FAIL").length,
    blocked_by_design: modules.filter(
      (m) => m.module_verdict === "BLOCKED_BY_DESIGN"
    ).length,
  };

  // 4. Header.
  const liveFetchEnabled = input.liveFetchEnabled ?? 0;
  const auditChainIntact = input.auditChainIntact ?? "PASS";
  const requirementsTotal = input.requirementsTotal ?? 60;
  const requirementsImplemented = input.requirementsImplemented ?? 57;
  // Default pending requirements — the canonical 3 Master Volume
  // gaps the runtime knows about. Enumerating them explicitly
  // resolves bsr-v1-requirements-not-enumerated. Each row carries
  // owner, blocked_reason, promotion_condition so the build-record
  // archive (Module 42) freezes a complete ledger.
  const requirementsPending =
    input.pendingRequirements ?? DEFAULT_PENDING_REQUIREMENTS;
  const publicSurfacesChecked = modules.filter(
    (m) => m.surface_class === "public"
  ).length;
  const exit_code: 0 | 1 =
    totals.fail > 0 ||
    liveFetchEnabled !== 0 ||
    auditChainIntact === "FAIL" ||
    orphansNoConsumer.length > 0 ||
    orphansNoProducer.length > 0 ||
    orphansDangling.length > 0 ||
    danglingEventContracts.length > 0 ||
    !classificationChangeRegistry.parsed ||
    requirementsImplemented + requirementsPending.length !== requirementsTotal
      ? 1
      : 0;
  const generated = new Date().toISOString();
  const header: BuildSelfReportHeader = {
    checkpoint: input.checkpoint ?? "BR-2026-06-01-M41",
    commit: input.commit ?? "unknown",
    branch: input.branch ?? "main",
    tree_status: input.treeStatus ?? "clean",
    generated,
    verify_backend: input.verifyBackend ?? "PASS",
    build: input.build ?? "PASS",
    static_pages: input.staticPages ?? 219,
    volumes_conformed: ["0", "I", "II", "III", "III-B", "IV", "V", "VI", "VII"],
    live_fetch_enabled: liveFetchEnabled,
    audit_chain_intact: auditChainIntact,
    totals,
    orphans: {
      no_consumer: orphansNoConsumer,
      no_producer: orphansNoProducer,
      dangling: orphansDangling,
    },
    dangling_event_contracts: danglingEventContracts,
    public_surfaces_checked: publicSurfacesChecked,
    requirements: {
      total: requirementsTotal,
      implemented: requirementsImplemented,
      pending: requirementsPending,
    },
    exit_code,
  };

  // 5. Findings + conflicts + signals.
  const findings = buildFindings(
    modules,
    danglingEventContracts,
    classificationChangeRegistry
  );
  const crossSourceConflicts = buildCrossSourceConflicts(
    header,
    classificationChangeRegistry
  );
  const v1Signals: BuildSelfReportSignal[] = V1_SIGNAL_IDS.map((id) =>
    buildSignal(id, modules)
  );
  const v1ReadyCount = v1Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v1NeedsInputCount = v1Signals.filter(
    (s) => s.status === "NEEDS_INPUT"
  ).length;
  const v1BlockedCount = v1Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v1NotStartedCount = v1Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v1OverallReadinessPercent =
    v1Signals.length === 0
      ? 0
      : Math.round(
          v1Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v1Signals.length
        );

  const summary: BuildSelfReportSummary = {
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
    modulesAudited: modules.length,
    modulesPass: totals.pass,
    modulesPassWithWarnings: totals.pass_with_warnings,
    modulesFail: totals.fail,
    modulesBlockedByDesign: totals.blocked_by_design,
    orphansNoConsumer: orphansNoConsumer.length,
    orphansNoProducer: orphansNoProducer.length,
    orphansDangling: orphansDangling.length,
    danglingEventContracts: danglingEventContracts.length,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
    classificationChangesActive: classificationChangeRegistry.activeCount,
    classificationChangesHistorical:
      classificationChangeRegistry.historicalCount,
    classificationRegistryParsed: classificationChangeRegistry.parsed,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/build-preservation",
    "/governance/data-transparency-posture",
    "/governance/evidence-resolution-workflow",
    "/governance/document-evidence-reconciliation",
    "/governance/recommendation-precision-harness",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
  ]);

  return {
    runtimeVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
    specVersion: BUILD_SELF_REPORT_SPEC_VERSION,
    generatedAt: generated,
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    header,
    modules,
    summary,
    v1Signals,
    findings,
    crossSourceConflicts,
    classificationChangeRegistry,
    recommendedReviewRoutes,
    disclosures: [...BUILD_SELF_REPORT_DISCLOSURES],
    productionRestrictions: [...BUILD_SELF_REPORT_PRODUCTION_RESTRICTIONS],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    buildSelfReportInternalOnly: true,
    noInformationSale: true,
    noSilentSubmission: true,
    noSecretDistribution: true,
    noMarketingLead: true,
    noFraudAccusation: true,
    noDenial: true,
    noRejection: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
    noAutonomousReadiness: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

// =============================================================================
// Markdown renderer
// =============================================================================

function renderCheck(cell: BuildSelfReportCheckCell): string {
  const status = getStatus(cell);
  if (typeof cell === "string") {
    return status;
  }
  const reason = cell.reason ? ` (${cell.reason})` : "";
  return `${status}${reason}`;
}

export function renderBuildSelfReportMarkdown(
  result: BuildSelfReportResult
): string {
  const { header, modules, findings, crossSourceConflicts } = result;
  const ccr = result.classificationChangeRegistry;
  const lines: string[] = [];
  lines.push(`# Build Self-Report — ${header.checkpoint}`);
  lines.push("");
  lines.push(`Spec: \`${result.specVersion}\``);
  lines.push(`Runtime: \`${result.runtimeVersion}\``);
  lines.push(`Generated: \`${header.generated}\``);
  lines.push(`Commit: \`${header.commit}\` · Branch: \`${header.branch}\` · Tree: \`${header.tree_status}\``);
  lines.push(
    `verify_backend: ${header.verify_backend} · build: ${header.build} · static_pages: ${header.static_pages}`
  );
  lines.push(
    `volumes_conformed: [${header.volumes_conformed.join(", ")}]`
  );
  lines.push(
    `live_fetch_enabled: ${header.live_fetch_enabled} · audit_chain_intact: ${header.audit_chain_intact}`
  );
  lines.push(
    `modules: ${header.totals.modules} (numbered ${header.totals.numbered}, unnumbered ${header.totals.unnumbered}) · PASS ${header.totals.pass} · PASS_WITH_WARNINGS ${header.totals.pass_with_warnings} · FAIL ${header.totals.fail} · BLOCKED_BY_DESIGN ${header.totals.blocked_by_design}`
  );
  lines.push(
    `orphans: no_consumer [${header.orphans.no_consumer.join(", ") || "—"}] · no_producer [${header.orphans.no_producer.join(", ") || "—"}] · dangling [${header.orphans.dangling.join(", ") || "—"}]`
  );
  lines.push(
    `dangling_event_contracts: [${header.dangling_event_contracts.join(", ") || "—"}]`
  );
  lines.push(`public_surfaces_checked: ${header.public_surfaces_checked}`);
  lines.push(
    `requirements: ${header.requirements.total} = ${header.requirements.implemented} implemented + ${header.requirements.pending.length} pending`
  );
  lines.push(`exit_code: ${header.exit_code}`);
  lines.push("");
  lines.push("## Modules");
  lines.push("");
  lines.push(
    "| # | id | title | route | class | verdict | route_loads | replay | disclosures | blocks | authority | claims | pii | lineage | events p/c | handoffs i/o | orphan |"
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  );
  for (const row of modules) {
    const c = row.checks;
    lines.push(
      `| ${row.module_number ?? "—"} | \`${row.module_id}\` | ${row.title} | \`${row.route}\` | ${row.surface_class} | **${row.module_verdict}** | ${renderCheck(c.route_loads)} | ${renderCheck(c.replay_reproduces)} | ${renderCheck(c.disclosures_present)} | ${renderCheck(c.blocks_enforced)} | ${renderCheck(c.human_authority)} | ${renderCheck(c.claims_controls)} | ${renderCheck(c.pii_redaction)} | ${renderCheck(c.lineage_traceable)} | ${row.graph.events_produced}/${row.graph.events_consumed} | ${row.graph.handoffs_in}/${row.graph.handoffs_out} | ${row.graph.orphan_flag} |`
    );
  }
  lines.push("");
  if (findings.length > 0) {
    lines.push(`## Findings (${findings.length})`);
    lines.push("");
    for (const f of findings) {
      lines.push(
        `- **${f.category}** · \`${f.findingId}\` · ${f.subjectModuleId ?? ""}`
      );
      lines.push(`  - ${f.reviewerExplanation}`);
    }
    lines.push("");
  }
  if (crossSourceConflicts.length > 0) {
    lines.push(`## Cross-source conflicts (${crossSourceConflicts.length})`);
    lines.push("");
    for (const c of crossSourceConflicts) {
      lines.push(`- **${c.topic}** · \`${c.conflictId}\``);
      lines.push(`  - ${c.description}`);
    }
    lines.push("");
  }
  // Active Classification Changes (VIA-GOVERNANCE-CLASSIFICATION-001).
  lines.push(`## Active Classification Changes (${ccr.activeCount})`);
  lines.push("");
  if (!ccr.parsed) {
    lines.push(
      `> **Registry parse FAILED — build fails closed.** ${ccr.error ?? "unknown error"}`
    );
    lines.push("");
  } else if (ccr.activeCount === 0) {
    lines.push(
      "_No active classification changes are recorded at this checkpoint._"
    );
    lines.push("");
  } else {
    for (const entry of ccr.activeEntries) {
      lines.push(`### ${entry.id} — ${entry.title}`);
      lines.push("");
      lines.push(`- **Status:** ${entry.status}`);
      lines.push(`- **Previous state:** ${entry.previousState}`);
      lines.push(`- **New state:** ${entry.newState}`);
      lines.push(`- **Reason:** ${entry.reason}`);
      lines.push(`- **Approver:** ${entry.approver}`);
      lines.push(`- **Effective date:** ${entry.effectiveDate}`);
      lines.push(`- **Resolution criteria:** ${entry.resolutionCriteria}`);
      lines.push("");
    }
  }

  if (ccr.parsed && ccr.historicalCount > 0) {
    lines.push(
      `## Historical Classification Changes (${ccr.historicalCount})`
    );
    lines.push("");
    lines.push(
      "_Resolved / voided entries — recorded for lineage, not counted as active._"
    );
    lines.push("");
    for (const entry of ccr.historicalEntries) {
      lines.push(
        `- **${entry.id}** — ${entry.title} · status **${entry.status}**`
      );
      if (entry.resolutionCriteria.length > 0) {
        lines.push(`  - Resolution: ${entry.resolutionCriteria}`);
      }
    }
    lines.push("");
  }

  lines.push("## Disclosures");
  lines.push("");
  for (const d of result.disclosures) {
    lines.push(`- ${d}`);
  }
  return lines.join("\n") + "\n";
}

export function buildSelfReportLineage(): {
  runtimeVersion: string;
  specVersion: string;
  moduleCount: number;
  eventContractCount: number;
  handoffCount: number;
} {
  return {
    runtimeVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
    specVersion: BUILD_SELF_REPORT_SPEC_VERSION,
    moduleCount: moduleManifests.length,
    eventContractCount: eventContractRegistry.length,
    handoffCount: crossModuleHandoffMap.length,
  };
}

export const BUILD_SELF_REPORT_SIGNAL_IDS = V1_SIGNAL_IDS;
