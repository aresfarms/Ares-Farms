import { createHash } from "node:crypto";

import type { ProductionPromotionReadinessPacket } from "@/lib/governance/productionPromotionReadiness";
import type { InternalChangeVerificationReport } from "@/lib/governance/internalChangeVerification";

export const FINAL_PRODUCTION_PROMOTION_DECISION_RULE =
  "FINAL-PRODUCTION-PROMOTION-DECISION-PACKET-001" as const;

export type PromotionApprovalRole =
  | "TECHNICAL_CONSTITUTIONAL_ATTESTATION"
  | "FINANCE_RELEASE_RISK_APPROVAL"
  | "PUBLIC_INDEPENDENT_FINAL_REVIEW";

export type PromotionApprovalRecord = {
  approvalId: string;
  principalId: string;
  role: PromotionApprovalRole;
  decision: "APPROVE" | "REJECT";
  signedAt: string;
  readinessPacketSha256: string;
  internalChangeVerificationReportSha256: string;
  signatureRef: string;
};

export type FinalProductionPromotionDecisionInput = {
  readinessPacket: ProductionPromotionReadinessPacket;
  internalChangeVerificationReport: InternalChangeVerificationReport;
  liveImageDigest: string;
  credentialAllowlistEmails: string[];
  activationWindowStart: string;
  activationWindowEnd: string;
  rollbackOwnerPrincipalId: string;
  approvals: PromotionApprovalRecord[];
};

export type FinalProductionPromotionDecisionPacket = {
  rule: typeof FINAL_PRODUCTION_PROMOTION_DECISION_RULE;
  status: "BLOCKED" | "READY_FOR_ACTIVATION_CEREMONY";
  finalPromotionAuthorized: false;
  liveActionAuthorityGranted: false;
  readinessPacketSha256: string;
  liveImageDigest: string;
  credentialAllowlistSha256: string | null;
  credentialAllowlistCount: number;
  activationWindowStart: string;
  activationWindowEnd: string;
  rollbackOwnerPrincipalId: string;
  approvalRefs: Array<{
    approvalId: string;
    principalId: string;
    role: PromotionApprovalRole;
    decision: "APPROVE" | "REJECT";
    signedAt: string;
    signatureRef: string;
  }>;
  blockers: string[];
  packetSha256: string;
};

const REQUIRED_ROLES: PromotionApprovalRole[] = [
  "TECHNICAL_CONSTITUTIONAL_ATTESTATION",
  "FINANCE_RELEASE_RISK_APPROVAL",
  "PUBLIC_INDEPENDENT_FINAL_REVIEW",
];

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedAllowlist(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))].sort();
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function buildFinalProductionPromotionDecisionPacket(
  input: FinalProductionPromotionDecisionInput,
): FinalProductionPromotionDecisionPacket {
  const allowlist = normalizedAllowlist(input.credentialAllowlistEmails);
  const approvalRefs = input.approvals.map((approval) => ({
    approvalId: approval.approvalId,
    principalId: approval.principalId,
    role: approval.role,
    decision: approval.decision,
    signedAt: approval.signedAt,
    signatureRef: approval.signatureRef,
  }));
  const blockers: string[] = [];

  if (!input.readinessPacket.technicalPerimeterReady)
    blockers.push("technical-perimeter-not-ready");
  if (input.internalChangeVerificationReport.status !== "APPROVED_FOR_ACTIVATION" || !input.internalChangeVerificationReport.activationAllowed)
    blockers.push("internal-change-verification-not-approved");
  if (!/^sha256:[a-f0-9]{64}$/.test(input.liveImageDigest))
    blockers.push("invalid-live-image-digest");
  if (allowlist.length === 0) blockers.push("credential-allowlist-missing");
  if (!input.rollbackOwnerPrincipalId.trim()) blockers.push("rollback-owner-missing");
  if (!validDate(input.activationWindowStart) || !validDate(input.activationWindowEnd)) {
    blockers.push("activation-window-invalid");
  } else if (Date.parse(input.activationWindowEnd) <= Date.parse(input.activationWindowStart)) {
    blockers.push("activation-window-not-bounded");
  }

  for (const role of REQUIRED_ROLES) {
    const matches = input.approvals.filter((approval) => approval.role === role);
    if (matches.length !== 1) blockers.push(`approval-${role.toLowerCase()}-missing-or-duplicate`);
  }

  const principals = input.approvals.map((approval) => approval.principalId);
  if (new Set(principals).size !== 3 || principals.length != 3)
    blockers.push("initial-launch-requires-three-distinct-founders");

  for (const approval of input.approvals) {
    if (approval.decision !== "APPROVE") blockers.push(`approval-rejected:${approval.role}`);
    if (approval.readinessPacketSha256 !== input.readinessPacket.packetSha256)
      blockers.push(`approval-packet-mismatch:${approval.role}`);
    if (!approval.signatureRef.trim()) blockers.push(`approval-signature-missing:${approval.role}`);
    if (!validDate(approval.signedAt)) blockers.push(`approval-date-invalid:${approval.role}`);
  }

  const unsigned = {
    rule: FINAL_PRODUCTION_PROMOTION_DECISION_RULE,
    status: blockers.length === 0
      ? ("READY_FOR_ACTIVATION_CEREMONY" as const)
      : ("BLOCKED" as const),
    finalPromotionAuthorized: false as const,
    liveActionAuthorityGranted: false as const,
    readinessPacketSha256: input.readinessPacket.packetSha256,
    internalChangeVerificationReportSha256: input.internalChangeVerificationReport.reportSha256,
    liveImageDigest: input.liveImageDigest,
    credentialAllowlistSha256: allowlist.length ? sha(allowlist.join("\n")) : null,
    credentialAllowlistCount: allowlist.length,
    activationWindowStart: input.activationWindowStart,
    activationWindowEnd: input.activationWindowEnd,
    rollbackOwnerPrincipalId: input.rollbackOwnerPrincipalId,
    approvalRefs,
    blockers: [...new Set(blockers)].sort(),
  };

  return { ...unsigned, packetSha256: sha(stable(unsigned)) };
}
