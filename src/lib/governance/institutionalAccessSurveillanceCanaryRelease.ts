import { createHash, randomUUID } from "node:crypto";
import type { SurveillancePlan } from "@/lib/governance/institutionalAccessSurveillanceOrchestrator";
import type { SurveillanceActivationPacket } from "@/lib/governance/institutionalAccessSurveillanceActivationCeremony";

export const INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE =
  "INSTITUTIONAL-SURVEILLANCE-CANARY-RELEASE-001" as const;

export type InstitutionalSurveillanceCanaryTranscript = Readonly<{
  rule: typeof INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE;
  canaryRunId: string;
  executedAt: string;
  dryRun: true;
  grantsEvaluated: number;
  clean: number;
  reviewRequired: number;
  wouldRevoke: number;
  mutationCount: 0;
  duplicateRevocationAttempts: number;
  errorCount: number;
  planSnapshotSha256: string;
  status: "PASSED" | "FAILED";
  blockers: readonly string[];
}>;

export type InstitutionalSurveillanceSchedulerReleasePacket = Readonly<{
  rule: typeof INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE;
  releaseId: string;
  status: "READY_FOR_SCHEDULER_CREATION" | "BLOCKED";
  blockers: readonly string[];
  activationPacketSha256: string;
  canaryRunId: string;
  canarySnapshotSha256: string;
  schedulerCreationPermitted: boolean;
  schedulerEnablementPermitted: false;
  schedulerCreationPerformed: false;
  schedulerEnablementPerformed: false;
  legalOrGovernanceApproverId: string;
  securityOrOperationsApproverId: string;
  releaseReason: string;
  createdAt: string;
  packetSha256: string;
}>;

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

function sha(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

export function composeInstitutionalSurveillanceCanaryTranscript(input: {
  plans: readonly SurveillancePlan[];
  executedAt: string;
  duplicateRevocationAttempts?: number;
  errors?: readonly string[];
  canaryRunId?: string;
}): InstitutionalSurveillanceCanaryTranscript {
  const duplicateRevocationAttempts = input.duplicateRevocationAttempts ?? 0;
  const errorCount = input.errors?.length ?? 0;
  const blockers: string[] = [];
  if (duplicateRevocationAttempts > 0) blockers.push("DUPLICATE_REVOCATION_ATTEMPT");
  if (errorCount > 0) blockers.push("CANARY_EXECUTION_ERROR");
  for (const plan of input.plans) {
    if (!/^[a-f0-9]{64}$/.test(plan.snapshotSha256)) blockers.push("INVALID_PLAN_SNAPSHOT");
    if (!plan.grantId.trim()) blockers.push("GRANT_ID_REQUIRED");
  }
  const uniqueBlockers = [...new Set(blockers)];
  return {
    rule: INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE,
    canaryRunId: input.canaryRunId ?? `surveillance-canary-${randomUUID()}`,
    executedAt: input.executedAt,
    dryRun: true,
    grantsEvaluated: input.plans.length,
    clean: input.plans.filter((plan) => plan.status === "CLEAN").length,
    reviewRequired: input.plans.filter((plan) => plan.status === "REVIEW_REQUIRED").length,
    wouldRevoke: input.plans.filter((plan) => plan.status === "ACCESS_REVOKED").length,
    mutationCount: 0,
    duplicateRevocationAttempts,
    errorCount,
    planSnapshotSha256: sha(input.plans),
    status: uniqueBlockers.length === 0 ? "PASSED" : "FAILED",
    blockers: uniqueBlockers,
  };
}

export function composeInstitutionalSurveillanceSchedulerReleasePacket(input: {
  activationPacket: SurveillanceActivationPacket;
  canary: InstitutionalSurveillanceCanaryTranscript;
  routeAuthenticationReady: boolean;
  legalOrGovernanceApproverId: string;
  securityOrOperationsApproverId: string;
  releaseReason: string;
  createdAt: string;
  releaseId?: string;
}): InstitutionalSurveillanceSchedulerReleasePacket {
  const blockers: string[] = [];
  if (!input.activationPacket.activationPermitted || input.activationPacket.status !== "READY_FOR_ACTIVATION")
    blockers.push("ACTIVATION_CEREMONY_NOT_READY");
  if (input.canary.status !== "PASSED" || !input.canary.dryRun || input.canary.mutationCount !== 0)
    blockers.push("CLEAN_NON_MUTATING_CANARY_REQUIRED");
  if (!input.routeAuthenticationReady) blockers.push("ROUTE_AUTHENTICATION_NOT_READY");
  if (!input.legalOrGovernanceApproverId.trim()) blockers.push("GOVERNANCE_APPROVER_REQUIRED");
  if (!input.securityOrOperationsApproverId.trim()) blockers.push("SECURITY_OPERATIONS_APPROVER_REQUIRED");
  if (input.legalOrGovernanceApproverId === input.securityOrOperationsApproverId)
    blockers.push("DUAL_CONTROL_REQUIRED");
  if (!input.releaseReason.trim()) blockers.push("RELEASE_REASON_REQUIRED");
  if (input.activationPacket.input.canaryRunId !== input.canary.canaryRunId)
    blockers.push("CANARY_ACTIVATION_PACKET_MISMATCH");
  const uniqueBlockers = [...new Set(blockers)];
  const core = {
    rule: INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE_RULE,
    releaseId: input.releaseId ?? `surveillance-release-${randomUUID()}`,
    status: (uniqueBlockers.length === 0 ? "READY_FOR_SCHEDULER_CREATION" : "BLOCKED") as
      | "READY_FOR_SCHEDULER_CREATION"
      | "BLOCKED",
    blockers: uniqueBlockers,
    activationPacketSha256: input.activationPacket.packetSha256,
    canaryRunId: input.canary.canaryRunId,
    canarySnapshotSha256: input.canary.planSnapshotSha256,
    schedulerCreationPermitted: uniqueBlockers.length === 0,
    schedulerEnablementPermitted: false as const,
    schedulerCreationPerformed: false as const,
    schedulerEnablementPerformed: false as const,
    legalOrGovernanceApproverId: input.legalOrGovernanceApproverId,
    securityOrOperationsApproverId: input.securityOrOperationsApproverId,
    releaseReason: input.releaseReason,
    createdAt: input.createdAt,
  };
  return { ...core, packetSha256: sha(core) };
}
