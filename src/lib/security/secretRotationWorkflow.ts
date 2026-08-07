import { randomBytes, randomUUID } from "node:crypto";

import {
  rotationEntry,
  secretRotationPolicy,
  type SecretRotationPolicyEntry,
} from "@/lib/security/secretRotationPolicy";

export type RotationReason = "SCHEDULED" | "SUSPECTED_DISCLOSURE" | "OPERATOR_REQUEST";
export type RotationPhase = "ACTIVATE" | "RETIRE";

export type SecretRotationRequest = Readonly<{
  secretName: string;
  reason: RotationReason;
  phase: RotationPhase;
  requestedAt: string;
  rotationId?: string;
  activatedVersion?: string;
  previousVersion?: string;
  providerCredentialId?: string;
  previousProviderCredentialId?: string;
}>;

export type ReplacementCredential = Readonly<{
  value: string;
  providerCredentialId: string;
  previousProviderCredentialId: string | null;
  providerEventReference: string;
}>;

export type RotationEvidence = Readonly<{
  rotationId: string;
  secretName: string;
  reason: RotationReason;
  tier: string;
  provider: string;
  activatedVersion: string;
  previousVersion: string | null;
  providerCredentialId: string;
  previousProviderCredentialId: string | null;
  providerEventReference: string;
  rolloutEvidence: readonly string[];
  validationEvidence: readonly string[];
  retirementScheduledFor: string;
  valuesDisplayed: false;
  productionAuthorized: false;
}>;

export type RotationActivationResult = Readonly<{
  ok: true;
  state: "AWAITING_RETIREMENT";
  acknowledgeSourceEvent: true;
  evidence: RotationEvidence;
}>;

export type RotationRetirementResult = Readonly<{
  ok: true;
  state: "COMPLETE";
  acknowledgeSourceEvent: true;
  rotationId: string;
  secretName: string;
}>;

export type RotationBlockedResult = Readonly<{
  ok: false;
  state: "BLOCKED" | "FAILED_ROLLED_BACK" | "FAILED_MANUAL_RECOVERY_REQUIRED";
  acknowledgeSourceEvent: false;
  secretName: string;
  rotationId: string;
  reason: string;
}>;

export type SecretRotationResult = RotationActivationResult | RotationRetirementResult | RotationBlockedResult;

export interface SecretRotationDependencies {
  now(): Date;
  supports(entry: SecretRotationPolicyEntry): boolean;
  currentEnabledVersion(secretName: string): Promise<string | null>;
  createProviderCredential(entry: SecretRotationPolicyEntry, rotationId: string): Promise<ReplacementCredential>;
  addSecretVersion(secretName: string, value: string): Promise<string>;
  validateReplacement(entry: SecretRotationPolicyEntry, version: string): Promise<readonly string[]>;
  rolloutConsumers(entry: SecretRotationPolicyEntry, version: string, rotationId: string): Promise<readonly string[]>;
  validateConsumers(entry: SecretRotationPolicyEntry, version: string): Promise<readonly string[]>;
  rollbackConsumers(entry: SecretRotationPolicyEntry, previousVersion: string | null, rotationId: string): Promise<void>;
  disableSecretVersion(secretName: string, version: string): Promise<void>;
  revokeProviderCredential(entry: SecretRotationPolicyEntry, providerCredentialId: string): Promise<void>;
  scheduleRetirement(request: SecretRotationRequest, runAt: string): Promise<void>;
  recordActivationEvidence(evidence: RotationEvidence): Promise<void>;
  recordCompletionEvidence(request: SecretRotationRequest): Promise<void>;
  alertFailure(input: Readonly<{ rotationId: string; secretName: string; reason: string; emergency: boolean }>): Promise<void>;
}

export function generateInternalReplacement(): ReplacementCredential {
  return {
    value: randomBytes(48).toString("base64url"),
    providerCredentialId: `furlong-internal:${randomUUID()}`,
    previousProviderCredentialId: null,
    providerEventReference: `INTERNAL_RANDOM_GENERATION:${new Date().toISOString()}`,
  };
}

function retirementTime(now: Date, overlapHours: number, emergency: boolean): string {
  const overlapMs = emergency ? 0 : overlapHours * 3_600_000;
  return new Date(now.getTime() + overlapMs).toISOString();
}

async function fail(
  dependencies: SecretRotationDependencies,
  request: SecretRotationRequest,
  rotationId: string,
  reason: string,
  state: RotationBlockedResult["state"] = "BLOCKED"
): Promise<RotationBlockedResult> {
  await dependencies.alertFailure({
    rotationId,
    secretName: request.secretName,
    reason,
    emergency: request.reason === "SUSPECTED_DISCLOSURE",
  });
  return { ok: false, state, acknowledgeSourceEvent: false, secretName: request.secretName, rotationId, reason };
}

export async function executeSecretRotation(
  request: SecretRotationRequest,
  dependencies: SecretRotationDependencies
): Promise<SecretRotationResult> {
  const rotationId = request.rotationId ?? randomUUID();
  const entry = rotationEntry(request.secretName);
  if (!entry) return fail(dependencies, request, rotationId, "Secret is not present in the governed rotation policy.");

  if (request.phase === "RETIRE") {
    if (!request.activatedVersion) {
      return fail(dependencies, request, rotationId, "Retirement request lacks activation identifiers.");
    }
    try {
      if (request.previousVersion && request.previousVersion !== request.activatedVersion) {
        await dependencies.disableSecretVersion(entry.name, request.previousVersion);
      }
      if (request.previousProviderCredentialId) {
        await dependencies.revokeProviderCredential(entry, request.previousProviderCredentialId);
      }
      await dependencies.recordCompletionEvidence({ ...request, rotationId });
      return { ok: true, state: "COMPLETE", acknowledgeSourceEvent: true, rotationId, secretName: entry.name };
    } catch (error) {
      return fail(
        dependencies,
        request,
        rotationId,
        error instanceof Error ? error.message : "Credential retirement failed.",
        "FAILED_MANUAL_RECOVERY_REQUIRED"
      );
    }
  }

  if (!dependencies.supports(entry)) {
    const cadence = secretRotationPolicy.tiers[entry.tier].rotationDays;
    return fail(
      dependencies,
      request,
      rotationId,
      `${entry.automation} is not configured for ${entry.provider}; ${cadence}-day reminder remains unacknowledged.`
    );
  }

  const previousVersion = await dependencies.currentEnabledVersion(entry.name);
  let replacement: ReplacementCredential | null = null;
  let activatedVersion: string | null = null;

  try {
    replacement = entry.automation === "AUTOMATED_INTERNAL"
      ? generateInternalReplacement()
      : await dependencies.createProviderCredential(entry, rotationId);
    activatedVersion = await dependencies.addSecretVersion(entry.name, replacement.value);
    const validationEvidence = await dependencies.validateReplacement(entry, activatedVersion);
    const rolloutEvidence = await dependencies.rolloutConsumers(entry, activatedVersion, rotationId);
    const consumerEvidence = await dependencies.validateConsumers(entry, activatedVersion);
    const retireAt = retirementTime(
      dependencies.now(),
      entry.overlapHours,
      request.reason === "SUSPECTED_DISCLOSURE"
    );
    const retirementRequest: SecretRotationRequest = {
      secretName: entry.name,
      reason: request.reason,
      phase: "RETIRE",
      requestedAt: dependencies.now().toISOString(),
      rotationId,
      activatedVersion,
      previousVersion: previousVersion ?? undefined,
      providerCredentialId: replacement.providerCredentialId,
      previousProviderCredentialId: replacement.previousProviderCredentialId ?? undefined,
    };
    const evidence: RotationEvidence = {
      rotationId,
      secretName: entry.name,
      reason: request.reason,
      tier: entry.tier,
      provider: entry.provider,
      activatedVersion,
      previousVersion,
      providerCredentialId: replacement.providerCredentialId,
      previousProviderCredentialId: replacement.previousProviderCredentialId,
      providerEventReference: replacement.providerEventReference,
      rolloutEvidence,
      validationEvidence: [...validationEvidence, ...consumerEvidence],
      retirementScheduledFor: retireAt,
      valuesDisplayed: false,
      productionAuthorized: false,
    };
    await dependencies.recordActivationEvidence(evidence);
    await dependencies.scheduleRetirement(retirementRequest, retireAt);
    return { ok: true, state: "AWAITING_RETIREMENT", acknowledgeSourceEvent: true, evidence };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Rotation activation failed.";
    try {
      await dependencies.rollbackConsumers(entry, previousVersion, rotationId);
      if (activatedVersion) await dependencies.disableSecretVersion(entry.name, activatedVersion);
      if (replacement) await dependencies.revokeProviderCredential(entry, replacement.providerCredentialId);
      return fail(dependencies, request, rotationId, reason, "FAILED_ROLLED_BACK");
    } catch (rollbackError) {
      const rollbackReason = rollbackError instanceof Error ? rollbackError.message : "rollback failed";
      return fail(
        dependencies,
        request,
        rotationId,
        `${reason}; manual recovery required: ${rollbackReason}`,
        "FAILED_MANUAL_RECOVERY_REQUIRED"
      );
    }
  } finally {
    if (replacement) replacement = { ...replacement, value: "" };
  }
}
