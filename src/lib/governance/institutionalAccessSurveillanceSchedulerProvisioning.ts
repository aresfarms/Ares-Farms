import { createHash, randomUUID } from "node:crypto";
import type { InstitutionalSurveillanceSchedulerReleasePacket } from "@/lib/governance/institutionalAccessSurveillanceCanaryRelease";

export const INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE =
  "INSTITUTIONAL-SURVEILLANCE-SCHEDULER-PROVISIONING-001" as const;

export type SchedulerProvisioningManifest = Readonly<{
  rule: typeof INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE;
  manifestId: string;
  status: "READY_FOR_PAUSED_CREATION" | "BLOCKED";
  blockers: readonly string[];
  releasePacketSha256: string;
  projectId: string;
  region: string;
  schedulerName: string;
  schedule: string;
  timeZone: string;
  targetUri: string;
  httpMethod: "POST";
  authenticationMode: "DEDICATED_SECRET" | "OIDC_SERVICE_IDENTITY";
  authenticationReference: string;
  schedulerIdentity: string;
  attemptDeadlineSeconds: number;
  retryCount: number;
  minBackoffSeconds: number;
  maxBackoffSeconds: number;
  initialState: "PAUSED";
  schedulerCreationPermitted: boolean;
  schedulerEnablementPermitted: false;
  secretValueIncluded: false;
  manifestSha256: string;
}>;

export type SchedulerPostCreateAttestation = Readonly<{
  rule: typeof INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE;
  attestationId: string;
  manifestSha256: string;
  observedJobName: string;
  observedState: "PAUSED" | "ENABLED" | "UNKNOWN";
  observedTargetUri: string;
  observedSchedule: string;
  executionCount: number;
  status: "PASS" | "FAIL";
  blockers: readonly string[];
  attestedAt: string;
  attestationSha256: string;
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

export function composeInstitutionalSurveillanceSchedulerManifest(input: {
  releasePacket: InstitutionalSurveillanceSchedulerReleasePacket;
  projectId: string;
  region: string;
  schedulerName: string;
  schedule: string;
  timeZone: string;
  targetUri: string;
  authenticationMode: "DEDICATED_SECRET" | "OIDC_SERVICE_IDENTITY";
  authenticationReference: string;
  schedulerIdentity: string;
  attemptDeadlineSeconds: number;
  retryCount: number;
  minBackoffSeconds: number;
  maxBackoffSeconds: number;
  requestedInitialState: "PAUSED" | "ENABLED";
  manifestId?: string;
}): SchedulerProvisioningManifest {
  const blockers: string[] = [];
  if (!input.releasePacket.schedulerCreationPermitted || input.releasePacket.status !== "READY_FOR_SCHEDULER_CREATION")
    blockers.push("CURRENT_RELEASE_PACKET_REQUIRED");
  if (!input.projectId.trim()) blockers.push("PROJECT_ID_REQUIRED");
  if (!input.region.trim()) blockers.push("REGION_REQUIRED");
  if (input.schedulerName !== "furlong-institutional-access-surveillance") blockers.push("CANONICAL_JOB_NAME_REQUIRED");
  if (input.targetUri !== "https://furlong-core-mwei3cj3jq-uc.a.run.app/api/internal/institutional-access-surveillance")
    blockers.push("CANONICAL_TARGET_URI_REQUIRED");
  if (!/^\*\/[5-9]|\*\/[1-5][0-9]|0 \* \* \* \*$/.test(input.schedule)) blockers.push("BOUNDED_SCHEDULE_REQUIRED");
  if (!input.timeZone.trim()) blockers.push("TIME_ZONE_REQUIRED");
  if (!input.authenticationReference.trim()) blockers.push("AUTHENTICATION_REFERENCE_REQUIRED");
  if (/secret\s*=|bearer\s+|token\s*=|[A-Za-z0-9_-]{32,}/i.test(input.authenticationReference) && !input.authenticationReference.startsWith("projects/"))
    blockers.push("PLAINTEXT_CREDENTIAL_PROHIBITED");
  if (!input.schedulerIdentity.trim()) blockers.push("SCHEDULER_IDENTITY_REQUIRED");
  if (input.attemptDeadlineSeconds < 15 || input.attemptDeadlineSeconds > 300) blockers.push("ATTEMPT_DEADLINE_OUT_OF_RANGE");
  if (input.retryCount < 0 || input.retryCount > 3) blockers.push("RETRY_COUNT_OUT_OF_RANGE");
  if (input.minBackoffSeconds < 5 || input.maxBackoffSeconds > 300 || input.minBackoffSeconds > input.maxBackoffSeconds)
    blockers.push("BACKOFF_OUT_OF_RANGE");
  if (input.requestedInitialState !== "PAUSED") blockers.push("INITIAL_STATE_MUST_BE_PAUSED");
  const uniqueBlockers = [...new Set(blockers)];
  const core = {
    rule: INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE,
    manifestId: input.manifestId ?? `surveillance-scheduler-manifest-${randomUUID()}`,
    status: (uniqueBlockers.length === 0 ? "READY_FOR_PAUSED_CREATION" : "BLOCKED") as "READY_FOR_PAUSED_CREATION" | "BLOCKED",
    blockers: uniqueBlockers,
    releasePacketSha256: input.releasePacket.packetSha256,
    projectId: input.projectId,
    region: input.region,
    schedulerName: input.schedulerName,
    schedule: input.schedule,
    timeZone: input.timeZone,
    targetUri: input.targetUri,
    httpMethod: "POST" as const,
    authenticationMode: input.authenticationMode,
    authenticationReference: input.authenticationReference,
    schedulerIdentity: input.schedulerIdentity,
    attemptDeadlineSeconds: input.attemptDeadlineSeconds,
    retryCount: input.retryCount,
    minBackoffSeconds: input.minBackoffSeconds,
    maxBackoffSeconds: input.maxBackoffSeconds,
    initialState: "PAUSED" as const,
    schedulerCreationPermitted: uniqueBlockers.length === 0,
    schedulerEnablementPermitted: false as const,
    secretValueIncluded: false as const,
  };
  return { ...core, manifestSha256: sha(core) };
}

export function attestPausedSchedulerCreation(input: {
  manifest: SchedulerProvisioningManifest;
  observedJobName: string;
  observedState: "PAUSED" | "ENABLED" | "UNKNOWN";
  observedTargetUri: string;
  observedSchedule: string;
  executionCount: number;
  attestedAt: string;
  attestationId?: string;
}): SchedulerPostCreateAttestation {
  const blockers: string[] = [];
  if (!input.manifest.schedulerCreationPermitted) blockers.push("VALID_MANIFEST_REQUIRED");
  if (input.observedJobName !== input.manifest.schedulerName) blockers.push("JOB_NAME_MISMATCH");
  if (input.observedState !== "PAUSED") blockers.push("JOB_NOT_PAUSED");
  if (input.observedTargetUri !== input.manifest.targetUri) blockers.push("TARGET_URI_MISMATCH");
  if (input.observedSchedule !== input.manifest.schedule) blockers.push("SCHEDULE_MISMATCH");
  if (input.executionCount !== 0) blockers.push("PREMATURE_EXECUTION_DETECTED");
  const uniqueBlockers = [...new Set(blockers)];
  const core = {
    rule: INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING_RULE,
    attestationId: input.attestationId ?? `surveillance-scheduler-attestation-${randomUUID()}`,
    manifestSha256: input.manifest.manifestSha256,
    observedJobName: input.observedJobName,
    observedState: input.observedState,
    observedTargetUri: input.observedTargetUri,
    observedSchedule: input.observedSchedule,
    executionCount: input.executionCount,
    status: (uniqueBlockers.length === 0 ? "PASS" : "FAIL") as "PASS" | "FAIL",
    blockers: uniqueBlockers,
    attestedAt: input.attestedAt,
  };
  return { ...core, attestationSha256: sha(core) };
}
