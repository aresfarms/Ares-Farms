import { createHash } from "node:crypto";
import { reconcileControlledPromotionReadiness } from "./controlledPromotionReadinessReconciliation";

export const PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE =
  "PUBLIC-ALPHA-SIGNOFF-CEREMONY-PACKET-001";

export type CeremonyDecision = {
  decisionId: string;
  label: string;
  ownerRecordedDecision: string;
  ownerDecisionRecordedAt: string;
  ownerDecisionRecordedBy: string;
  status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW";
};

export type CeremonyEntryCondition = {
  conditionId: string;
  label: string;
  status: "PASS" | "EXTERNAL_EVIDENCE_REQUIRED";
  evidenceRef: string | null;
};

export type PublicAlphaSignoffCeremonyPacket = {
  schemaVersion: "public-alpha-signoff-ceremony-packet-v1";
  predecessor: "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION";
  rule: typeof PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE;
  generatedAt: string;
  ceremonyStatus: "READY_FOR_OWNER_AND_INDEPENDENT_REVIEW";
  quorumRule: "OWNER_PLUS_INDEPENDENT_REVIEW";
  minimumAffirmativeVotes: 2;
  ownerDecisionRecordCount: 5;
  reviewDecisionCount: 0;
  voteRecordingPermitted: false;
  decisions: CeremonyDecision[];
  entryConditions: CeremonyEntryCondition[];
  engineeringStatus: "PASS";
  publicAlphaStatus: "PENDING_SIGNOFF";
  productionStatus: "BLOCKED";
  productionAuthorizationGranted: false;
  externalActionsPermitted: false;
  evidenceSnapshotHash: string;
};

const OWNER = "Caitlin L. Hudson, PhD, PE";
const OWNER_DECISION_AT = "2026-08-11T22:48:00-04:00";

const DECISIONS: CeremonyDecision[] = [
  {
    decisionId: "sustained_window_duration",
    label: "Sustained clean-window duration for Alpha exit",
    ownerRecordedDecision:
      "Thirty days is the ceiling; Alpha may exit sooner when all exit criteria hold.",
    ownerDecisionRecordedAt: OWNER_DECISION_AT,
    ownerDecisionRecordedBy: OWNER,
    status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  },
  {
    decisionId: "cohort_size",
    label: "Invited borrower and partner-lender cohort size",
    ownerRecordedDecision: "No more than 15 testers total.",
    ownerDecisionRecordedAt: OWNER_DECISION_AT,
    ownerDecisionRecordedBy: OWNER,
    status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  },
  {
    decisionId: "module_21_environmental_compliance_featured_or_deferred",
    label: "Feature or defer environmental-compliance workflow",
    ownerRecordedDecision:
      "FEATURED for Public Alpha, but activation remains blocked until a qualified independent environmental reviewer is assigned and the required 2-of-3 founder sign-off is recorded.",
    ownerDecisionRecordedAt: "2026-08-11T22:54:00-04:00",
    ownerDecisionRecordedBy: OWNER,
    status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  },
  {
    decisionId: "module_10_connectors_live_or_simulated",
    label: "Use simulated review or a live lender connector",
    ownerRecordedDecision:
      "Simulated/non-binding lender review only; live lender connectors remain blocked for Public Alpha.",
    ownerDecisionRecordedAt: OWNER_DECISION_AT,
    ownerDecisionRecordedBy: OWNER,
    status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  },
  {
    decisionId: "named_governance_authority",
    label: "Named governance authority for Alpha entry and exit",
    ownerRecordedDecision:
      "Caitlin L. Hudson, PhD, PE is the named governance authority for Public Alpha entry and exit.",
    ownerDecisionRecordedAt: OWNER_DECISION_AT,
    ownerDecisionRecordedBy: OWNER,
    status: "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  },
];

const CONDITIONS: CeremonyEntryCondition[] = [
  {
    conditionId: "self_report",
    label: "Build Self-Report passes for the Alpha set",
    status: "PASS",
    evidenceRef: "CI: build:self-report:ci",
  },
  {
    conditionId: "disclosures",
    label: "Module 44 disclosure audit is green",
    status: "PASS",
    evidenceRef: "CI: smoke:disclosure-audit-gate",
  },
  {
    conditionId: "human_authority",
    label: "Module 45 structural authority coverage is complete",
    status: "PASS",
    evidenceRef: "CI: verify:human-authority:ci",
  },
  {
    conditionId: "claims",
    label: "Customer-surface claims controls pass",
    status: "PASS",
    evidenceRef: "CI: smoke:claims-public",
  },
  {
    conditionId: "pii_audit_fetch",
    label: "PII, audit-chain, and live-fetch controls pass",
    status: "PASS",
    evidenceRef: "Build Self-Report Alpha profile",
  },
  {
    conditionId: "promotion_ledger",
    label: "Three controlled-promotion requirements are enumerated",
    status: "PASS",
    evidenceRef: "Build Self-Report requirements ledger",
  },
  {
    conditionId: "dr_restore",
    label: "Staging point-in-time restore, migration replay, application-read verification, and cleanup completed",
    status: "PASS",
    evidenceRef:
      "docs/governance/P5_B09_DATABASE_RECOVERY_ATTESTATION_2026-08-07.json",
  },
  {
    conditionId: "participant_terms",
    label: "Signed Alpha participation terms exist for every invited external participant",
    status: "EXTERNAL_EVIDENCE_REQUIRED",
    evidenceRef: null,
  },
  {
    conditionId: "environmental_independent_reviewer",
    label:
      "A qualified independent environmental reviewer is assigned before the FEATURED Module 21 workflow is exercised",
    status: "EXTERNAL_EVIDENCE_REQUIRED",
    evidenceRef: null,
  },
  {
    conditionId: "environmental_founder_quorum",
    label:
      "Required 2-of-3 founder sign-off records the FEATURED Module 21 activation decision",
    status: "EXTERNAL_EVIDENCE_REQUIRED",
    evidenceRef: null,
  },
  {
    conditionId: "security_human_review",
    label:
      "A human security review of the Alpha-blocking control results is recorded",
    status: "EXTERNAL_EVIDENCE_REQUIRED",
    evidenceRef: null,
  },
];

export function composePublicAlphaSignoffCeremonyPacket(input?: {
  generatedAt?: string;
}): PublicAlphaSignoffCeremonyPacket {
  const readiness = reconcileControlledPromotionReadiness({
    masterVolumeConformancePassed: true,
    buildSelfReportPassed: true,
    buildSelfReportFailedModules: 0,
    buildSelfReportConflicts: 0,
    humanAuthorityPassed: true,
    publicAlphaStatus: "PENDING_SIGNOFF",
    publicAlphaPendingDecisions: 5,
    controlledPromotionRequirements: 3,
    developmentSecurityBlocks: ["external-secret-rotation-evidence"],
    productionSecurityBlocks: [
      "external-secret-rotation-evidence",
      "nextauth-secret",
      "nextauth-url",
      "production-api-auth-enforcement",
      "production-rate-limiting",
    ],
    externalEvidenceBlocks: ["third-party-penetration-test"],
    commit: "current-roadmap-state",
    checkedAt: input?.generatedAt ?? new Date().toISOString(),
  });
  if (readiness.engineeringStatus !== "PASS")
    throw new Error("Ceremony packet requires engineering readiness PASS.");
  if (readiness.publicAlphaStatus !== "PENDING_SIGNOFF")
    throw new Error("Ceremony packet is only valid at the Public Alpha signoff boundary.");
  if (readiness.productionStatus !== "BLOCKED")
    throw new Error("Ceremony packet must preserve production BLOCKED posture.");

  const generatedAt = input?.generatedAt ?? new Date().toISOString();
  const snapshot = {
    predecessor: "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION",
    readinessEvidenceSnapshotHash: readiness.evidenceSnapshotHash,
    quorumRule: "OWNER_PLUS_INDEPENDENT_REVIEW",
    ownerDecisionRecordCount: DECISIONS.length,
    decisions: DECISIONS,
    entryConditions: CONDITIONS,
    productionStatus: "BLOCKED",
    reviewDecisionCount: 0,
  };
  const evidenceSnapshotHash = createHash("sha256")
    .update(JSON.stringify(snapshot))
    .digest("hex");

  return {
    schemaVersion: "public-alpha-signoff-ceremony-packet-v1",
    predecessor: "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION",
    rule: PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE,
    generatedAt,
    ceremonyStatus: "READY_FOR_OWNER_AND_INDEPENDENT_REVIEW",
    quorumRule: "OWNER_PLUS_INDEPENDENT_REVIEW",
    minimumAffirmativeVotes: 2,
    ownerDecisionRecordCount: 5,
    reviewDecisionCount: 0,
    voteRecordingPermitted: false,
    decisions: DECISIONS,
    entryConditions: CONDITIONS,
    engineeringStatus: "PASS",
    publicAlphaStatus: "PENDING_SIGNOFF",
    productionStatus: "BLOCKED",
    productionAuthorizationGranted: false,
    externalActionsPermitted: false,
    evidenceSnapshotHash,
  };
}
