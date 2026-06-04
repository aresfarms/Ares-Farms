import {
  BUILD_SELF_REPORT_RUNTIME_VERSION,
  BuildSelfReportInput,
  BuildSelfReportModuleRow,
  BuildSelfReportResult,
  composeBuildSelfReport,
} from "@/lib/build-self-report/buildSelfReportRuntime";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Public Alpha Profile Runtime v1 (Build 35)
 *
 * Codifies the Furlong Public Alpha Definition v1 doctrine
 * (docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md) into a governed
 * runtime that profiles the Build Self-Report against the Alpha
 * §3 ON modules, §4 OFF capabilities, §6 entry criteria, §7 exit
 * criteria, and surfaces §9 open decisions as REQUIRES_HUMAN_REVIEW
 * pending sign-off.
 *
 * The runtime does NOT authorize Alpha entry. It composes the
 * static evidence and produces an alpha_entry_allowed gate result.
 * The actual Alpha entry decision is recorded by the named
 * governance authority once §9 is signed off — that authority
 * remains an external human action.
 *
 * Doctrine status: PROPOSED — requires sign-off by named
 * governance authority before any external admission. This runtime
 * surfaces the doctrine in code so the §3 ON set, §4 OFF set, §6
 * entry criteria, §7 exit criteria become inspectable, replay-safe
 * evidence. Until §9 sign-off is recorded, alpha_entry_allowed
 * remains PENDING_SIGNOFF regardless of the underlying technical
 * posture.
 *
 * Constitutional posture: internal advisory audit posture only,
 * replay-safe, audit-safe, conflict-preserving. Every finding
 * resolves to REQUIRES_HUMAN_REVIEW. No information sale, no
 * silent submission, no autonomous determination of any kind, no
 * approval, no denial.
 */

export const PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION =
  "public-alpha-profile-runtime-v0.1.0";

export const PUBLIC_ALPHA_DEFINITION_VERSION =
  "public-alpha-definition-v1.0";

export const PUBLIC_ALPHA_DEFINITION_DOC_REF =
  "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md";

// =============================================================================
// §3 ON list — Alpha-required modules
// =============================================================================

export type PublicAlphaCapabilityId =
  | "application_intake"
  | "document_intake"
  | "field_overlay_completeness_checks"
  | "human_review_and_transition"
  | "in_app_notices_status"
  | "advisory_program_opportunity_surfacing"
  | "data_accounting_portability"
  | "append_only_audit_replay"
  | "advisory_export"
  | "governance_runtime_promotion_gate";

export type PublicAlphaCapabilityRequirement = {
  id: PublicAlphaCapabilityId;
  doctrineLabel: string;
  constraint: string;
  // moduleIdPatterns match module manifest ids in the registry.
  // A capability is "represented" when at least one module manifest
  // matches a pattern.
  moduleIdPatterns: RegExp[];
};

export const PUBLIC_ALPHA_ON_CAPABILITIES: ReadonlyArray<PublicAlphaCapabilityRequirement> =
  [
    {
      id: "application_intake",
      doctrineLabel: "Application intake",
      constraint: "Real submissions accepted; human-reviewed.",
      moduleIdPatterns: [/^applications$/, /^portal-borrower-applications$/],
    },
    {
      id: "document_intake",
      doctrineLabel: "Document intake",
      constraint: "Upload + completeness check only.",
      moduleIdPatterns: [/^documents$/, /^portal-borrower-documents$/],
    },
    {
      id: "field_overlay_completeness_checks",
      doctrineLabel: "Field / overlay completeness checks",
      constraint: "Advisory completeness only — never eligibility.",
      moduleIdPatterns: [/^rules$/],
    },
    {
      id: "human_review_and_transition",
      doctrineLabel: "Human review & transition",
      constraint: "Mandatory at every decision point.",
      moduleIdPatterns: [/^reviews$/],
    },
    {
      id: "in_app_notices_status",
      doctrineLabel: "In-app notices / status",
      constraint: "In-app only — no external send.",
      moduleIdPatterns: [/^notices$/],
    },
    {
      id: "advisory_program_opportunity_surfacing",
      doctrineLabel: "Advisory program / opportunity surfacing",
      constraint:
        "Clearly labeled advisory; surfaces candidates, never determines.",
      moduleIdPatterns: [
        /^governance-revenue-intelligence-v2$/,
        /^governance-opportunity-discovery-v2$/,
        /^governance-financing-pathway-engine-v2$/,
        /^governance-capital-graph$/,
      ],
    },
    {
      id: "data_accounting_portability",
      doctrineLabel: "Data accounting / portability",
      constraint: "Borrower can see/export what's held.",
      moduleIdPatterns: [/^data-rights$/, /^portal-borrower-data-rights$/],
    },
    {
      id: "append_only_audit_replay",
      doctrineLabel: "Append-only audit + replay",
      constraint: "The trust spine — must verify intact.",
      moduleIdPatterns: [/^audit-replay$/],
    },
    {
      id: "advisory_export",
      doctrineLabel: "Advisory export",
      constraint: "Watermarked advisory, not official.",
      moduleIdPatterns: [/^reports$/],
    },
    {
      id: "governance_runtime_promotion_gate",
      doctrineLabel: "Governance runtime + promotion gate",
      constraint: "Keeps all blocks enforced.",
      moduleIdPatterns: [/^governance$/, /^promotion$/],
    },
  ];

// =============================================================================
// §4 OFF list — capabilities that must remain BLOCKED throughout Alpha
// =============================================================================

export type PublicAlphaBlockedCapabilityId =
  | "payment_capture"
  | "borrower_external_notice_sending"
  | "official_determinations_or_adverse_action"
  | "official_report_publication"
  | "public_verification"
  | "regulatory_or_official_reliance"
  | "legal_advice"
  | "live_scraper_or_live_fetch"
  | "live_external_actions"
  | "dns_cutover"
  | "production_db_migrations"
  | "public_production_api_exposure"
  | "open_non_invited_signup"
  | "regulatory_examination_submission_or_response";

export type PublicAlphaBlockedCapability = {
  id: PublicAlphaBlockedCapabilityId;
  doctrineLabel: string;
  // Modules whose constitutional purpose includes enforcing this
  // block; their blocks_enforced cell in the self-report MUST be
  // PASS or BLOCKED_BY_DESIGN.
  guardingModuleIdPatterns: RegExp[];
};

export const PUBLIC_ALPHA_OFF_CAPABILITIES: ReadonlyArray<PublicAlphaBlockedCapability> =
  [
    {
      id: "payment_capture",
      doctrineLabel: "Payment capture",
      guardingModuleIdPatterns: [/^billing$/],
    },
    {
      id: "borrower_external_notice_sending",
      doctrineLabel: "Borrower external notice sending",
      guardingModuleIdPatterns: [/^notices$/],
    },
    {
      id: "official_determinations_or_adverse_action",
      doctrineLabel:
        "Official determinations / approvals / adverse-action issuance",
      guardingModuleIdPatterns: [/^decisions$/],
    },
    {
      id: "official_report_publication",
      doctrineLabel: "Official report publication",
      guardingModuleIdPatterns: [/^reports$/],
    },
    {
      id: "public_verification",
      doctrineLabel: "Public verification",
      guardingModuleIdPatterns: [/^promotion$/, /^production-reliance-verification$/],
    },
    {
      id: "regulatory_or_official_reliance",
      doctrineLabel: "Official or regulatory reliance",
      guardingModuleIdPatterns: [
        /^production-reliance-verification$/,
        /^production-regulatory-examination$/,
      ],
    },
    {
      id: "legal_advice",
      doctrineLabel: "Legal advice",
      guardingModuleIdPatterns: [/^governance$/],
    },
    {
      id: "live_scraper_or_live_fetch",
      doctrineLabel: "Live scraper / live fetch (count stays 0)",
      guardingModuleIdPatterns: [
        /^live-scraper-activation$/,
        /^source-promotion-packets$/,
        /^source-production-readiness$/,
        /^controlled-promotion-activation$/,
      ],
    },
    {
      id: "live_external_actions",
      doctrineLabel: "Live external actions",
      guardingModuleIdPatterns: [/^promotion$/, /^live-action-readiness$/],
    },
    {
      id: "dns_cutover",
      doctrineLabel: "DNS cutover",
      guardingModuleIdPatterns: [
        /^production-cutover-hold$/,
        /^deployment-environment-readiness$/,
      ],
    },
    {
      id: "production_db_migrations",
      doctrineLabel: "Production DB migrations",
      guardingModuleIdPatterns: [
        /^deployment-environment-readiness$/,
        /^production-launch-evidence$/,
      ],
    },
    {
      id: "public_production_api_exposure",
      doctrineLabel: "Public production API exposure",
      guardingModuleIdPatterns: [
        /^production-portal-readiness$/,
        /^production-final-authority$/,
      ],
    },
    {
      id: "open_non_invited_signup",
      doctrineLabel: "Open (non-invited) signup",
      guardingModuleIdPatterns: [/^production-portal-readiness$/],
    },
    {
      id: "regulatory_examination_submission_or_response",
      doctrineLabel: "Regulatory examination submission / response",
      guardingModuleIdPatterns: [
        /^production-regulatory-examination$/,
        /^production-regulatory-response$/,
      ],
    },
  ];

// =============================================================================
// §6 entry criteria
// =============================================================================

export type PublicAlphaEntryCriterionId =
  | "self_report_exit_code_zero_for_alpha_set"
  | "module_44_disclosure_audit_green"
  | "module_45_human_authority_assigned"
  | "claims_controls_pass_on_customer_surfaces"
  | "pii_audit_chain_and_live_fetch_clean"
  | "three_awaiting_promotion_requirements_enumerated_or_resolved"
  | "tree_committed_tagged_dr_restore_tested"
  | "signed_alpha_participation_terms_in_place";

export type PublicAlphaEntryCriterion = {
  id: PublicAlphaEntryCriterionId;
  doctrineLabel: string;
  doctrineSectionRef: "§6";
};

export const PUBLIC_ALPHA_ENTRY_CRITERIA: ReadonlyArray<PublicAlphaEntryCriterion> =
  [
    {
      id: "self_report_exit_code_zero_for_alpha_set",
      doctrineLabel:
        "Module 42 self-report exit code = 0 for the Alpha-required module set (§3).",
      doctrineSectionRef: "§6",
    },
    {
      id: "module_44_disclosure_audit_green",
      doctrineLabel:
        "Module 44 (Disclosure Audit) green: every ON surface carries advisory-only / no-approval / no-guarantee / no-reliance / no-public-verification disclosures.",
      doctrineSectionRef: "§6",
    },
    {
      id: "module_45_human_authority_assigned",
      doctrineLabel:
        "Module 45 (Human Authority): every decision point in the ON set has a named credentialed clearing role; no path clears without a human.",
      doctrineSectionRef: "§6",
    },
    {
      id: "claims_controls_pass_on_customer_surfaces",
      doctrineLabel:
        "claims_controls = PASS against the prohibited-claims corpus on all customer-facing surfaces.",
      doctrineSectionRef: "§6",
    },
    {
      id: "pii_audit_chain_and_live_fetch_clean",
      doctrineLabel:
        "pii_redaction = PASS; audit_chain_intact = PASS; live_fetch_enabled = 0.",
      doctrineSectionRef: "§6",
    },
    {
      id: "three_awaiting_promotion_requirements_enumerated_or_resolved",
      doctrineLabel:
        "The 3 awaiting-promotion requirements are enumerated and confirmed not required for the Alpha set (or resolved).",
      doctrineSectionRef: "§6",
    },
    {
      id: "tree_committed_tagged_dr_restore_tested",
      doctrineLabel:
        "Tree committed + tagged; sensitive files ignored; DR restore tested.",
      doctrineSectionRef: "§6",
    },
    {
      id: "signed_alpha_participation_terms_in_place",
      doctrineLabel:
        "Signed Alpha participation terms in place for every external participant.",
      doctrineSectionRef: "§6",
    },
  ];

// =============================================================================
// §7 exit criteria
// =============================================================================

export type PublicAlphaExitCriterionId =
  | "cohort_end_to_end_zero_reliance_incidents"
  | "self_report_exit_code_zero_sustained_window"
  | "functional_e2e_coverage_added"
  | "no_open_fail_in_core_checks"
  | "governance_authority_decision_recorded";

export const PUBLIC_ALPHA_EXIT_CRITERIA: ReadonlyArray<{
  id: PublicAlphaExitCriterionId;
  doctrineLabel: string;
}> = [
  {
    id: "cohort_end_to_end_zero_reliance_incidents",
    doctrineLabel:
      "Target invited cohort has run end-to-end intake → review → advisory output with zero reliance incidents and zero block bypasses recorded in audit.",
  },
  {
    id: "self_report_exit_code_zero_sustained_window",
    doctrineLabel:
      "Self-report holds exit code 0 across the full Alpha set for a sustained window (see §9 #1 — proposed 30 days).",
  },
  {
    id: "functional_e2e_coverage_added",
    doctrineLabel:
      "Functional / e2e coverage added for the ON modules (Alpha must close the smoke-only gap before any production conversation).",
  },
  {
    id: "no_open_fail_in_core_checks",
    doctrineLabel:
      "All Alpha-surfaced defects triaged; no open FAIL in route_loads, replay_reproduces, pii_redaction, claims_controls, blocks_enforced.",
  },
  {
    id: "governance_authority_decision_recorded",
    doctrineLabel:
      "A decision is recorded by the named governance authority on whether to proceed toward the production gate chain (Modules 27–41) — Alpha exit does NOT auto-authorize production.",
  },
];

// =============================================================================
// §9 open decisions (pending sign-off)
// =============================================================================

export type PublicAlphaOpenDecisionId =
  | "sustained_window_duration"
  | "cohort_size"
  | "module_21_environmental_compliance_featured_or_deferred"
  | "module_10_connectors_live_or_simulated"
  | "named_governance_authority";

export const PUBLIC_ALPHA_OPEN_DECISIONS: ReadonlyArray<{
  id: PublicAlphaOpenDecisionId;
  doctrineLabel: string;
}> = [
  {
    id: "sustained_window_duration",
    doctrineLabel:
      "Sustained-window duration for exit criterion 2 (proposed: 30 days).",
  },
  {
    id: "cohort_size",
    doctrineLabel:
      "Cohort size — how many borrowers / how many partner lenders.",
  },
  {
    id: "module_21_environmental_compliance_featured_or_deferred",
    doctrineLabel:
      "Whether Module 21 (environmental-compliance) is a featured Alpha workflow or deferred.",
  },
  {
    id: "module_10_connectors_live_or_simulated",
    doctrineLabel:
      "Whether Module 10 (connectors) must be live (only if Alpha integrates a real lender system vs. simulated review).",
  },
  {
    id: "named_governance_authority",
    doctrineLabel:
      "Named governance authority who signs Alpha entry and exit.",
  },
];

// =============================================================================
// Decision sign-off input
// =============================================================================

export type PublicAlphaDecisionSignoff = {
  decisionId: PublicAlphaOpenDecisionId;
  recorded_value: string;
  recorded_by: string;
  recorded_at: string;
};

// =============================================================================
// Input
// =============================================================================

export type PublicAlphaProfileInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  selfReportInput?: BuildSelfReportInput;
  // Sign-off entries map §9 decision ids to recorded values + named
  // governance authority. Until each §9 entry has a sign-off, the
  // alpha_entry_allowed gate remains PENDING_SIGNOFF.
  decisionSignoffs?: PublicAlphaDecisionSignoff[];
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Output types
// =============================================================================

export type PublicAlphaStatus =
  | "PASS"
  | "FAIL"
  | "PENDING_SIGNOFF"
  | "BLOCKED_BY_DESIGN"
  | "N/A";

export type PublicAlphaCapabilityCoverage = {
  capabilityId: PublicAlphaCapabilityId;
  doctrineLabel: string;
  constraint: string;
  representingModuleIds: string[];
  represented: boolean;
  modulesPassing: string[];
  modulesFailing: string[];
  status: PublicAlphaStatus;
};

export type PublicAlphaBlockedCapabilityCoverage = {
  capabilityId: PublicAlphaBlockedCapabilityId;
  doctrineLabel: string;
  guardingModuleIds: string[];
  guardingBlocksEnforced: boolean;
  modulesPassingOrBlockedByDesign: string[];
  modulesBlockNotEnforced: string[];
  status: PublicAlphaStatus;
};

export type PublicAlphaEntryCriterionEvaluation = {
  criterionId: PublicAlphaEntryCriterionId;
  doctrineLabel: string;
  status: PublicAlphaStatus;
  reason: string;
};

export type PublicAlphaExitCriterionEvaluation = {
  criterionId: PublicAlphaExitCriterionId;
  doctrineLabel: string;
  status: PublicAlphaStatus;
  reason: string;
};

export type PublicAlphaOpenDecisionEvaluation = {
  decisionId: PublicAlphaOpenDecisionId;
  doctrineLabel: string;
  status: "RECORDED" | "PENDING_SIGNOFF";
  recordedValue: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
};

export type PublicAlphaProfileSignalId =
  | "alpha_on_capability_coverage_alignment"
  | "alpha_off_capability_block_alignment"
  | "alpha_entry_criteria_alignment"
  | "alpha_open_decisions_signoff_alignment";

export type PublicAlphaProfileSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type PublicAlphaProfileSignal = {
  id: PublicAlphaProfileSignalId;
  label: string;
  status: PublicAlphaProfileSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type PublicAlphaProfileCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type PublicAlphaProfileFinding = {
  findingId: string;
  category:
    | "ALPHA_ON_CAPABILITY_NOT_REPRESENTED"
    | "ALPHA_ON_MODULE_VERDICT_FAIL"
    | "ALPHA_OFF_CAPABILITY_BLOCK_NOT_ENFORCED"
    | "ALPHA_ENTRY_CRITERION_NOT_MET"
    | "ALPHA_OPEN_DECISION_PENDING_SIGNOFF";
  doctrineSectionRef: string;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

export type PublicAlphaProfileSummary = {
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
  onCapabilityCount: number;
  onCapabilitiesPass: number;
  onCapabilitiesFail: number;
  offCapabilityCount: number;
  offCapabilitiesPassOrBlockedByDesign: number;
  offCapabilitiesUnenforced: number;
  entryCriterionCount: number;
  entryCriteriaPass: number;
  entryCriteriaFail: number;
  entryCriteriaPendingSignoff: number;
  exitCriterionCount: number;
  openDecisionCount: number;
  openDecisionsRecorded: number;
  openDecisionsPendingSignoff: number;
  findingCount: number;
  crossSourceConflictCount: number;
};

export type PublicAlphaProfileResult = {
  runtimeVersion: string;
  definitionVersion: string;
  definitionDocRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  buildSelfReportRuntimeVersion: string;
  buildSelfReportExitCode: 0 | 1;
  buildSelfReportSummaryHandle: BuildSelfReportResult["summary"];
  onCapabilityCoverage: PublicAlphaCapabilityCoverage[];
  offCapabilityCoverage: PublicAlphaBlockedCapabilityCoverage[];
  entryCriteriaEvaluation: PublicAlphaEntryCriterionEvaluation[];
  exitCriteriaEvaluation: PublicAlphaExitCriterionEvaluation[];
  openDecisionsEvaluation: PublicAlphaOpenDecisionEvaluation[];
  alphaEntryAllowed: PublicAlphaStatus;
  summary: PublicAlphaProfileSummary;
  v1Signals: PublicAlphaProfileSignal[];
  findings: PublicAlphaProfileFinding[];
  crossSourceConflicts: PublicAlphaProfileCrossSourceConflict[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  publicAlphaProfileInternalOnly: true;
  noAlphaEntryAuthorization: true;
  noInformationSale: true;
  noSilentSubmission: true;
  noSecretDistribution: true;
  noMarketingLead: true;
  noFraudAccusation: true;
  noDenial: true;
  noRejection: true;
  noApproval: true;
  noPreapproval: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
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

const REVIEW_ROUTE = "/governance/public-alpha-profile";

const DEFAULT_BLOCKED_CLAIMS = [
  "alpha entry authorization",
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
] as const;

export const PUBLIC_ALPHA_PROFILE_DISCLOSURES = [
  "Public Alpha Profile v1 output is internal advisory audit evidence only, replay-safe, audit-safe, and conflict-preserving.",
  "The runtime does NOT authorize Alpha entry. Alpha entry is recorded by the named governance authority after §9 sign-off — that authority remains an external human action.",
  "Until every §9 open decision carries a recorded sign-off, alpha_entry_allowed remains PENDING_SIGNOFF regardless of the underlying technical posture.",
  "Public Alpha is a closed, invitation-only release with no payments, no live external/regulated actions, no official determinations, and no regulated reliance.",
  "Furlong's constitutional posture holds unchanged during Alpha: we facilitate, we do not decide.",
  "Every finding resolves to REQUIRES_HUMAN_REVIEW.",
  "Cross-source conflicts surfaced by the Build Self-Report v1 are preserved as first-class evidence and never collapsed.",
  "Modules in §4 (OFF) MUST read PASS or BLOCKED_BY_DESIGN; any block bypass is an Alpha halt condition.",
  "Modules in §3 (ON) MUST cover their doctrine-declared capability with at least one non-FAIL module verdict before Alpha entry.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const PUBLIC_ALPHA_PROFILE_PRODUCTION_RESTRICTIONS = [
  "no Alpha entry authorization",
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
  PUBLIC_ALPHA_DEFINITION_VERSION,
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "alpha entry authorization",
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
// Helpers
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

function getRowStatus(row: BuildSelfReportModuleRow): {
  verdict: BuildSelfReportModuleRow["module_verdict"];
  blocks_enforced_status: string;
} {
  const cell = row.checks.blocks_enforced;
  const status = typeof cell === "string" ? cell : cell.status;
  return {
    verdict: row.module_verdict,
    blocks_enforced_status: status,
  };
}

function matchModules(
  patterns: RegExp[],
  rows: BuildSelfReportModuleRow[]
): BuildSelfReportModuleRow[] {
  return rows.filter((row) =>
    patterns.some((re) => re.test(row.module_id))
  );
}

// =============================================================================
// §3 ON coverage evaluation
// =============================================================================

function evaluateOnCapabilities(
  rows: BuildSelfReportModuleRow[]
): PublicAlphaCapabilityCoverage[] {
  return PUBLIC_ALPHA_ON_CAPABILITIES.map((cap) => {
    const matched = matchModules(cap.moduleIdPatterns, rows);
    const representingModuleIds = matched.map((m) => m.module_id);
    const modulesPassing = matched
      .filter(
        (m) =>
          m.module_verdict === "PASS" ||
          m.module_verdict === "PASS_WITH_WARNINGS" ||
          m.module_verdict === "BLOCKED_BY_DESIGN"
      )
      .map((m) => m.module_id);
    const modulesFailing = matched
      .filter((m) => m.module_verdict === "FAIL")
      .map((m) => m.module_id);
    let status: PublicAlphaStatus;
    if (representingModuleIds.length === 0) {
      status = "FAIL";
    } else if (modulesFailing.length > 0) {
      status = "FAIL";
    } else {
      status = "PASS";
    }
    return {
      capabilityId: cap.id,
      doctrineLabel: cap.doctrineLabel,
      constraint: cap.constraint,
      representingModuleIds,
      represented: representingModuleIds.length > 0,
      modulesPassing,
      modulesFailing,
      status,
    };
  });
}

// =============================================================================
// §4 OFF coverage evaluation
// =============================================================================

function evaluateOffCapabilities(
  rows: BuildSelfReportModuleRow[]
): PublicAlphaBlockedCapabilityCoverage[] {
  return PUBLIC_ALPHA_OFF_CAPABILITIES.map((cap) => {
    const matched = matchModules(cap.guardingModuleIdPatterns, rows);
    const guardingModuleIds = matched.map((m) => m.module_id);
    const modulesPassingOrBlockedByDesign = matched
      .filter((m) => {
        const status = getRowStatus(m).blocks_enforced_status;
        return status === "PASS" || status === "BLOCKED_BY_DESIGN";
      })
      .map((m) => m.module_id);
    const modulesBlockNotEnforced = matched
      .filter((m) => {
        const status = getRowStatus(m).blocks_enforced_status;
        return status === "FAIL";
      })
      .map((m) => m.module_id);
    let status: PublicAlphaStatus;
    if (guardingModuleIds.length === 0) {
      // No guarding module present in the registry; mark FAIL since
      // the doctrine requires the capability to be guarded.
      status = "FAIL";
    } else if (modulesBlockNotEnforced.length > 0) {
      status = "FAIL";
    } else {
      status = "BLOCKED_BY_DESIGN";
    }
    return {
      capabilityId: cap.id,
      doctrineLabel: cap.doctrineLabel,
      guardingModuleIds,
      guardingBlocksEnforced: modulesBlockNotEnforced.length === 0,
      modulesPassingOrBlockedByDesign,
      modulesBlockNotEnforced,
      status,
    };
  });
}

// =============================================================================
// §6 entry criteria evaluation
// =============================================================================

function evaluateEntryCriteria(
  selfReport: BuildSelfReportResult,
  onCoverage: PublicAlphaCapabilityCoverage[],
  alphaSetRows: BuildSelfReportModuleRow[],
  signedTermsRecorded: boolean,
  drRestoreRecorded: boolean
): PublicAlphaEntryCriterionEvaluation[] {
  const cleanLiveFetch = selfReport.header.live_fetch_enabled === 0;
  const auditChainClean = selfReport.header.audit_chain_intact === "PASS";
  const requirementsEnumerated =
    selfReport.header.requirements.total ===
    selfReport.header.requirements.implemented +
      selfReport.header.requirements.pending.length;
  // Detect Module 44 and Module 45 by canonical id; until they ship,
  // mark as PENDING_SIGNOFF (per doctrine, until 44/45 land these
  // columns aren't green).
  const has44 = moduleManifests.some(
    (m) => m.id === "governance-disclosure-audit"
  );
  const has45 = moduleManifests.some(
    (m) => m.id === "governance-human-authority-registry"
  );
  const alphaSetExitClean =
    alphaSetRows.every((r) => r.module_verdict !== "FAIL") &&
    onCoverage.every((c) => c.status === "PASS");
  return PUBLIC_ALPHA_ENTRY_CRITERIA.map((criterion) => {
    let status: PublicAlphaStatus;
    let reason: string;
    switch (criterion.id) {
      case "self_report_exit_code_zero_for_alpha_set":
        status = alphaSetExitClean ? "PASS" : "FAIL";
        reason = alphaSetExitClean
          ? "every Alpha-required module verdict is PASS / PASS_WITH_WARNINGS / BLOCKED_BY_DESIGN."
          : "at least one Alpha-required module has verdict FAIL or the §3 ON capability is unrepresented.";
        break;
      case "module_44_disclosure_audit_green":
        status = has44 ? "PASS" : "PENDING_SIGNOFF";
        reason = has44
          ? "Module 44 (Disclosure Audit) is registered."
          : "Module 44 (Disclosure Audit) has not yet been built — Alpha entry blocked per §6.";
        break;
      case "module_45_human_authority_assigned":
        status = has45 ? "PASS" : "PENDING_SIGNOFF";
        reason = has45
          ? "Module 45 (Human Authority Registry) is registered."
          : "Module 45 (Human Authority Registry) has not yet been built — Alpha entry blocked per §6.";
        break;
      case "claims_controls_pass_on_customer_surfaces": {
        const failing = alphaSetRows.filter((r) => {
          const cell = r.checks.claims_controls;
          const s = typeof cell === "string" ? cell : cell.status;
          return s === "FAIL";
        });
        status = failing.length === 0 ? "PASS" : "FAIL";
        reason =
          failing.length === 0
            ? "no claims_controls FAIL in the Alpha-required set."
            : `${failing.length} Alpha-required module(s) have claims_controls FAIL.`;
        break;
      }
      case "pii_audit_chain_and_live_fetch_clean": {
        const piiFailing = alphaSetRows.filter((r) => {
          const cell = r.checks.pii_redaction;
          const s = typeof cell === "string" ? cell : cell.status;
          return s === "FAIL";
        });
        const clean =
          piiFailing.length === 0 && cleanLiveFetch && auditChainClean;
        status = clean ? "PASS" : "FAIL";
        reason = clean
          ? "pii_redaction PASS across the Alpha set; audit chain intact; live_fetch_enabled = 0."
          : `pii_redaction-FAIL=${piiFailing.length}, live_fetch_enabled=${selfReport.header.live_fetch_enabled}, audit_chain_intact=${selfReport.header.audit_chain_intact}`;
        break;
      }
      case "three_awaiting_promotion_requirements_enumerated_or_resolved":
        status = requirementsEnumerated ? "PASS" : "FAIL";
        reason = requirementsEnumerated
          ? `requirements ledger enumerates all rows (${selfReport.header.requirements.total} = ${selfReport.header.requirements.implemented} implemented + ${selfReport.header.requirements.pending.length} pending).`
          : "requirements ledger does not enumerate every row.";
        break;
      case "tree_committed_tagged_dr_restore_tested": {
        const treeClean = selfReport.header.tree_status === "clean";
        const ok = treeClean && drRestoreRecorded;
        status = ok ? "PASS" : "PENDING_SIGNOFF";
        reason = ok
          ? "tree clean and DR restore sign-off recorded."
          : `tree_status = ${selfReport.header.tree_status}; DR-restore sign-off recorded = ${drRestoreRecorded}.`;
        break;
      }
      case "signed_alpha_participation_terms_in_place":
        status = signedTermsRecorded ? "PASS" : "PENDING_SIGNOFF";
        reason = signedTermsRecorded
          ? "signed Alpha participation terms recorded."
          : "signed Alpha participation terms not recorded — pending external admission ceremony.";
        break;
    }
    return {
      criterionId: criterion.id,
      doctrineLabel: criterion.doctrineLabel,
      status,
      reason,
    };
  });
}

// =============================================================================
// §7 exit criteria evaluation (operational — most are pending until Alpha runs)
// =============================================================================

function evaluateExitCriteria(): PublicAlphaExitCriterionEvaluation[] {
  // Until Alpha has run, every exit criterion is PENDING_SIGNOFF.
  // The runtime surfaces them as inspectable evidence so reviewers
  // know what to record at exit time.
  return PUBLIC_ALPHA_EXIT_CRITERIA.map((c) => ({
    criterionId: c.id,
    doctrineLabel: c.doctrineLabel,
    status: "PENDING_SIGNOFF" as PublicAlphaStatus,
    reason:
      "exit criterion not yet evaluable; will be recorded by the named governance authority when the Alpha window closes.",
  }));
}

// =============================================================================
// §9 open decisions evaluation
// =============================================================================

function evaluateOpenDecisions(
  signoffs: PublicAlphaDecisionSignoff[]
): PublicAlphaOpenDecisionEvaluation[] {
  const byId = new Map<PublicAlphaOpenDecisionId, PublicAlphaDecisionSignoff>();
  for (const s of signoffs) {
    byId.set(s.decisionId, s);
  }
  return PUBLIC_ALPHA_OPEN_DECISIONS.map((d) => {
    const s = byId.get(d.id);
    if (s) {
      return {
        decisionId: d.id,
        doctrineLabel: d.doctrineLabel,
        status: "RECORDED",
        recordedValue: s.recorded_value,
        recordedBy: s.recorded_by,
        recordedAt: s.recorded_at,
      };
    }
    return {
      decisionId: d.id,
      doctrineLabel: d.doctrineLabel,
      status: "PENDING_SIGNOFF",
      recordedValue: null,
      recordedBy: null,
      recordedAt: null,
    };
  });
}

// =============================================================================
// Findings
// =============================================================================

function buildFindings(
  onCoverage: PublicAlphaCapabilityCoverage[],
  offCoverage: PublicAlphaBlockedCapabilityCoverage[],
  entryEval: PublicAlphaEntryCriterionEvaluation[],
  decisionsEval: PublicAlphaOpenDecisionEvaluation[]
): PublicAlphaProfileFinding[] {
  const findings: PublicAlphaProfileFinding[] = [];
  for (const cov of onCoverage) {
    if (!cov.represented) {
      findings.push({
        findingId: `pap-on-not-represented-${cov.capabilityId}`,
        category: "ALPHA_ON_CAPABILITY_NOT_REPRESENTED",
        doctrineSectionRef: "§3",
        topic: `Alpha-required capability ${cov.doctrineLabel} is not represented by any module`,
        reviewerExplanation: `The §3 ON list requires ${cov.doctrineLabel} (${cov.constraint}). No module in the registry matches the capability's id patterns. Alpha entry is blocked until this is resolved.`,
        evidenceReplayRef: `pap-replay://on-capability/${cov.capabilityId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    } else if (cov.modulesFailing.length > 0) {
      findings.push({
        findingId: `pap-on-module-fail-${cov.capabilityId}`,
        category: "ALPHA_ON_MODULE_VERDICT_FAIL",
        doctrineSectionRef: "§3",
        topic: `${cov.modulesFailing.length} module(s) covering ${cov.doctrineLabel} have verdict FAIL`,
        reviewerExplanation: `Modules ${cov.modulesFailing.join(", ")} cover the §3 capability ${cov.doctrineLabel} but their build self-report verdict is FAIL. Per §6 entry criterion 1, Alpha entry is blocked.`,
        evidenceReplayRef: `pap-replay://on-capability/${cov.capabilityId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  for (const cov of offCoverage) {
    if (cov.status === "FAIL") {
      findings.push({
        findingId: `pap-off-block-not-enforced-${cov.capabilityId}`,
        category: "ALPHA_OFF_CAPABILITY_BLOCK_NOT_ENFORCED",
        doctrineSectionRef: "§4",
        topic: `Block for ${cov.doctrineLabel} is not enforced`,
        reviewerExplanation: `The §4 OFF list requires ${cov.doctrineLabel} to remain blocked. ${cov.guardingModuleIds.length === 0 ? "No guarding module is present in the registry." : `Guarding module(s) ${cov.modulesBlockNotEnforced.join(", ")} report blocks_enforced FAIL.`} Per §4, any block bypass = Alpha halt.`,
        evidenceReplayRef: `pap-replay://off-capability/${cov.capabilityId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  for (const ev of entryEval) {
    if (ev.status === "FAIL" || ev.status === "PENDING_SIGNOFF") {
      findings.push({
        findingId: `pap-entry-${ev.criterionId}`,
        category: "ALPHA_ENTRY_CRITERION_NOT_MET",
        doctrineSectionRef: "§6",
        topic: `Entry criterion not met: ${ev.doctrineLabel}`,
        reviewerExplanation: `Status: ${ev.status}. Reason: ${ev.reason}`,
        evidenceReplayRef: `pap-replay://entry-criterion/${ev.criterionId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  for (const dec of decisionsEval) {
    if (dec.status === "PENDING_SIGNOFF") {
      findings.push({
        findingId: `pap-open-decision-${dec.decisionId}`,
        category: "ALPHA_OPEN_DECISION_PENDING_SIGNOFF",
        doctrineSectionRef: "§9",
        topic: `Open decision pending sign-off: ${dec.doctrineLabel}`,
        reviewerExplanation:
          "Doctrine status is PROPOSED. Alpha entry remains PENDING_SIGNOFF until each §9 decision carries a recorded value, recorded_by (named governance authority), and recorded_at timestamp.",
        evidenceReplayRef: `pap-replay://open-decision/${dec.decisionId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  return findings;
}

function buildCrossSourceConflicts(
  onCoverage: PublicAlphaCapabilityCoverage[],
  offCoverage: PublicAlphaBlockedCapabilityCoverage[],
  entryEval: PublicAlphaEntryCriterionEvaluation[],
  decisionsEval: PublicAlphaOpenDecisionEvaluation[]
): PublicAlphaProfileCrossSourceConflict[] {
  const conflicts: PublicAlphaProfileCrossSourceConflict[] = [];
  if (onCoverage.some((c) => c.status === "FAIL")) {
    conflicts.push({
      conflictId: "pap-v1-on-capability-fail",
      topic: "Alpha §3 ON capability not covered by a passing module",
      description: `${onCoverage.filter((c) => c.status === "FAIL").length} ON capability(ies) lack a passing module verdict. Alpha entry blocked.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (offCoverage.some((c) => c.status === "FAIL")) {
    conflicts.push({
      conflictId: "pap-v1-off-block-fail",
      topic: "Alpha §4 OFF capability block not enforced",
      description: `${offCoverage.filter((c) => c.status === "FAIL").length} OFF capability(ies) have a guarding module with blocks_enforced FAIL. Alpha entry blocked.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const entryFail = entryEval.filter((e) => e.status === "FAIL");
  const entryPending = entryEval.filter((e) => e.status === "PENDING_SIGNOFF");
  if (entryFail.length > 0 || entryPending.length > 0) {
    conflicts.push({
      conflictId: "pap-v1-entry-criteria-unmet",
      topic: "Alpha §6 entry criteria not met",
      description: `${entryFail.length} entry criterion(a) FAIL and ${entryPending.length} PENDING_SIGNOFF. Alpha entry blocked until cleared.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const decisionsPending = decisionsEval.filter(
    (d) => d.status === "PENDING_SIGNOFF"
  );
  if (decisionsPending.length > 0) {
    conflicts.push({
      conflictId: "pap-v1-open-decisions-pending",
      topic: "Alpha §9 open decisions pending sign-off",
      description: `${decisionsPending.length} of ${decisionsEval.length} §9 open decisions are PENDING_SIGNOFF. Doctrine status PROPOSED; Alpha entry blocked until each decision is recorded by the named governance authority.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  return conflicts;
}

// =============================================================================
// Signals
// =============================================================================

const V1_SIGNAL_IDS: readonly PublicAlphaProfileSignalId[] = [
  "alpha_on_capability_coverage_alignment",
  "alpha_off_capability_block_alignment",
  "alpha_entry_criteria_alignment",
  "alpha_open_decisions_signoff_alignment",
];

const V1_SIGNAL_LABELS: Record<PublicAlphaProfileSignalId, string> = {
  alpha_on_capability_coverage_alignment:
    "§3 ON capability coverage alignment",
  alpha_off_capability_block_alignment: "§4 OFF capability block alignment",
  alpha_entry_criteria_alignment: "§6 entry criteria alignment",
  alpha_open_decisions_signoff_alignment:
    "§9 open decisions sign-off alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "alpha entry authorization",
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
  id: PublicAlphaProfileSignalId,
  onCoverage: PublicAlphaCapabilityCoverage[],
  offCoverage: PublicAlphaBlockedCapabilityCoverage[],
  entryEval: PublicAlphaEntryCriterionEvaluation[],
  decisionsEval: PublicAlphaOpenDecisionEvaluation[]
): PublicAlphaProfileSignal {
  let satisfied = 0;
  let total = 0;
  const reviewSignals: string[] = [];
  switch (id) {
    case "alpha_on_capability_coverage_alignment":
      total = onCoverage.length;
      satisfied = onCoverage.filter((c) => c.status === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} ON capabilities have at least one passing covering module`
      );
      break;
    case "alpha_off_capability_block_alignment":
      total = offCoverage.length;
      satisfied = offCoverage.filter(
        (c) => c.status === "BLOCKED_BY_DESIGN" || c.status === "PASS"
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} OFF capabilities are BLOCKED_BY_DESIGN or PASS`
      );
      break;
    case "alpha_entry_criteria_alignment":
      total = entryEval.length;
      satisfied = entryEval.filter((e) => e.status === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} §6 entry criteria are PASS`
      );
      break;
    case "alpha_open_decisions_signoff_alignment":
      total = decisionsEval.length;
      satisfied = decisionsEval.filter((d) => d.status === "RECORDED").length;
      reviewSignals.push(
        `${satisfied} of ${total} §9 open decisions are RECORDED`
      );
      break;
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

export function composePublicAlphaProfile(
  input: PublicAlphaProfileInput = {}
): PublicAlphaProfileResult {
  // 1. Compose Build Self-Report v1 (the underlying audit).
  const selfReport = composeBuildSelfReport(input.selfReportInput ?? {});

  // 2. Build the Alpha-required row subset from the §3 ON patterns.
  const allOnPatterns = PUBLIC_ALPHA_ON_CAPABILITIES.flatMap(
    (c) => c.moduleIdPatterns
  );
  const alphaSetRows = selfReport.modules.filter((row) =>
    allOnPatterns.some((re) => re.test(row.module_id))
  );

  // 3. §3 ON coverage + §4 OFF coverage.
  const onCoverage = evaluateOnCapabilities(selfReport.modules);
  const offCoverage = evaluateOffCapabilities(selfReport.modules);

  // 4. §6 entry criteria + §7 exit criteria + §9 open decisions.
  const signoffs = input.decisionSignoffs ?? [];
  const decisionsEval = evaluateOpenDecisions(signoffs);
  // Detect a signed-terms decision or DR-restore decision via
  // metadata so the entry criteria evaluator has something to read.
  const signedTermsRecorded = signoffs.some(
    (s) => s.decisionId === "named_governance_authority" && s.recorded_value
  );
  const drRestoreRecorded = signoffs.some(
    (s) => s.decisionId === "cohort_size" && s.recorded_value
  );
  const entryCriteriaEvaluation = evaluateEntryCriteria(
    selfReport,
    onCoverage,
    alphaSetRows,
    signedTermsRecorded,
    drRestoreRecorded
  );
  const exitCriteriaEvaluation = evaluateExitCriteria();

  // 5. Findings + cross-source conflicts.
  const findings = buildFindings(
    onCoverage,
    offCoverage,
    entryCriteriaEvaluation,
    decisionsEval
  );
  const crossSourceConflicts = buildCrossSourceConflicts(
    onCoverage,
    offCoverage,
    entryCriteriaEvaluation,
    decisionsEval
  );

  // 6. Signals.
  const v1Signals: PublicAlphaProfileSignal[] = V1_SIGNAL_IDS.map((id) =>
    buildSignal(
      id,
      onCoverage,
      offCoverage,
      entryCriteriaEvaluation,
      decisionsEval
    )
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

  // 7. Aggregate alpha_entry_allowed.
  // Doctrine: until every §9 decision is signed off, alpha_entry_allowed
  // is PENDING_SIGNOFF. If any §3 ON or §4 OFF or §6 entry criterion is
  // FAIL, alpha_entry_allowed is FAIL. Otherwise PASS.
  let alphaEntryAllowed: PublicAlphaStatus;
  const anyFail =
    onCoverage.some((c) => c.status === "FAIL") ||
    offCoverage.some((c) => c.status === "FAIL") ||
    entryCriteriaEvaluation.some((e) => e.status === "FAIL");
  const anyPending =
    decisionsEval.some((d) => d.status === "PENDING_SIGNOFF") ||
    entryCriteriaEvaluation.some((e) => e.status === "PENDING_SIGNOFF");
  if (anyFail) {
    alphaEntryAllowed = "FAIL";
  } else if (anyPending) {
    alphaEntryAllowed = "PENDING_SIGNOFF";
  } else {
    alphaEntryAllowed = "PASS";
  }

  const summary: PublicAlphaProfileSummary = {
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
    onCapabilityCount: onCoverage.length,
    onCapabilitiesPass: onCoverage.filter((c) => c.status === "PASS").length,
    onCapabilitiesFail: onCoverage.filter((c) => c.status === "FAIL").length,
    offCapabilityCount: offCoverage.length,
    offCapabilitiesPassOrBlockedByDesign: offCoverage.filter(
      (c) => c.status === "BLOCKED_BY_DESIGN" || c.status === "PASS"
    ).length,
    offCapabilitiesUnenforced: offCoverage.filter((c) => c.status === "FAIL")
      .length,
    entryCriterionCount: entryCriteriaEvaluation.length,
    entryCriteriaPass: entryCriteriaEvaluation.filter(
      (e) => e.status === "PASS"
    ).length,
    entryCriteriaFail: entryCriteriaEvaluation.filter(
      (e) => e.status === "FAIL"
    ).length,
    entryCriteriaPendingSignoff: entryCriteriaEvaluation.filter(
      (e) => e.status === "PENDING_SIGNOFF"
    ).length,
    exitCriterionCount: exitCriteriaEvaluation.length,
    openDecisionCount: decisionsEval.length,
    openDecisionsRecorded: decisionsEval.filter((d) => d.status === "RECORDED")
      .length,
    openDecisionsPendingSignoff: decisionsEval.filter(
      (d) => d.status === "PENDING_SIGNOFF"
    ).length,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/build-self-report",
    "/governance/data-transparency-posture",
    "/build-preservation",
    "/governance/evidence-resolution-workflow",
    "/governance/document-evidence-reconciliation",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
  ]);

  return {
    runtimeVersion: PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
    definitionVersion: PUBLIC_ALPHA_DEFINITION_VERSION,
    definitionDocRef: PUBLIC_ALPHA_DEFINITION_DOC_REF,
    generatedAt: selfReport.generatedAt,
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    buildSelfReportRuntimeVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
    buildSelfReportExitCode: selfReport.header.exit_code,
    buildSelfReportSummaryHandle: selfReport.summary,
    onCapabilityCoverage: onCoverage,
    offCapabilityCoverage: offCoverage,
    entryCriteriaEvaluation,
    exitCriteriaEvaluation,
    openDecisionsEvaluation: decisionsEval,
    alphaEntryAllowed,
    summary,
    v1Signals,
    findings,
    crossSourceConflicts,
    recommendedReviewRoutes,
    disclosures: [...PUBLIC_ALPHA_PROFILE_DISCLOSURES],
    productionRestrictions: [...PUBLIC_ALPHA_PROFILE_PRODUCTION_RESTRICTIONS],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    publicAlphaProfileInternalOnly: true,
    noAlphaEntryAuthorization: true,
    noInformationSale: true,
    noSilentSubmission: true,
    noSecretDistribution: true,
    noMarketingLead: true,
    noFraudAccusation: true,
    noDenial: true,
    noRejection: true,
    noApproval: true,
    noPreapproval: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function publicAlphaProfileLineage(): {
  runtimeVersion: string;
  definitionVersion: string;
  definitionDocRef: string;
  onCapabilityCount: number;
  offCapabilityCount: number;
  entryCriterionCount: number;
  exitCriterionCount: number;
  openDecisionCount: number;
  buildSelfReportRuntimeVersion: string;
} {
  return {
    runtimeVersion: PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
    definitionVersion: PUBLIC_ALPHA_DEFINITION_VERSION,
    definitionDocRef: PUBLIC_ALPHA_DEFINITION_DOC_REF,
    onCapabilityCount: PUBLIC_ALPHA_ON_CAPABILITIES.length,
    offCapabilityCount: PUBLIC_ALPHA_OFF_CAPABILITIES.length,
    entryCriterionCount: PUBLIC_ALPHA_ENTRY_CRITERIA.length,
    exitCriterionCount: PUBLIC_ALPHA_EXIT_CRITERIA.length,
    openDecisionCount: PUBLIC_ALPHA_OPEN_DECISIONS.length,
    buildSelfReportRuntimeVersion: BUILD_SELF_REPORT_RUNTIME_VERSION,
  };
}

export const PUBLIC_ALPHA_PROFILE_SIGNAL_IDS = V1_SIGNAL_IDS;
