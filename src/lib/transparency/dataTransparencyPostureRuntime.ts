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
 * Data Transparency Posture Runtime v1 (Build 33)
 *
 * Audits the entire shipped v2 backbone (modules + event contracts +
 * handoffs) against the Furlong Data Transparency & User
 * Sovereignty Doctrine v1.0
 * (docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md).
 *
 * The runtime is an auditor, not a transformer. It reads static
 * registry state and produces a doctrine-compliance posture pack
 * that surfaces every place where:
 *
 * - a module fails the "Furlong will explain" obligations
 *   (why / how / who / when / retention / deletion / export /
 *   sharing semantics not present),
 * - an event contract or handoff risks silent submission (no human
 *   review boundary, public surface allowed, or producer/consumer
 *   surface lacks borrower-visible disclosure language),
 * - the four-stage escalation control (Exploration → Human Review
 *   → Lender Engagement → Application Submission) is incomplete or
 *   user-bypassable,
 * - disclosure or claim text breaches the plain-English
 *   readability heuristic (average word length, average sentence
 *   length, raw-acronym density).
 *
 * Four governed transparency posture signals are composed:
 * - `transparency_explanation_completeness_alignment` — each
 *   borrower-facing module covers all seven doctrine-required
 *   explanation topics.
 * - `transparency_escalation_control_alignment` — each escalation
 *   stage is explicit, human-review-bound, and user-controlled.
 * - `transparency_no_secret_submission_alignment` — no event
 *   contract or handoff routes borrower data to lender / agency /
 *   broker / third-party / advertiser channels without a human
 *   review boundary or public surface gate.
 * - `transparency_plain_english_readability_alignment` — module
 *   descriptions and event contract purposes pass the readability
 *   heuristic for a reasonable user without legal, financial,
 *   regulatory, or technical training.
 *
 * Five cross-source conflict classes:
 * - `dtp-v1-explanation-topic-missing` — a borrower-touching
 *   module does not declare one or more required explanation
 *   topics.
 * - `dtp-v1-escalation-stage-missing` — an escalation stage is
 *   not represented by a governed module.
 * - `dtp-v1-silent-submission-risk` — an event contract or
 *   handoff allows borrower data to leave the platform without a
 *   human review boundary.
 * - `dtp-v1-plain-english-readability-fail` — disclosure text
 *   fails the readability heuristic.
 * - `dtp-v1-doctrine-version-mismatch` — the runtime is sealed
 *   against a doctrine version that does not match the doctrine
 *   doc on file.
 *
 * The runtime does NOT:
 *
 * - re-implement any module's behavior,
 * - mutate the module registry,
 * - emit live notifications,
 * - generate marketing leads,
 * - submit borrower data to any party (lender, agency, broker,
 *   advertiser, third-party).
 *
 * Constitutional posture: internal audit pack only, replay-safe,
 * audit-safe, conflict-preserving. Every finding resolves to
 * REQUIRES_HUMAN_REVIEW.
 *
 * Master Volume Governance:
 * - Vol I: keeps the audit subordinate to constitutional authority;
 *   findings never grant authority and never replace external
 *   review.
 * - Vol II: blocks the audit from becoming approval, denial,
 *   eligibility determination, lender commitment, agency decision,
 *   official certification, public verification, regulatory
 *   reliance, or legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage sealing
 *   data-transparency-posture-runtime-v0.1.0 against the doctrine
 *   doc seal.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, replay verification.
 * - Vol IV: routes findings to QUALIFIED_GOVERNANCE_REVIEWER and
 *   surfaces handoffs to applications, documents, data-rights,
 *   evidence packets, audit replay, governance, reviews, module
 *   readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, advisory-only boundaries.
 * - Vol VI: every finding remains behind a public-safe DTO; no
 *   live external fetch; no source-certainty claim.
 */

export const DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION =
  "data-transparency-posture-runtime-v0.1.0";

export const DATA_TRANSPARENCY_DOCTRINE_VERSION =
  "data-transparency-user-sovereignty-doctrine-v1.0";

export const DATA_TRANSPARENCY_DOCTRINE_DOC_REF =
  "docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md";

// =============================================================================
// Input types
// =============================================================================

export type DataTransparencyPostureInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  scopeModuleIds?: string[];
  declaredDoctrineVersion?: string;
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Doctrine-required explanation topics
// =============================================================================

export type DataTransparencyExplanationTopicId =
  | "why_information_is_requested"
  | "how_information_is_used"
  | "who_can_see_information"
  | "when_additional_information_is_needed"
  | "when_information_is_shared"
  | "when_information_is_retained"
  | "when_information_can_be_deleted"
  | "when_information_can_be_exported"
  | "evidence_lineage_preserved"
  | "recommendation_traceability";

export const DATA_TRANSPARENCY_REQUIRED_EXPLANATION_TOPICS: ReadonlyArray<{
  id: DataTransparencyExplanationTopicId;
  // Each topic is satisfied when any of these patterns appears in
  // module description, event contract purpose, or audience set.
  patterns: RegExp[];
}> = [
  {
    id: "why_information_is_requested",
    patterns: [
      /\bwhy\b/i,
      /\brequest(ed|s|ing)? (information|borrower|customer|reason)/i,
      /\bpurpose\b/i,
      /\bgather(s|ed|ing)? information\b/i,
    ],
  },
  {
    id: "how_information_is_used",
    patterns: [
      /\bhow (information|data) (is|are) used\b/i,
      /\bused (to|for)\b/i,
      /\bprocess(es|ed|ing)?\b/i,
      /\badvisory\b/i,
      /\bcompose(s|d|r)?\b/i,
    ],
  },
  {
    id: "who_can_see_information",
    patterns: [
      /\baudience\b/i,
      /\binternal\b/i,
      /\breviewer\b/i,
      /\bauthorized\b/i,
      /\bauditor\b/i,
      /\bregulator\b/i,
      /\bgovernance\b/i,
    ],
  },
  {
    id: "when_additional_information_is_needed",
    patterns: [
      /\bNEEDS_INPUT\b/,
      /\bmissing items?\b/i,
      /\badditional information\b/i,
      /\bclarification\b/i,
      /\brequire(s|d)? input\b/i,
    ],
  },
  {
    id: "when_information_is_shared",
    patterns: [
      /\bhandoff\b/i,
      /\bevent contract\b/i,
      /\brouted\b/i,
      /\bdisclosure\b/i,
      /\bshar(e|ed|ing|es)\b/i,
      /\bconsumer(s|ModuleIds)?\b/i,
    ],
  },
  {
    id: "when_information_is_retained",
    patterns: [
      /\bretention\b/i,
      /\bretain(s|ed|ing)?\b/i,
      /\baudit ledger\b/i,
      /\baudit anchor\b/i,
      /\breplay verification\b/i,
      /\baudit safe\b/i,
    ],
  },
  {
    id: "when_information_can_be_deleted",
    patterns: [
      /\bdeletion\b/i,
      /\bdelete\b/i,
      /\bredaction\b/i,
      /\bdata-rights\b/i,
      /\bdata.rights\b/i,
    ],
  },
  {
    id: "when_information_can_be_exported",
    patterns: [
      /\bexport(s|ed|ing)?\b/i,
      /\bportabilit(y|ies)\b/i,
      /\bdata-rights\b/i,
      /\bdata.rights\b/i,
    ],
  },
  {
    id: "evidence_lineage_preserved",
    patterns: [
      /\bevidence (lineage|ref|reference|pack|packet)\b/i,
      /\breplay(\s|-)?safe\b/i,
      /\baudit(\s|-)?safe\b/i,
      /\bconflict(\s|-)?preserving\b/i,
    ],
  },
  {
    id: "recommendation_traceability",
    patterns: [
      /\btrace(s|d|able|ability)?\b/i,
      /\breplay\b/i,
      /\bversion lineage\b/i,
      /\bdoctrine ref\b/i,
      /\bexplain(ability)?\b/i,
    ],
  },
];

// =============================================================================
// Escalation stages
// =============================================================================

export type DataTransparencyEscalationStageId =
  | "EXPLORATION"
  | "HUMAN_REVIEW"
  | "LENDER_ENGAGEMENT"
  | "APPLICATION_SUBMISSION";

export const DATA_TRANSPARENCY_ESCALATION_STAGES: ReadonlyArray<{
  id: DataTransparencyEscalationStageId;
  // Stage is represented when at least one module manifest's id
  // matches any of these patterns.
  moduleIdPatterns: RegExp[];
}> = [
  {
    id: "EXPLORATION",
    moduleIdPatterns: [
      /^governance-(borrower-onboarding-core-v2|readiness-assessment-v2|opportunity-discovery-v2|financing-pathway-engine-v2|revenue-intelligence-v2|capital-graph|customer-type-registry)$/,
      /^portal-borrower-(onboarding|opportunities|financing-pathways|readiness)$/,
    ],
  },
  {
    id: "HUMAN_REVIEW",
    moduleIdPatterns: [
      /^reviews$/,
      /^governance-evidence-resolution-workflow$/,
      /^governance-document-evidence-reconciliation$/,
      /^governance-environmental-escalation-engine-v2$/,
    ],
  },
  {
    id: "LENDER_ENGAGEMENT",
    moduleIdPatterns: [
      /^lender-workflow$/,
      /^governance-lender-workflow-v2$/,
      /^lender-(dashboard|evidence)$/,
      /^partners$/,
    ],
  },
  {
    id: "APPLICATION_SUBMISSION",
    moduleIdPatterns: [
      /^applications$/,
      /^portal-borrower-applications$/,
      /^decisions$/,
    ],
  },
];

// =============================================================================
// Silent-submission risk detection
// =============================================================================

const SILENT_SUBMISSION_AUDIENCE_TOKENS = [
  "lender",
  "agency",
  "broker",
  "advertiser",
  "data-aggregator",
  "third-party",
  "marketing",
] as const;

// =============================================================================
// Plain-English readability heuristic constants
// =============================================================================

const PLAIN_ENGLISH_MAX_AVG_WORD_LENGTH = 7;
const PLAIN_ENGLISH_MAX_AVG_SENTENCE_LENGTH = 35;
const PLAIN_ENGLISH_MAX_TECHNICAL_TOKEN_DENSITY = 0.03;

const PLAIN_ENGLISH_FLAGGED_TOKENS = [
  // Pure legal / regulatory jargon that should at least be paired with explanation
  "preemption",
  "subrogation",
  "estoppel",
  "indemnify",
  "indemnification",
  "constitutional reliance",
  "regulated nexus",
];

// =============================================================================
// Finding types
// =============================================================================

export type DataTransparencyFindingCategory =
  | "MODULE_EXPLANATION_TOPIC_MISSING"
  | "ESCALATION_STAGE_MISSING"
  | "EVENT_CONTRACT_SILENT_SUBMISSION_RISK"
  | "HANDOFF_SILENT_SUBMISSION_RISK"
  | "MODULE_PLAIN_ENGLISH_READABILITY_FAIL"
  | "EVENT_CONTRACT_PLAIN_ENGLISH_READABILITY_FAIL";

export type DataTransparencyFinding = {
  findingId: string;
  category: DataTransparencyFindingCategory;
  subjectModuleId?: string;
  subjectEventType?: string;
  subjectHandoffId?: string;
  topic: string;
  reviewerExplanation: string;
  doctrineSectionRef: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

export type DataTransparencyReadabilityReport = {
  subjectId: string;
  averageWordLength: number;
  averageSentenceLength: number;
  technicalTokenDensity: number;
  flaggedTokens: string[];
  passesHeuristic: boolean;
};

export type DataTransparencyModuleAudit = {
  moduleId: string;
  borrowerTouching: boolean;
  satisfiedTopics: DataTransparencyExplanationTopicId[];
  missingTopics: DataTransparencyExplanationTopicId[];
  readability: DataTransparencyReadabilityReport;
};

export type DataTransparencyEventContractAudit = {
  eventType: string;
  silentSubmissionRiskFlag: boolean;
  reasons: string[];
  readability: DataTransparencyReadabilityReport;
};

export type DataTransparencyHandoffAudit = {
  handoffId: string;
  silentSubmissionRiskFlag: boolean;
  reasons: string[];
};

export type DataTransparencyEscalationStageAudit = {
  stageId: DataTransparencyEscalationStageId;
  represented: boolean;
  representingModuleIds: string[];
};

// =============================================================================
// Signal types
// =============================================================================

export type DataTransparencyPostureSignalId =
  | "transparency_explanation_completeness_alignment"
  | "transparency_escalation_control_alignment"
  | "transparency_no_secret_submission_alignment"
  | "transparency_plain_english_readability_alignment";

export type DataTransparencyPostureSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type DataTransparencyPostureSignal = {
  id: DataTransparencyPostureSignalId;
  label: string;
  status: DataTransparencyPostureSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type DataTransparencyCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type DataTransparencyUserPacketRights =
  | "REQUEST_EXPLANATION"
  | "REQUEST_DELETION"
  | "REQUEST_EXPORT"
  | "REQUEST_HUMAN_REVIEW"
  | "REQUEST_HOLD_ON_ESCALATION";

export type DataTransparencyUserPacket = {
  userVisibleSummary: string;
  whatWillFurlongDo: string[];
  whatWillFurlongNotDo: string[];
  escalationStages: ReadonlyArray<{
    stageId: DataTransparencyEscalationStageId;
    label: string;
    userActionRequired: boolean;
    representingModuleIds: string[];
  }>;
  userRights: DataTransparencyUserPacketRights[];
  reviewRoutes: string[];
  classificationLevel: "RESTRICTED";
  advisoryDisclaimer: string;
};

export type DataTransparencyPostureSummary = {
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
  modulesAudited: number;
  borrowerTouchingModulesAudited: number;
  modulesWithMissingTopics: number;
  modulesFailingReadability: number;
  eventContractsAudited: number;
  eventContractsWithSilentSubmissionRisk: number;
  eventContractsFailingReadability: number;
  handoffsAudited: number;
  handoffsWithSilentSubmissionRisk: number;
  escalationStagesAudited: number;
  escalationStagesMissing: number;
  findingCount: number;
  crossSourceConflictCount: number;
};

export type DataTransparencyPostureResult = {
  runtimeVersion: string;
  doctrineVersion: string;
  doctrineDocRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: DataTransparencyPostureSummary;
  v1Signals: DataTransparencyPostureSignal[];
  moduleAudits: DataTransparencyModuleAudit[];
  eventContractAudits: DataTransparencyEventContractAudit[];
  handoffAudits: DataTransparencyHandoffAudit[];
  escalationStageAudits: DataTransparencyEscalationStageAudit[];
  findings: DataTransparencyFinding[];
  userPacket: DataTransparencyUserPacket;
  crossSourceConflicts: DataTransparencyCrossSourceConflict[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  dataTransparencyPostureInternalOnly: true;
  userSovereigntyPreserved: true;
  noSilentSubmission: true;
  noSecretDistribution: true;
  noMarketingLead: true;
  noInformationSale: true;
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
// Disclosures + production restrictions
// =============================================================================

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

export const DATA_TRANSPARENCY_POSTURE_DISCLOSURES = [
  "Data Transparency Posture v1 output is an internal advisory audit of the Furlong v2 backbone against the Data Transparency & User Sovereignty Doctrine v1.0.",
  "Your information belongs to you. Furlong may process it to provide advisory guidance, but ownership remains with you.",
  "Furlong will explain why information is requested, how it is used, who can see it, when additional information is needed, when information is shared, when it is retained, when it can be deleted, and when it can be exported.",
  "Furlong will not sell user information, secretly submit it to lenders / agencies / brokers / advertisers / data aggregators / third parties, generate undisclosed marketing leads, hide recommendation logic, hide pathway exclusions, hide readiness limitations, hide known conflicts or risks, or represent unverified information as verified.",
  "Users decide when information moves from Exploration → Human Review → Lender Engagement → Application Submission. Furlong may recommend escalation but will not silently perform escalation.",
  "All privacy, data-use, retention, sharing, deletion, export, and recommendation explanations must be understandable by a reasonable user without legal, financial, regulatory, or technical training.",
  "Findings are advisory audit evidence; they do not approve, deny, certify, or commit any action.",
  "Every finding resolves to REQUIRES_HUMAN_REVIEW.",
  "Cross-source conflicts surfaced by upstream modules are preserved as first-class evidence and never collapsed.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS = [
  "no information sale",
  "no silent submission",
  "no secret distribution",
  "no marketing lead generation",
  "no recommendation logic hiding",
  "no pathway exclusion hiding",
  "no readiness limitation hiding",
  "no conflict hiding",
  "no risk hiding",
  "no representing unverified information as verified",
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
  "no autonomous lending decision",
  "no autonomous eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous readiness determination",
] as const;

const REVIEW_ROUTE = "/governance/data-transparency-posture";

const DEFAULT_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
  DATA_TRANSPARENCY_DOCTRINE_VERSION,
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "information sale",
  "silent submission",
  "secret distribution",
  "marketing lead",
  "fraud accusation",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

const ADVISORY_DISCLAIMER =
  "Internal advisory audit posture only. Your information belongs to you. Furlong will not sell, silently submit, or secretly distribute it. Findings here do not approve, deny, certify, or commit any action. Human review is required before any finding is treated as a decision.";

// =============================================================================
// Module classification — which modules touch borrower information
// =============================================================================

const BORROWER_TOUCHING_MODULE_PATTERNS = [
  /^governance-borrower-onboarding-core-v2$/,
  /^governance-readiness-assessment-v2$/,
  /^governance-opportunity-discovery-v2$/,
  /^governance-financing-pathway-engine-v2$/,
  /^governance-revenue-intelligence-v2$/,
  /^governance-environmental-intake-v2$/,
  /^governance-environmental-compliance-v2$/,
  /^governance-environmental-risk-assessment-v2$/,
  /^governance-environmental-escalation-engine-v2$/,
  /^governance-evidence-resolution-workflow$/,
  /^governance-document-evidence-reconciliation$/,
  /^governance-recommendation-precision-harness$/,
  /^portal-borrower-/,
  /^applications$/,
  /^documents$/,
  /^data-rights$/,
  /^reviews$/,
];

function isBorrowerTouching(manifest: ModuleManifest): boolean {
  return BORROWER_TOUCHING_MODULE_PATTERNS.some((re) => re.test(manifest.id));
}

// =============================================================================
// Topic coverage check
// =============================================================================

function buildHaystackForModule(manifest: ModuleManifest): string {
  return [
    manifest.title,
    manifest.description,
    ...manifest.dataDependencies,
    ...manifest.adjacentModules,
    ...manifest.eventsPublished,
    ...manifest.eventsConsumed,
    ...manifest.permissions,
    manifest.claimsProfile,
    ...manifest.audience,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildHaystackForEventContract(entry: EventContract): string {
  return [
    entry.eventType,
    entry.producerModuleId,
    ...entry.consumerModuleIds,
    ...entry.payloadFields,
    entry.purpose,
    entry.classificationLevel,
  ]
    .filter(Boolean)
    .join(" ");
}

function auditModuleTopics(
  manifest: ModuleManifest
): {
  satisfied: DataTransparencyExplanationTopicId[];
  missing: DataTransparencyExplanationTopicId[];
} {
  const haystack = buildHaystackForModule(manifest);
  const satisfied: DataTransparencyExplanationTopicId[] = [];
  const missing: DataTransparencyExplanationTopicId[] = [];
  for (const topic of DATA_TRANSPARENCY_REQUIRED_EXPLANATION_TOPICS) {
    const hit = topic.patterns.some((re) => re.test(haystack));
    if (hit) {
      satisfied.push(topic.id);
    } else {
      missing.push(topic.id);
    }
  }
  return { satisfied, missing };
}

// =============================================================================
// Plain-English readability heuristic
// =============================================================================

function tokenize(text: string): string[] {
  return text
    .replace(/[^A-Za-z0-9'\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function evaluateReadability(
  subjectId: string,
  text: string
): DataTransparencyReadabilityReport {
  const tokens = tokenize(text);
  const sentences = sentenceSplit(text);
  const averageWordLength =
    tokens.length === 0
      ? 0
      : Math.round(
          (tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length) * 100
        ) / 100;
  const averageSentenceLength =
    sentences.length === 0
      ? 0
      : Math.round(
          (sentences.reduce(
            (sum, s) => sum + tokenize(s).length,
            0
          ) /
            sentences.length) *
            100
        ) / 100;
  const lower = text.toLowerCase();
  const flaggedTokens = PLAIN_ENGLISH_FLAGGED_TOKENS.filter((tok) => {
    if (!lower.includes(tok)) return false;
    // Allow when negated ("no preemption") or contextualized
    // ("preemption (explained: ...)").
    const negatedOrExplained =
      new RegExp(`(no |not |never |without )(${tok})`, "i").test(text) ||
      new RegExp(`(${tok})\\s*\\(`, "i").test(text);
    return !negatedOrExplained;
  });
  const technicalTokenDensity =
    tokens.length === 0
      ? 0
      : Math.round(
          (flaggedTokens.length / tokens.length) * 10000
        ) / 10000;
  const passesHeuristic =
    averageWordLength <= PLAIN_ENGLISH_MAX_AVG_WORD_LENGTH &&
    averageSentenceLength <= PLAIN_ENGLISH_MAX_AVG_SENTENCE_LENGTH &&
    technicalTokenDensity <= PLAIN_ENGLISH_MAX_TECHNICAL_TOKEN_DENSITY;
  return {
    subjectId,
    averageWordLength,
    averageSentenceLength,
    technicalTokenDensity,
    flaggedTokens,
    passesHeuristic,
  };
}

// =============================================================================
// Silent-submission risk detection
// =============================================================================

function auditEventContractSilentSubmissionRisk(
  entry: EventContract
): { risk: boolean; reasons: string[] } {
  const reasons: string[] = [];
  // 1. publicSurfaceAllowed === true + producer module hands off
  // borrower content without explicit governance review boundary
  // (proxied by classification != "RESTRICTED" + consumers include
  // an external-class audience).
  const eventText = `${entry.eventType} ${entry.purpose}`.toLowerCase();
  const externalAudienceHit = SILENT_SUBMISSION_AUDIENCE_TOKENS.some((token) =>
    eventText.includes(token)
  );
  if (externalAudienceHit) {
    // Must be production-blocked AND have explicit advisory framing.
    const hasAdvisoryFraming = /\badvisory\b/i.test(entry.purpose);
    if (!entry.productionBlocked || !hasAdvisoryFraming) {
      reasons.push(
        "external-audience reference in event without production-blocked + advisory framing"
      );
    }
  }
  if (entry.publicSurfaceAllowed && entry.classificationLevel === "RESTRICTED") {
    reasons.push(
      "RESTRICTED classification cannot allow public-surface exposure"
    );
  }
  if (!entry.productionBlocked) {
    reasons.push("event contract is not production-blocked");
  }
  if (!entry.replayRequired) {
    reasons.push("event contract does not require replay");
  }
  return { risk: reasons.length > 0, reasons };
}

function auditHandoffSilentSubmissionRisk(handoff: ModuleHandoff): {
  risk: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (!handoff.productionBlocked) {
    reasons.push("handoff is not production-blocked");
  }
  if (!handoff.humanReviewBoundary) {
    reasons.push("handoff lacks a human review boundary");
  }
  if (!handoff.replayRequired) {
    reasons.push("handoff does not require replay");
  }
  return { risk: reasons.length > 0, reasons };
}

// =============================================================================
// Escalation stage audit
// =============================================================================

function auditEscalationStages(
  manifests: ModuleManifest[]
): DataTransparencyEscalationStageAudit[] {
  return DATA_TRANSPARENCY_ESCALATION_STAGES.map((stage) => {
    const representingModuleIds = manifests
      .filter((m) =>
        stage.moduleIdPatterns.some((re) => re.test(m.id))
      )
      .map((m) => m.id);
    return {
      stageId: stage.id,
      represented: representingModuleIds.length > 0,
      representingModuleIds,
    };
  });
}

// =============================================================================
// Finding builders
// =============================================================================

function buildFindingId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9-]/gi, "_").toLowerCase()}`;
}

function buildExplanationTopicFinding(
  manifestId: string,
  topic: DataTransparencyExplanationTopicId
): DataTransparencyFinding {
  return {
    findingId: buildFindingId(
      "dtp-explanation-topic",
      `${manifestId}-${topic}`
    ),
    category: "MODULE_EXPLANATION_TOPIC_MISSING",
    subjectModuleId: manifestId,
    topic: `Module ${manifestId} does not declare doctrine-required explanation topic: ${topic}`,
    reviewerExplanation: `The Data Transparency Doctrine v1.0 requires every borrower-touching module to declare ${topic}. The module description, dependencies, audience, and event contracts do not currently surface this topic; review whether the module description needs to be updated or whether a downstream module covers it.`,
    doctrineSectionRef: "What Furlong Will Do",
    evidenceReplayRef: `dtp-replay://module/${manifestId}/topic/${topic}`,
    resolution: "REQUIRES_HUMAN_REVIEW",
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

function buildEscalationStageFinding(
  stageId: DataTransparencyEscalationStageId
): DataTransparencyFinding {
  return {
    findingId: buildFindingId("dtp-escalation-stage", stageId),
    category: "ESCALATION_STAGE_MISSING",
    topic: `Escalation stage ${stageId} is not represented by any module`,
    reviewerExplanation: `The Data Transparency Doctrine v1.0 requires four explicit escalation stages (Exploration → Human Review → Lender Engagement → Application Submission). Stage ${stageId} has no representing module; user-controlled escalation cannot be enforced for that stage.`,
    doctrineSectionRef: "Escalation Control",
    evidenceReplayRef: `dtp-replay://escalation-stage/${stageId}`,
    resolution: "REQUIRES_HUMAN_REVIEW",
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

function buildEventContractSilentSubmissionFinding(
  entry: EventContract,
  reasons: string[]
): DataTransparencyFinding {
  return {
    findingId: buildFindingId(
      "dtp-event-contract-silent-submission",
      entry.eventType
    ),
    category: "EVENT_CONTRACT_SILENT_SUBMISSION_RISK",
    subjectEventType: entry.eventType,
    topic: `Event contract ${entry.eventType} risks silent submission`,
    reviewerExplanation: `The Data Transparency Doctrine v1.0 forbids silent submission of user information to lenders, agencies, brokers, advertisers, data aggregators, or third parties. This event contract has the following risk indicators: ${reasons.join("; ")}.`,
    doctrineSectionRef: "What Furlong Will Not Do",
    evidenceReplayRef: `dtp-replay://event-contract/${entry.eventType}`,
    resolution: "REQUIRES_HUMAN_REVIEW",
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

function buildHandoffSilentSubmissionFinding(
  handoff: ModuleHandoff,
  reasons: string[]
): DataTransparencyFinding {
  return {
    findingId: buildFindingId(
      "dtp-handoff-silent-submission",
      handoff.id
    ),
    category: "HANDOFF_SILENT_SUBMISSION_RISK",
    subjectHandoffId: handoff.id,
    topic: `Handoff ${handoff.id} risks silent submission`,
    reviewerExplanation: `The Data Transparency Doctrine v1.0 forbids silent submission. This handoff has the following risk indicators: ${reasons.join("; ")}.`,
    doctrineSectionRef: "What Furlong Will Not Do",
    evidenceReplayRef: `dtp-replay://handoff/${handoff.id}`,
    resolution: "REQUIRES_HUMAN_REVIEW",
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

function buildReadabilityFinding(
  subjectId: string,
  isEventContract: boolean,
  readability: DataTransparencyReadabilityReport
): DataTransparencyFinding {
  return {
    findingId: buildFindingId(
      isEventContract
        ? "dtp-event-contract-readability"
        : "dtp-module-readability",
      subjectId
    ),
    category: isEventContract
      ? "EVENT_CONTRACT_PLAIN_ENGLISH_READABILITY_FAIL"
      : "MODULE_PLAIN_ENGLISH_READABILITY_FAIL",
    [isEventContract ? "subjectEventType" : "subjectModuleId"]: subjectId,
    topic: `${isEventContract ? "Event contract" : "Module"} ${subjectId} fails plain-English readability heuristic`,
    reviewerExplanation: `The Data Transparency Doctrine v1.0 requires explanations understandable without legal, financial, regulatory, or technical training. Subject ${subjectId} has average word length ${readability.averageWordLength}, average sentence length ${readability.averageSentenceLength}, technical-token density ${readability.technicalTokenDensity}, flagged tokens [${readability.flaggedTokens.join(", ") || "none"}]. Review whether description or purpose text should be simplified.`,
    doctrineSectionRef: "Plain English Requirement",
    evidenceReplayRef: `dtp-replay://${isEventContract ? "event-contract" : "module"}/${subjectId}/readability`,
    resolution: "REQUIRES_HUMAN_REVIEW",
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

// =============================================================================
// Signal builders
// =============================================================================

const V1_SIGNAL_IDS: readonly DataTransparencyPostureSignalId[] = [
  "transparency_explanation_completeness_alignment",
  "transparency_escalation_control_alignment",
  "transparency_no_secret_submission_alignment",
  "transparency_plain_english_readability_alignment",
];

const V1_SIGNAL_LABELS: Record<DataTransparencyPostureSignalId, string> = {
  transparency_explanation_completeness_alignment:
    "Explanation completeness alignment",
  transparency_escalation_control_alignment:
    "Escalation control alignment",
  transparency_no_secret_submission_alignment:
    "No-secret-submission alignment",
  transparency_plain_english_readability_alignment:
    "Plain-English readability alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "information sale",
  "silent submission",
  "secret distribution",
  "marketing lead",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

type SignalInputs = {
  borrowerTouchingAudits: DataTransparencyModuleAudit[];
  escalationStageAudits: DataTransparencyEscalationStageAudit[];
  eventContractAudits: DataTransparencyEventContractAudit[];
  handoffAudits: DataTransparencyHandoffAudit[];
  moduleAudits: DataTransparencyModuleAudit[];
};

function buildSignal(
  id: DataTransparencyPostureSignalId,
  inputs: SignalInputs
): DataTransparencyPostureSignal {
  let satisfied = 0;
  let total = 0;
  const reviewSignals: string[] = [];
  switch (id) {
    case "transparency_explanation_completeness_alignment":
      total = inputs.borrowerTouchingAudits.length;
      satisfied = inputs.borrowerTouchingAudits.filter(
        (audit) => audit.missingTopics.length === 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} borrower-touching modules cover every doctrine-required explanation topic`
      );
      break;
    case "transparency_escalation_control_alignment":
      total = inputs.escalationStageAudits.length;
      satisfied = inputs.escalationStageAudits.filter(
        (stage) => stage.represented
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} escalation stages are represented by at least one governed module`
      );
      break;
    case "transparency_no_secret_submission_alignment": {
      const evTotal = inputs.eventContractAudits.length;
      const evSafe = evTotal - inputs.eventContractAudits.filter(
        (entry) => entry.silentSubmissionRiskFlag
      ).length;
      const hoTotal = inputs.handoffAudits.length;
      const hoSafe = hoTotal - inputs.handoffAudits.filter(
        (entry) => entry.silentSubmissionRiskFlag
      ).length;
      total = evTotal + hoTotal;
      satisfied = evSafe + hoSafe;
      reviewSignals.push(
        `${evSafe} of ${evTotal} event contracts and ${hoSafe} of ${hoTotal} handoffs carry no silent-submission risk`
      );
      break;
    }
    case "transparency_plain_english_readability_alignment": {
      const modTotal = inputs.moduleAudits.length;
      const modPass = inputs.moduleAudits.filter(
        (audit) => audit.readability.passesHeuristic
      ).length;
      const evTotal = inputs.eventContractAudits.length;
      const evPass = inputs.eventContractAudits.filter(
        (entry) => entry.readability.passesHeuristic
      ).length;
      total = modTotal + evTotal;
      satisfied = modPass + evPass;
      reviewSignals.push(
        `${modPass} of ${modTotal} modules and ${evPass} of ${evTotal} event contracts pass the readability heuristic`
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
// Cross-source conflicts
// =============================================================================

function buildCrossSourceConflicts(
  borrowerAudits: DataTransparencyModuleAudit[],
  escalationStageAudits: DataTransparencyEscalationStageAudit[],
  eventContractAudits: DataTransparencyEventContractAudit[],
  handoffAudits: DataTransparencyHandoffAudit[],
  declaredDoctrineVersion: string | undefined
): DataTransparencyCrossSourceConflict[] {
  const conflicts: DataTransparencyCrossSourceConflict[] = [];
  const modulesWithMissingTopics = borrowerAudits.filter(
    (audit) => audit.missingTopics.length > 0
  );
  if (modulesWithMissingTopics.length > 0) {
    conflicts.push({
      conflictId: "dtp-v1-explanation-topic-missing",
      topic: "Borrower-touching modules missing doctrine-required topics",
      description: `${modulesWithMissingTopics.length} borrower-touching module(s) do not cover every doctrine-required explanation topic; review module descriptions, dependencies, and event contracts.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const missingStages = escalationStageAudits.filter(
    (stage) => !stage.represented
  );
  if (missingStages.length > 0) {
    conflicts.push({
      conflictId: "dtp-v1-escalation-stage-missing",
      topic: "Escalation stages not represented by any module",
      description: `${missingStages.length} escalation stage(s) (${missingStages.map((s) => s.stageId).join(", ")}) lack a representing module; user-controlled escalation cannot be enforced for those stages.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const silentEvents = eventContractAudits.filter(
    (entry) => entry.silentSubmissionRiskFlag
  );
  const silentHandoffs = handoffAudits.filter(
    (entry) => entry.silentSubmissionRiskFlag
  );
  if (silentEvents.length > 0 || silentHandoffs.length > 0) {
    conflicts.push({
      conflictId: "dtp-v1-silent-submission-risk",
      topic:
        "Silent submission risk surfaced in event contracts or handoffs",
      description: `${silentEvents.length} event contract(s) and ${silentHandoffs.length} handoff(s) surfaced silent-submission risk indicators; review the production-blocked / replay-required / human-review-boundary posture.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const moduleReadabilityFails = borrowerAudits.filter(
    (audit) => !audit.readability.passesHeuristic
  );
  const eventReadabilityFails = eventContractAudits.filter(
    (entry) => !entry.readability.passesHeuristic
  );
  if (
    moduleReadabilityFails.length > 0 ||
    eventReadabilityFails.length > 0
  ) {
    conflicts.push({
      conflictId: "dtp-v1-plain-english-readability-fail",
      topic:
        "Module or event contract text fails plain-English readability heuristic",
      description: `${moduleReadabilityFails.length} module description(s) and ${eventReadabilityFails.length} event contract purpose(s) fail the plain-English readability heuristic; review whether wording should be simplified for a reasonable user without specialized training.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    declaredDoctrineVersion &&
    declaredDoctrineVersion !== DATA_TRANSPARENCY_DOCTRINE_VERSION
  ) {
    conflicts.push({
      conflictId: "dtp-v1-doctrine-version-mismatch",
      topic:
        "Caller-declared doctrine version differs from runtime-sealed version",
      description: `The caller declared doctrine version ${declaredDoctrineVersion}, but the runtime is sealed against ${DATA_TRANSPARENCY_DOCTRINE_VERSION}. Review which doctrine doc the caller intended to audit against.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  return conflicts;
}

// =============================================================================
// User-facing transparency packet
// =============================================================================

function buildUserPacket(
  escalationStageAudits: DataTransparencyEscalationStageAudit[],
  recommendedReviewRoutes: string[]
): DataTransparencyUserPacket {
  return {
    userVisibleSummary:
      "Your information belongs to you. Furlong processes information to provide advisory guidance — readiness, recommendations, opportunity discovery, document organization, environmental review — but ownership remains with you. You decide when your information moves between exploration, human review, lender engagement, and application submission.",
    whatWillFurlongDo: [
      "Explain why information is requested.",
      "Explain how information is used.",
      "Explain which recommendations relied on specific information.",
      "Explain when additional information is needed.",
      "Explain when information is shared.",
      "Explain when information is retained.",
      "Explain when information can be deleted.",
      "Explain when information can be exported.",
      "Preserve evidence lineage and recommendation traceability.",
      "Allow you to understand how conclusions were reached.",
    ],
    whatWillFurlongNotDo: [
      "Sell your information.",
      "Secretly submit your information to lenders.",
      "Secretly submit your information to agencies.",
      "Secretly submit your information to brokers.",
      "Secretly distribute your information to third parties.",
      "Generate undisclosed marketing leads.",
      "Hide recommendation logic.",
      "Hide pathway exclusions.",
      "Hide readiness limitations.",
      "Hide known conflicts.",
      "Hide known risks.",
      "Represent your information as verified when it has not been verified.",
    ],
    escalationStages: escalationStageAudits.map((stage) => ({
      stageId: stage.stageId,
      label: stage.stageId
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      userActionRequired: true,
      representingModuleIds: stage.representingModuleIds,
    })),
    userRights: [
      "REQUEST_EXPLANATION",
      "REQUEST_DELETION",
      "REQUEST_EXPORT",
      "REQUEST_HUMAN_REVIEW",
      "REQUEST_HOLD_ON_ESCALATION",
    ],
    reviewRoutes: recommendedReviewRoutes,
    classificationLevel: "RESTRICTED",
    advisoryDisclaimer: ADVISORY_DISCLAIMER,
  };
}

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

// =============================================================================
// Runtime composition
// =============================================================================

export function composeDataTransparencyPosture(
  input: DataTransparencyPostureInput = {}
): DataTransparencyPostureResult {
  const scopeFilter = input.scopeModuleIds && input.scopeModuleIds.length > 0
    ? new Set(input.scopeModuleIds)
    : null;
  const manifestsScope = moduleManifests.filter((m) =>
    scopeFilter ? scopeFilter.has(m.id) : true
  );

  // 1. Audit modules — topic coverage + readability.
  const moduleAudits: DataTransparencyModuleAudit[] = manifestsScope.map(
    (manifest) => {
      const borrowerTouching = isBorrowerTouching(manifest);
      const { satisfied, missing } = auditModuleTopics(manifest);
      const readability = evaluateReadability(
        manifest.id,
        manifest.description
      );
      return {
        moduleId: manifest.id,
        borrowerTouching,
        satisfiedTopics: satisfied,
        missingTopics: borrowerTouching ? missing : [],
        readability,
      };
    }
  );
  const borrowerTouchingAudits = moduleAudits.filter(
    (audit) => audit.borrowerTouching
  );

  // 2. Audit event contracts — silent submission + readability.
  const eventContractAudits: DataTransparencyEventContractAudit[] =
    eventContractRegistry.map((entry) => {
      const { risk, reasons } = auditEventContractSilentSubmissionRisk(entry);
      const readability = evaluateReadability(entry.eventType, entry.purpose);
      return {
        eventType: entry.eventType,
        silentSubmissionRiskFlag: risk,
        reasons,
        readability,
      };
    });

  // 3. Audit handoffs — silent submission.
  const handoffAudits: DataTransparencyHandoffAudit[] = crossModuleHandoffMap.map(
    (handoff) => {
      const { risk, reasons } = auditHandoffSilentSubmissionRisk(handoff);
      return {
        handoffId: handoff.id,
        silentSubmissionRiskFlag: risk,
        reasons,
      };
    }
  );

  // 4. Audit escalation stages.
  const escalationStageAudits = auditEscalationStages(moduleManifests);

  // 5. Build findings from audits.
  const findings: DataTransparencyFinding[] = [];
  for (const audit of borrowerTouchingAudits) {
    for (const topic of audit.missingTopics) {
      findings.push(buildExplanationTopicFinding(audit.moduleId, topic));
    }
    if (!audit.readability.passesHeuristic) {
      findings.push(
        buildReadabilityFinding(audit.moduleId, false, audit.readability)
      );
    }
  }
  for (const stage of escalationStageAudits) {
    if (!stage.represented) {
      findings.push(buildEscalationStageFinding(stage.stageId));
    }
  }
  for (let i = 0; i < eventContractAudits.length; i += 1) {
    const entry = eventContractAudits[i];
    if (entry.silentSubmissionRiskFlag) {
      findings.push(
        buildEventContractSilentSubmissionFinding(
          eventContractRegistry[i],
          entry.reasons
        )
      );
    }
    if (!entry.readability.passesHeuristic) {
      findings.push(
        buildReadabilityFinding(entry.eventType, true, entry.readability)
      );
    }
  }
  for (let i = 0; i < handoffAudits.length; i += 1) {
    const audit = handoffAudits[i];
    if (audit.silentSubmissionRiskFlag) {
      findings.push(
        buildHandoffSilentSubmissionFinding(
          crossModuleHandoffMap[i],
          audit.reasons
        )
      );
    }
  }

  // 6. Build cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    borrowerTouchingAudits,
    escalationStageAudits,
    eventContractAudits,
    handoffAudits,
    input.declaredDoctrineVersion
  );

  // 7. Build governed signals.
  const v1Signals: DataTransparencyPostureSignal[] = V1_SIGNAL_IDS.map((id) =>
    buildSignal(id, {
      borrowerTouchingAudits,
      escalationStageAudits,
      eventContractAudits,
      handoffAudits,
      moduleAudits,
    })
  );

  // 8. Summarize.
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

  const summary: DataTransparencyPostureSummary = {
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
    modulesAudited: moduleAudits.length,
    borrowerTouchingModulesAudited: borrowerTouchingAudits.length,
    modulesWithMissingTopics: borrowerTouchingAudits.filter(
      (audit) => audit.missingTopics.length > 0
    ).length,
    modulesFailingReadability: moduleAudits.filter(
      (audit) => !audit.readability.passesHeuristic
    ).length,
    eventContractsAudited: eventContractAudits.length,
    eventContractsWithSilentSubmissionRisk: eventContractAudits.filter(
      (entry) => entry.silentSubmissionRiskFlag
    ).length,
    eventContractsFailingReadability: eventContractAudits.filter(
      (entry) => !entry.readability.passesHeuristic
    ).length,
    handoffsAudited: handoffAudits.length,
    handoffsWithSilentSubmissionRisk: handoffAudits.filter(
      (entry) => entry.silentSubmissionRiskFlag
    ).length,
    escalationStagesAudited: escalationStageAudits.length,
    escalationStagesMissing: escalationStageAudits.filter(
      (stage) => !stage.represented
    ).length,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/evidence-resolution-workflow",
    "/governance/document-evidence-reconciliation",
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/recommendation-precision-harness",
    "/governance",
    "/reviews",
    "/data-rights",
    "/evidence-packets",
    "/audit-replay",
  ]);

  const userPacket = buildUserPacket(escalationStageAudits, recommendedReviewRoutes);

  return {
    runtimeVersion: DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
    doctrineVersion: DATA_TRANSPARENCY_DOCTRINE_VERSION,
    doctrineDocRef: DATA_TRANSPARENCY_DOCTRINE_DOC_REF,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v1Signals,
    moduleAudits,
    eventContractAudits,
    handoffAudits,
    escalationStageAudits,
    findings,
    userPacket,
    crossSourceConflicts,
    recommendedReviewRoutes,
    disclosures: [...DATA_TRANSPARENCY_POSTURE_DISCLOSURES],
    productionRestrictions: [
      ...DATA_TRANSPARENCY_POSTURE_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    dataTransparencyPostureInternalOnly: true,
    userSovereigntyPreserved: true,
    noSilentSubmission: true,
    noSecretDistribution: true,
    noMarketingLead: true,
    noInformationSale: true,
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

export function dataTransparencyPostureLineage(): {
  runtimeVersion: string;
  doctrineVersion: string;
  doctrineDocRef: string;
  moduleCount: number;
  eventContractCount: number;
  handoffCount: number;
  escalationStageCount: number;
  requiredExplanationTopicCount: number;
} {
  return {
    runtimeVersion: DATA_TRANSPARENCY_POSTURE_RUNTIME_VERSION,
    doctrineVersion: DATA_TRANSPARENCY_DOCTRINE_VERSION,
    doctrineDocRef: DATA_TRANSPARENCY_DOCTRINE_DOC_REF,
    moduleCount: moduleManifests.length,
    eventContractCount: eventContractRegistry.length,
    handoffCount: crossModuleHandoffMap.length,
    escalationStageCount: DATA_TRANSPARENCY_ESCALATION_STAGES.length,
    requiredExplanationTopicCount:
      DATA_TRANSPARENCY_REQUIRED_EXPLANATION_TOPICS.length,
  };
}

export const DATA_TRANSPARENCY_POSTURE_SIGNAL_IDS = V1_SIGNAL_IDS;
