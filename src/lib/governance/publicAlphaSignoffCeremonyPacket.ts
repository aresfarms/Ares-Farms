import { createHash } from "node:crypto";
import { reconcileControlledPromotionReadiness } from "./controlledPromotionReadinessReconciliation";

export const PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE =
  "PUBLIC-ALPHA-SIGNOFF-CEREMONY-PACKET-001";

export type CeremonyDecision = {
  decisionId: string;
  label: string;
  doctrineProposal: string | null;
  status: "PENDING_OWNER_DECISION";
};

export type CeremonyEntryCondition = {
  conditionId: string;
  label: string;
  status: "PASS" | "EXTERNAL_EVIDENCE_REQUIRED";
};

export type PublicAlphaSignoffCeremonyPacket = {
  schemaVersion: "public-alpha-signoff-ceremony-packet-v1";
  predecessor: "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION";
  rule: typeof PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE;
  generatedAt: string;
  ceremonyStatus: "READY_FOR_OWNER_AND_INDEPENDENT_REVIEW";
  quorumRule: "OWNER_PLUS_INDEPENDENT_REVIEW";
  minimumAffirmativeVotes: 2;
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

const DECISIONS: CeremonyDecision[] = [
  {
    decisionId: "sustained_window_duration",
    label: "Sustained clean-window duration for Alpha exit",
    doctrineProposal: "30 days",
    status: "PENDING_OWNER_DECISION",
  },
  {
    decisionId: "cohort_size",
    label: "Invited borrower and partner-lender cohort size",
    doctrineProposal: null,
    status: "PENDING_OWNER_DECISION",
  },
  {
    decisionId: "module_21_environmental_compliance_featured_or_deferred",
    label: "Feature or defer environmental-compliance workflow",
    doctrineProposal: "Deferred for Alpha unless a qualified independent reviewer is assigned",
    status: "PENDING_OWNER_DECISION",
  },
  {
    decisionId: "module_10_connectors_live_or_simulated",
    label: "Use simulated review or a live lender connector",
    doctrineProposal: "Simulated review; live external connectors remain blocked",
    status: "PENDING_OWNER_DECISION",
  },
  {
    decisionId: "named_governance_authority",
    label: "Named governance authority for Alpha entry and exit",
    doctrineProposal: null,
    status: "PENDING_OWNER_DECISION",
  },
];

const CONDITIONS: CeremonyEntryCondition[] = [
  { conditionId: "self_report", label: "Build Self-Report passes for the Alpha set", status: "PASS" },
  { conditionId: "disclosures", label: "Module 44 disclosure audit is green", status: "PASS" },
  { conditionId: "human_authority", label: "Module 45 authority coverage is complete", status: "PASS" },
  { conditionId: "claims", label: "Customer-surface claims controls pass", status: "PASS" },
  { conditionId: "pii_audit_fetch", label: "PII, audit-chain, and live-fetch controls pass", status: "PASS" },
  { conditionId: "promotion_ledger", label: "Three controlled-promotion requirements are enumerated", status: "PASS" },
  { conditionId: "dr_restore", label: "Committed/tagged tree and recorded DR restore test", status: "EXTERNAL_EVIDENCE_REQUIRED" },
  { conditionId: "participant_terms", label: "Signed Alpha participation terms for every invited participant", status: "EXTERNAL_EVIDENCE_REQUIRED" },
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
